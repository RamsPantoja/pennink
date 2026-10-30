import { eq } from "drizzle-orm";
import { gradeOpenQuestions } from "~/app/agents/exam-evaluation/agent";
import {
  calculateExamScore,
  statusFromScore,
  type QuestionResult,
} from "~/app/agents/exam-evaluation/grade";
import { db } from "~/server/db";
import { examResults } from "~/server/db/schema";

export type AgentChatRequestData = {
  examResultId: string;
};

export async function POST(req: Request) {
  try {
    const { examResultId } = (await req.json()) as AgentChatRequestData;

    if (!examResultId) {
      return new Response("Missing examResultId", { status: 400 });
    }

    const examResult = await db.query.examResults.findFirst({
      where: (examResults, { eq }) => eq(examResults.id, examResultId),
      with: {
        examVersion: {
          with: {
            questionsToExamVersions: {
              with: {
                question: {
                  with: {
                    questionOptions: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!examResult) {
      return new Response("Exam result not found", { status: 404 });
    }

    // Only open questions still waiting for the AI are sent. The answers come from the stored submission, not the request.
    const pendingKeys = new Set(
      (examResult.questionResults ?? [])
        .filter((item) => item.status === "pending")
        .map((item) => item.key),
    );

    if (pendingKeys.size === 0) {
      return new Response("Nothing to grade", { status: 409 });
    }

    const answers = examResult.answers as Record<string, unknown>;
    const openQuestions = examResult.examVersion.questionsToExamVersions
      .map(({ question }) => question)
      .filter((question) => pendingKeys.has(question.key))
      .map((question) => ({
        key: question.key,
        type: question.type,
        label: question.label,
        description: question.description,
        correctAnswer: question.answer,
        userAnswer: answers[question.key],
      }));

    const graded = await gradeOpenQuestions(openQuestions);

    const gradedByKey = new Map(graded.questions.map((item) => [item.key, item]));

    const questionResults: QuestionResult[] = (
      examResult.questionResults ?? []
    ).map((item) => {
      if (item.status !== "pending") {
        return item as QuestionResult;
      }

      const question = gradedByKey.get(item.key);

      if (!question) {
        return { key: item.key, status: "incorrect", score: 0 };
      }

      return {
        key: item.key,
        status: statusFromScore(question.score),
        score: question.score,
        feedback: question.feedback,
      };
    });

    await db
      .update(examResults)
      .set({
        questionResults,
        score: calculateExamScore(questionResults),
        feedback: graded.feedback,
        updatedAt: new Date(),
      })
      .where(eq(examResults.id, examResult.id));

    return Response.json({ ok: true });
  } catch (error) {
    console.log(error);
    return Response.error();
  }
}
