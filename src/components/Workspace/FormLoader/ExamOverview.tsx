import { AtSymbolIcon } from "@heroicons/react/24/outline";
import { Target } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Response } from "~/components/ai-elements/response";
import { Button } from "~/components/common/Button";
import {
  type ExamReviewData,
  ExamQuestionReview,
  toReviewQuestions,
} from "~/components/common/ExamQuestionReview";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { isBlank } from "~/app/agents/exam-evaluation/grade";

type ExamReviewProps = {
  data: ExamReviewData & {
    username: string;
    email: string;
  };
};

export function ExamReview({ data }: ExamReviewProps) {
  const t = useTranslations("ExamReview");
  const [showFeedback, setShowFeedback] = useState(false);
  const questions = toReviewQuestions(data);
  const answeredQuestions = questions.filter(
    (question) => !isBlank(question.userAnswer),
  ).length;
  const correctQuestions = questions.filter(
    (question) => question.status === "correct",
  ).length;

  return (
    <div className="flex flex-col px-4 py-8 max-w-4xl text-foreground gap-8">
      {/* Header */}
      <div className="flex flex-col">
        <div className="flex flex-col">
          <p className="text-sm">{data.username}</p>
          <div className="flex items-center gap-2">
            <AtSymbolIcon className="min-w-4 h-4" />
            <p className="text-sm text-muted-foreground">{data.email}</p>
          </div>
        </div>
        <p className="tracking-wider font-semibold text-lg pt-4">
          {data.exam.title}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("instructions")}: {data.exam.instructions}
        </p>
      </div>

      {/* Performance Summary */}
      <Card className="shadow-none border flex flex-col gap-4 rounded-2xl p-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          <p className="text-base font-semibold">{t("performanceSummary")}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-xl font-bold mb-2">{data.score}/100</div>
            <div className="text-sm">{t("finalScore")}</div>
            <Progress value={data.score} className="mt-2" />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold mb-2">
              {answeredQuestions}/{questions.length}
            </div>
            <div className="text-sm">{t("answeredQuestions")}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold mb-2">
              {correctQuestions}/{questions.length}
            </div>
            <div className="text-sm">{t("correctAnswers")}</div>
          </div>
        </div>
      </Card>

      {/* Questions Review */}
      <div className="flex flex-col gap-4">
        <p className="font-semibold">{t("detailedQuestionReview")}</p>
        <ExamQuestionReview questions={questions} />
      </div>

      {/* Detailed Feedback */}
      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => setShowFeedback(!showFeedback)}
        >
          {showFeedback ? t("hideFeedback") : t("showFeedback")}
        </Button>
        {showFeedback && (
          <Card className="text-sm max-h-96 overflow-auto bg-card p-3">
            <Response content={data.feedback} />
          </Card>
        )}
      </div>
    </div>
  );
}
