"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { Button } from "../common/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

type PreviewRow = {
  rowNumber: number;
  name: string;
  email: string;
  status: "new" | "existing" | "already_enrolled" | "invalid" | "duplicate_in_file";
  reason?: string;
};

const IMPORTABLE_STATUSES = new Set<PreviewRow["status"]>(["new", "existing"]);

const readAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export function StudentImportDialog({
  classroomId,
  open,
  onOpenChange,
}: {
  classroomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("StudentImportDialog");
  const utils = api.useUtils();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preview = api.classroom.previewStudentImport.useMutation({
    onSuccess: ({ rows }) => setRows(rows),
    onError: (err) => {
      setRows(null);
      setError(err.message);
    },
  });
  const importStudents = api.classroom.importStudents.useMutation({
    onSuccess: async () => {
      await utils.classroom.classroomById.invalidate({ id: classroomId });
      handleClose(false);
    },
    onError: (err) => setError(err.message),
  });

  const importable = rows?.filter((row) => IMPORTABLE_STATUSES.has(row.status)) ?? [];
  const count = (status: PreviewRow["status"]) =>
    rows?.filter((row) => row.status === status).length ?? 0;

  const reset = () => {
    setFileName("");
    setRows(null);
    setError(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setRows(null);
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError(t("errors.notXlsx"));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(t("errors.tooLarge"));
      return;
    }
    setFileName(file.name);
    const fileBase64 = await readAsBase64(file);
    preview.mutate({ classroomId, fileName: file.name, fileBase64 });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] w-full max-w-(--breakpoint-md) overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(event) => {
                  void handleFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <span className="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-accent">
                {t("button.chooseFile")}
              </span>
            </label>
            {fileName && <span className="text-muted-foreground">{fileName}</span>}
          </div>

          <p className="text-sm text-muted-foreground">{t("format")}</p>

          {preview.isPending && <p>{t("parsing")}</p>}
          {error && <p className="text-destructive">{error}</p>}

          {rows && (
            <>
              <p>
                {t("summary", {
                  new: count("new"),
                  existing: count("existing"),
                  enrolled: count("already_enrolled"),
                  invalid: count("invalid"),
                  duplicate: count("duplicate_in_file"),
                })}
              </p>
              <div className="max-h-80 space-y-2 overflow-auto">
                {rows.map((row) => (
                  <div
                    key={row.rowNumber}
                    className="flex items-center justify-between gap-3 rounded border p-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate">{row.name || "—"}</p>
                      <p className="truncate text-muted-foreground">{row.email || "—"}</p>
                    </div>
                    <div className="shrink-0 text-right text-sm">
                      <p>{t(`status.${row.status}`)}</p>
                      {row.reason && (
                        <p className="text-muted-foreground">{row.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleClose(false)}>
            {t("button.cancel")}
          </Button>
          <Button
            onClick={() =>
              importStudents.mutate({
                classroomId,
                rows: importable.map(({ name, email }) => ({ name, email })),
              })
            }
            isPending={importStudents.isPending}
            disabled={importable.length === 0}
          >
            {t("button.import", { count: importable.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
