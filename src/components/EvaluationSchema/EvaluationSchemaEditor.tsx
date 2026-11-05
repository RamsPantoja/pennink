"use client";

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import type { EvaluationSchemaDefinition } from "~/server/api/schemas/evaluation-schema";
import { Button } from "../common/Button";
import { CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  type DraftDefinition,
  type DraftValidation,
  issuesWithoutQuestion,
  toDraft,
  toRawDefinition,
  validateDraft,
} from "./definition-form";
import { QuestionBuilder } from "./QuestionBuilder";

export const STARTER_DEFINITION: EvaluationSchemaDefinition = {
  questions: [
    {
      type: "noul",
      key: "q_1",
      instructions: "The answer of the question 1 is correct?",
    },
  ],
};

type Props = {
  initialName: string;
  initialDescription: string;
  initialDefinition: unknown;
  /** Keys of questions converted from choice, score or box when the schema was loaded. */
  convertedKeys?: string[];
  isSaving: boolean;
  error?: string;
  onSave: (input: {
    name: string;
    description: string;
    definition: EvaluationSchemaDefinition;
  }) => void;
  onBack: () => void;
};

export function EvaluationSchemaEditor({
  initialName,
  initialDescription,
  initialDefinition,
  convertedKeys,
  isSaving,
  error,
  onSave,
  onBack,
}: Props) {
  const t = useTranslations("EvaluationSchema");
  const nameId = useId();
  const descriptionId = useId();

  const startDefinition = (initialDefinition ??
    STARTER_DEFINITION) as EvaluationSchemaDefinition;

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [draft, setDraft] = useState<DraftDefinition>(() =>
    toDraft(startDefinition, convertedKeys),
  );

  const validation = useMemo(() => validateDraft(draft), [draft]);
  const canSave = validation.ok && name.trim().length > 0 && !isSaving;

  const save = () => {
    if (!validation.ok) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      definition: validation.definition,
    });
  };

  return (
    <div className="flex w-full h-full justify-center">
      <div className="flex flex-1 min-h-0 max-w-6xl flex-col gap-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onBack}>
              {t("button.back")}
            </Button>
          </div>
          <Button onClick={save} disabled={!canSave} isPending={isSaving}>
            {t("button.save")}
          </Button>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row flex-1 min-h-0">
          <div className="ring-0 bg-transparent flex flex-col gap-4 lg:min-w-80 lg:h-full lg:overflow-auto">
            <CardHeader>
              <CardTitle>{t("editor.detailsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={nameId}>{t("editor.nameLabel")}</Label>
                <Input
                  id={nameId}
                  value={name}
                  maxLength={150}
                  placeholder={t("editor.namePlaceholder")}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={descriptionId}>
                  {t("editor.descriptionLabel")}
                </Label>
                <Textarea
                  id={descriptionId}
                  value={description}
                  maxLength={1000}
                  rows={3}
                  className="min-h-0"
                  placeholder={t("editor.descriptionPlaceholder")}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
            </CardContent>
          </div>

          <div className="bg-transparent flex flex-col flex-1 min-h-0 gap-3 overflow-hidden">
            <div className="flex flex-col">
              <CardTitle>{t("editor.jsonLabel")}</CardTitle>
            </div>
            <BuilderPanel
              draft={draft}
              onChange={setDraft}
              validation={validation}
            />
          </div>
        </div>

        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function BuilderPanel({
  draft,
  onChange,
  validation,
}: {
  draft: DraftDefinition;
  onChange: (draft: DraftDefinition) => void;
  validation: DraftValidation;
}) {
  const t = useTranslations("EvaluationSchema");
  const issues = validation.ok ? [] : validation.issues;
  const globalIssues = issuesWithoutQuestion(issues);

  return (
    <div className="flex flex-col gap-4 overflow-hidden flex-1 min-h-0">
      <QuestionBuilder
        questions={draft.questions}
        issues={issues}
        onChange={(questions) => onChange({ ...draft, questions })}
      />

      {validation.ok ? (
        <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircleIcon className="size-4 shrink-0" />
          {t("editor.valid", { count: draft.questions.length })}
        </p>
      ) : (
        <div className="text-destructive flex flex-col gap-2 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <ExclamationTriangleIcon className="size-4 shrink-0" />
            {t("editor.invalid", { count: issues.length })}
          </p>
          {globalIssues.length > 0 && (
            <ul className="flex flex-col gap-1 pl-6">
              {globalIssues.map((issue) => (
                <li key={`${issue.path}:${issue.message}`}>{issue.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
