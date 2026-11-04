"use client";

import { json } from "@codemirror/lang-json";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import CodeMirror from "@uiw/react-codemirror";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useId, useMemo, useState } from "react";
import {
  type EvaluationSchemaDefinition,
  evaluationSchemaDefinitionSchema,
} from "~/server/api/schemas/evaluation-schema";
import { Button } from "../common/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

export const STARTER_DEFINITION: EvaluationSchemaDefinition = {
  instructions: "",
  questions: [
    {
      type: "choice",
      key: "question_1",
      instructions: "Which option is correct?",
      criteria: { a: "Correct answer", b: "Wrong answer" },
    },
  ],
};

type Issue = { path: string; message: string };

type Validation =
  | { ok: true; definition: EvaluationSchemaDefinition }
  | { ok: false; syntax?: string; issues: Issue[] };

/** Parses the JSON text and checks it against the same rules the server enforces. */
export function validateDefinitionText(text: string): Validation {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      syntax: error instanceof Error ? error.message : "Invalid JSON",
      issues: [],
    };
  }

  const result = evaluationSchemaDefinitionSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join(".") || "(root)",
        message: issue.message,
      })),
    };
  }
  return { ok: true, definition: result.data };
}

type Props = {
  initialName: string;
  initialDescription: string;
  initialDefinition: unknown;
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
  isSaving,
  error,
  onSave,
  onBack,
}: Props) {
  const t = useTranslations("EvaluationSchema");
  const nameId = useId();
  const descriptionId = useId();
  const { resolvedTheme } = useTheme();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [text, setText] = useState(() =>
    JSON.stringify(initialDefinition ?? STARTER_DEFINITION, null, 2),
  );

  const validation = useMemo(() => validateDefinitionText(text), [text]);
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
      <div className="flex flex-1 max-w-6xl flex-col gap-6 p-4">
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
        <div className="flex gap-4 flex-1">
          <div className="ring-0 bg-transparent flex flex-col gap-4 min-w-80 h-full overflow-auto">
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

          <div className="bg-transparent flex flex-col flex-1">
            <div className="flex flex-col">
              <CardTitle>{t("editor.jsonLabel")}</CardTitle>
              <CardDescription>{t("editor.jsonHint")}</CardDescription>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              <div className="overflow-hidden rounded-md border border-input h-96 flex flex-1">
                <CodeMirror
                  value={text}
                  theme={resolvedTheme === "light" ? "light" : "dark"}
                  extensions={[json()]}
                  onChange={setText}
                  basicSetup={{ foldGutter: true, lineNumbers: true }}
                  className="text-sm h-full"
                />
              </div>
              <ValidationStatus validation={validation} />
            </div>
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

function ValidationStatus({ validation }: { validation: Validation }) {
  const t = useTranslations("EvaluationSchema");

  if (validation.ok) {
    return (
      <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckCircleIcon className="size-4 shrink-0" />
        {t("editor.valid", { count: validation.definition.questions.length })}
      </p>
    );
  }

  if (validation.syntax) {
    return (
      <p className="text-destructive flex items-center gap-2 text-sm">
        <ExclamationTriangleIcon className="size-4 shrink-0" />
        {t("editor.syntaxError", { message: validation.syntax })}
      </p>
    );
  }

  return (
    <div className="text-destructive flex flex-col gap-2 text-sm">
      <p className="flex items-center gap-2 font-medium">
        <ExclamationTriangleIcon className="size-4 shrink-0" />
        {t("editor.invalid", { count: validation.issues.length })}
      </p>
      <ul className="flex flex-col gap-1 pl-6">
        {validation.issues.map((issue) => (
          <li key={`${issue.path}:${issue.message}`}>
            <code className="font-mono text-xs">{issue.path}</code>:{" "}
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
