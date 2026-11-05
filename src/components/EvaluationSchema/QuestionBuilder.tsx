"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { MAX_EVALUATION_QUESTIONS } from "~/server/api/schemas/evaluation-schema";
import { Button } from "../common/Button";
import {
  type DraftQuestion,
  type Issue,
  createQuestion,
  duplicateQuestion,
  issuesForQuestion,
  moveItem,
  renumber,
} from "./definition-form";
import { QuestionCard } from "./QuestionCard";

type Props = {
  questions: DraftQuestion[];
  issues: Issue[];
  onChange: (questions: DraftQuestion[]) => void;
};

/** Every change renumbers the default statements so they match the new positions. */
export function QuestionBuilder({ questions, issues, onChange }: Props) {
  const t = useTranslations("EvaluationSchema.builder");
  const keys = questions.map((question) => question.key);
  const canAdd = questions.length < MAX_EVALUATION_QUESTIONS;

  const commit = (next: DraftQuestion[]) => onChange(renumber(next));

  return (
    <div className="flex flex-col gap-4 overflow-auto flex-1 min-h-0 p-1">
      {questions.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}

      {questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          index={index}
          total={questions.length}
          question={question}
          issues={issuesForQuestion(issues, index)}
          onChange={(next) =>
            commit(questions.map((q, i) => (i === index ? next : q)))
          }
          onMove={(direction) =>
            commit(moveItem(questions, index, index + direction))
          }
          onDuplicate={() => {
            if (!canAdd) return;
            const next = [...questions];
            next.splice(index + 1, 0, duplicateQuestion(question, keys));
            commit(next);
          }}
          onRemove={() => commit(questions.filter((_, i) => i !== index))}
        />
      ))}

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          disabled={!canAdd}
          startIcon={<PlusIcon className="size-4" />}
          onClick={() => commit([...questions, createQuestion(keys)])}
        >
          {t("addQuestion")}
        </Button>
        {!canAdd && (
          <p className="text-xs text-muted-foreground">
            {t("limitReached", { max: MAX_EVALUATION_QUESTIONS })}
          </p>
        )}
      </div>
    </div>
  );
}
