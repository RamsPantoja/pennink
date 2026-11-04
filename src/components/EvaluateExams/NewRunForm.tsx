"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  type IncomingFile,
  groupFilesByStudent,
} from "~/lib/evaluation/grouping";
import { type ZipPage, unpackExamZip } from "~/lib/evaluation/zip";
import { api } from "~/trpc/react";
import { Button } from "../common/Button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { type PreparedImage, prepareImage } from "./prepare-image";
import { SchemaPickerDialog } from "./SchemaPickerDialog";

type Props = {
  onCreated: (runId: string) => void;
  onCancel: () => void;
};

type Progress = {
  phase: "preparing" | "uploading" | "grading";
  done: number;
  total: number;
};

/** Grading runs this many Jev calls at a time. */
const GRADE_CONCURRENCY = 2;

export function NewRunForm({ onCreated, onCancel }: Props) {
  const t = useTranslations("EvaluateExams");
  const utils = api.useUtils();
  const schemas = api.evaluationSchema.list.useQuery({ page: 1, pageSize: 50 });
  const createRun = api.evaluationRun.create.useMutation();
  const createSubmission = api.evaluationRun.createSubmission.useMutation();
  const grade = api.evaluationRun.grade.useMutation();
  const presign = api.storage.createPresignedUrl.useMutation();

  const [schemaId, setSchemaId] = useState("");
  const [schemaName, setSchemaName] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [name, setName] = useState(() =>
    t("defaultName", { date: new Date().toLocaleDateString() }),
  );
  const [pages, setPages] = useState<ZipPage[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const grouping = useMemo(() => {
    const incoming: IncomingFile[] = pages.map((page) => ({
      name: page.file.name,
      path: page.path,
    }));
    return groupFilesByStudent(incoming);
  }, [pages]);

  const fileByPath = useMemo(
    () => new Map(pages.map((page) => [page.path, page.file])),
    [pages],
  );

  const chooseZip = async (zipFile: File | undefined) => {
    if (!zipFile) return;
    setError(null);
    try {
      const unpacked = await unpackExamZip(zipFile);
      if (unpacked.pages.length === 0) {
        setPages([]);
        setError(t("errors.noPages"));
        return;
      }
      setPages(unpacked.pages);
    } catch (cause) {
      setPages([]);
      setError(cause instanceof Error ? cause.message : t("errors.generic"));
    }
  };
  const pageCount = grouping.students.reduce(
    (sum, student) => sum + student.pages.length,
    0,
  );
  const busy = progress !== null;
  const canStart =
    !busy &&
    schemaId !== "" &&
    name.trim() !== "" &&
    grouping.students.length > 0;

  const start = async () => {
    setError(null);
    try {
      // Prepare every page before creating the run, so a bad image stops the run before it exists.
      const prepared = new Map<string, PreparedImage>();
      let done = 0;
      setProgress({ phase: "preparing", done, total: pageCount });
      for (const student of grouping.students) {
        for (const page of student.pages) {
          const file = fileByPath.get(page.file.path);
          if (!file) throw new Error(`Missing file ${page.file.name}`);
          prepared.set(
            `${student.studentName}:${page.pageNo}`,
            await prepareImage(file),
          );
          setProgress({ phase: "preparing", done: ++done, total: pageCount });
        }
      }

      const run = await createRun.mutateAsync({
        evaluationSchemaId: schemaId,
        name: name.trim(),
      });

      done = 0;
      for (const student of grouping.students) {
        const pages = [];
        for (const page of student.pages) {
          const image = prepared.get(`${student.studentName}:${page.pageNo}`);
          if (!image)
            throw new Error(`Missing prepared page ${page.file.name}`);
          const key = `evaluation/${run.id}/${crypto.randomUUID()}.${image.extension}`;
          const { signedUrl } = await presign.mutateAsync({
            command: "PUT",
            key,
          });
          const response = await fetch(signedUrl, {
            method: "PUT",
            body: image.blob,
            headers: { "Content-Type": image.mimeType },
          });
          if (!response.ok)
            throw new Error(`Upload failed for ${page.file.name}`);
          pages.push({
            pageNo: page.pageNo,
            storageKey: key,
            mimeType: image.mimeType,
          });
          setProgress({ phase: "uploading", done: ++done, total: pageCount });
        }
        await createSubmission.mutateAsync({
          runId: run.id,
          studentName: student.studentName,
          pages,
        });
      }

      const { submissions } = await utils.evaluationRun.byId.fetch({
        id: run.id,
      });
      setProgress({ phase: "grading", done: 0, total: submissions.length });
      let graded = 0;
      const queue = [...submissions];
      const worker = async () => {
        while (queue.length > 0) {
          const submission = queue.shift();
          if (!submission) return;
          // A failed grade is stored on the submission, so keep going with the rest.
          await grade.mutateAsync({ id: submission.id }).catch(() => undefined);
          setProgress({
            phase: "grading",
            done: ++graded,
            total: submissions.length,
          });
        }
      };
      await Promise.all(Array.from({ length: GRADE_CONCURRENCY }, worker));

      setProgress(null);
      onCreated(run.id);
    } catch (cause) {
      setProgress(null);
      setError(cause instanceof Error ? cause.message : t("errors.generic"));
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 p-3">
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          {t("button.back")}
        </Button>
      </div>

      <h2 className="text-lg font-semibold">{t("new.title")}</h2>

      <div className="flex flex-col gap-4 w-fit">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="evaluation-schema">{t("new.schemaLabel")}</Label>
          <Button
            id="evaluation-schema"
            variant="outline"
            disabled={busy}
            onClick={() => setPickerOpen(true)}
          >
            {schemaName ?? (
              <span className="text-muted-foreground">
                {t("new.schemaPlaceholder")}
              </span>
            )}
          </Button>
          <SchemaPickerDialog
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            selectedId={schemaId}
            onSelect={({ id, name }) => {
              setSchemaId(id);
              setSchemaName(name);
            }}
          />
          {schemas.data?.items.length === 0 && (
            <span className="text-muted-foreground text-xs">
              {t("new.noSchemas")}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="evaluation-run-name">{t("new.nameLabel")}</Label>
          <Input
            id="evaluation-run-name"
            value={name}
            maxLength={150}
            disabled={busy}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("new.filesLabel")}</span>
        <span className="text-muted-foreground text-xs">
          {t("new.filesHint")}
        </span>
        <div className="flex flex-wrap gap-2">
          <label className="border-input hover:bg-muted cursor-pointer rounded-md border px-3 py-2 text-sm">
            {t("new.chooseZip")}
            <input
              type="file"
              className="hidden"
              disabled={busy}
              accept=".zip,application/zip"
              onChange={(event) => chooseZip(event.target.files?.[0])}
            />
          </label>
        </div>
      </div>

      {pages.length > 0 && (
        <div className="flex flex-col gap-3 text-sm">
          <span className="font-medium">
            {t("new.preview", {
              students: grouping.students.length,
              pages: pageCount,
            })}
          </span>
          <ul className="flex flex-col gap-1">
            {grouping.students.map((student) => (
              <li key={student.studentName}>
                {student.studentName}
                <span className="text-muted-foreground">
                  {" "}
                  · {t("new.pages", { count: student.pages.length })}
                </span>
              </li>
            ))}
          </ul>
          {grouping.unassigned.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-destructive font-medium">
                {t("new.unassigned", { count: grouping.unassigned.length })}
              </span>
              <ul className="text-muted-foreground flex flex-col gap-0.5 text-xs">
                {grouping.unassigned.map((item) => (
                  <li key={item.file.path}>
                    <code>{item.file.path}</code>: {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {progress && (
        <p className="text-muted-foreground text-sm">
          {t(`progress.${progress.phase}`, {
            done: progress.done,
            total: progress.total,
          })}
        </p>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex">
        <Button onClick={start} disabled={!canStart} isPending={busy}>
          {t("button.start")}
        </Button>
      </div>
    </div>
  );
}
