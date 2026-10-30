import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  gradeQuestion,
  isBlank,
  type QuestionResult,
  type QuestionStatus,
} from "~/app/agents/exam-evaluation/grade";
import { Response } from "../ai-elements/response";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";

export type ExamReviewData = {
  id: string;
  score: number;
  feedback: string;
  answers: unknown;
  questionResults: QuestionResult[] | null;
  exam: {
    title: string;
    instructions: string | null;
  };
  examVersion: {
    questionsToExamVersions: {
      question: {
        key: string;
        type: string;
        label: string;
        description: string | null;
        answer: unknown;
        questionOptions: { label: string; value: string }[];
      };
    }[];
  };
};

export type ReviewQuestion = {
  key: string;
  type: string;
  label: string;
  questionOptions: { label: string; value: string }[];
  userAnswer: unknown;
  correctAnswer: unknown;
  status: QuestionStatus;
  score: number;
  feedback?: string;
};

const OPTION_TYPES = ["radio", "checkbox", "select"];
const OPEN_TYPES = ["text", "textarea", "email", "date"];

// Prefers the grades stored on the server. Results saved before grading was stored fall back to recomputing objective questions.
export const toReviewQuestions = (data: ExamReviewData): ReviewQuestion[] => {
  const answers = (data.answers ?? {}) as Record<string, unknown>;
  const stored = new Map(
    (data.questionResults ?? []).map((item) => [item.key, item]),
  );

  return data.examVersion.questionsToExamVersions.map(({ question }) => {
    const userAnswer = answers[question.key];
    const grade =
      stored.get(question.key) ?? gradeQuestion(question, userAnswer);

    return {
      key: question.key,
      type: question.type,
      label: question.label,
      questionOptions: question.questionOptions,
      userAnswer,
      correctAnswer: question.answer,
      status: grade.status,
      score: grade.score,
      feedback: grade.feedback,
    };
  });
};

export const ExamQuestionReview = ({
  questions,
}: {
  questions: ReviewQuestion[];
}) => {
  const t = useTranslations("ExamReview");

  const formatAnswer = (question: ReviewQuestion, value: unknown) => {
    if (isBlank(value)) return null;

    if (question.type === "switch") {
      return value ? t("true") : t("false");
    }

    if (OPTION_TYPES.includes(question.type)) {
      const values = Array.isArray(value) ? value : [value];
      return values
        .map(
          (item) =>
            question.questionOptions.find(
              (option) => option.value === String(item),
            )?.label ?? String(item),
        )
        .join(", ");
    }

    if (question.type === "number" || question.type === "slider") {
      return String(Array.isArray(value) ? value[0] : value);
    }

    return String(value);
  };

  const statusView = (status: QuestionStatus) => {
    switch (status) {
      case "correct":
        return { Icon: CheckCircle, label: t("correct") };
      case "partial":
        return { Icon: AlertCircle, label: t("partial") };
      case "incorrect":
        return { Icon: XCircle, label: t("incorrect") };
      case "pending":
        return { Icon: Clock, label: t("pending") };
      default:
        return { Icon: AlertCircle, label: t("unanswered") };
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {questions.map((question) => {
        const { Icon, label } = statusView(question.status);
        const userAnswer = formatAnswer(question, question.userAnswer);
        const correctAnswer = formatAnswer(question, question.correctAnswer);
        const isOpen = OPEN_TYPES.includes(question.type);

        return (
          <Card
            key={question.key}
            className="bg-muted rounded-2xl shadow-none flex flex-col gap-4 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-base flex items-start gap-2">
                <span className="text-sm font-black">{question.key}.</span>
                <p className="text-balance font-semibold">{question.label}</p>
              </div>
              <Badge variant="outline" className="flex shrink-0 gap-1">
                <Icon className="h-3 w-3" />
                {label}
                {question.status !== "unanswered" && (
                  <span>· {t("questionScore", { score: question.score })}</span>
                )}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  {t("answer")}
                </h4>
                <div className="p-3 border border-border bg-background rounded-2xl text-sm">
                  {userAnswer ?? t("noAnswerProvided")}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  {t("correctAnswer")}
                </h4>
                <div className="p-3 border border-border bg-background rounded-2xl text-sm">
                  {correctAnswer ??
                    (isOpen ? t("noReferenceAnswer") : t("noAnswer"))}
                </div>
              </div>
            </div>
            {question.feedback && (
              <div className="text-sm">
                <Response content={question.feedback} />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};
