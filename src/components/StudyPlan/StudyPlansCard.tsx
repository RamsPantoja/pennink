"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { Button } from "../common/Button";
import { Card } from "../ui/card";
import { StudyPlanDialog } from "./StudyPlanDialog";

export function StudyPlansCard({ classroomId }: { classroomId: string }) {
  const t = useTranslations("StudyPlan");
  const utils = api.useUtils();
  const fileInput = useRef<HTMLInputElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [startEditing, setStartEditing] = useState(false);
  const { data: plans = [], isLoading } =
    api.studyPlan.listForClassroom.useQuery({ classroomId });

  const openPlan = async (id: string, editing: boolean) => {
    await utils.studyPlan.listForClassroom.invalidate({ classroomId });
    setOpenId(id);
    setStartEditing(editing);
  };

  const importPlan = api.studyPlan.importMarkdown.useMutation({
    onSuccess: ({ id }) => openPlan(id, false),
  });

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    importPlan.mutate({
      markdown: await file.text(),
      fallbackTitle: file.name.replace(/\.md$/i, ""),
      classroomIds: [classroomId],
    });
  };

  return (
    <Card className="gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{t("title")}</p>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fileInput.current?.click()}
            isPending={importPlan.isPending}
          >
            {t("button.import")}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".md,text/markdown"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </div>

      {importPlan.error && (
        <p className="text-destructive">{importPlan.error.message}</p>
      )}

      <div className="space-y-2">
        {!isLoading && plans.length === 0 && (
          <p className="text-muted-foreground">{t("empty")}</p>
        )}
        {plans.map((plan) => {
          const percent =
            plan.total === 0 ? 0 : Math.round((plan.completed / plan.total) * 100);

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => openPlan(plan.id, false)}
              className="w-full space-y-2 rounded border p-3 text-left hover:bg-muted/60"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{plan.title}</p>
                <p className="text-muted-foreground text-sm">
                  {t("progress", { completed: plan.completed, total: plan.total })}
                </p>
              </div>
              <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              {plan.nextDue && (
                <p className="text-muted-foreground text-sm">
                  {t("nextDue", {
                    title: plan.nextDue.title,
                    date: plan.nextDue.dueDate ?? "",
                  })}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <StudyPlanDialog
        planId={openId}
        startEditing={startEditing}
        onClose={() => {
          setOpenId(null);
          setStartEditing(false);
        }}
      />
    </Card>
  );
}
