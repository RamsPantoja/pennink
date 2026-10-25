"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { Button } from "../common/Button";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { ClassroomAttachments } from "./ClassroomAttachments";

type StudyPlanDialogProps = {
  planId: string | null;
  startEditing: boolean;
  onClose: () => void;
};

type Draft = { title: string; description: string; content: string };

export function StudyPlanDialog({
  planId,
  startEditing,
  onClose,
}: StudyPlanDialogProps) {
  const t = useTranslations("StudyPlan");
  const locale = useLocale();
  const utils = api.useUtils();
  const [editing, setEditing] = useState(false);
  const [chosenClassroomId, setChosenClassroomId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ title: "", description: "", content: "" });

  const { data: plan, isLoading } = api.studyPlan.byId.useQuery(
    { id: planId ?? "", classroomId: chosenClassroomId ?? undefined },
    { enabled: !!planId },
  );

  useEffect(() => {
    setEditing(!!planId && startEditing);
    setChosenClassroomId(null);
  }, [planId, startEditing]);

  useEffect(() => {
    if (!plan) return;
    setDraft({
      title: plan.title,
      description: plan.description,
      content: plan.content,
    });
  }, [plan]);

  const refresh = () => utils.studyPlan.invalidate();

  const updatePlan = api.studyPlan.update.useMutation({
    onSuccess: async () => {
      setEditing(false);
      await refresh();
    },
  });
  const setItem = api.studyPlan.setItemCompleted.useMutation({
    onSuccess: refresh,
  });

  const classroomId = plan?.selectedClassroomId ?? null;
  const teachable = new Set(plan?.teachableClassroomIds ?? []);

  const subItemsByParent = useMemo(() => {
    const groups = new Map<number, NonNullable<typeof plan>["items"]>();
    for (const item of plan?.items ?? []) {
      if (item.parentPosition === null) continue;
      groups.set(item.parentPosition, [
        ...(groups.get(item.parentPosition) ?? []),
        item,
      ]);
    }
    return groups;
  }, [plan]);

  const timeline = useMemo(() => {
    const groups = new Map<string, NonNullable<typeof plan>["items"]>();
    for (const item of plan?.items ?? []) {
      if (item.parentPosition !== null) continue;
      const key = item.dueDate ?? "";
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return [...groups.entries()].sort(([a], [b]) => {
      if (a === "") return 1;
      if (b === "") return -1;
      return a.localeCompare(b);
    });
  }, [plan]);

  const renderItem = (
    item: NonNullable<typeof plan>["items"][number],
    nested: boolean,
  ) => (
    <label
      key={item.position}
      className={`flex items-start gap-3 rounded border p-2 ${nested ? "ml-6 border-dashed" : ""}`}
    >
      <Checkbox
        checked={item.completed}
        disabled={!classroomId || setItem.isPending}
        onCheckedChange={(checked) => {
          if (!classroomId || !plan) return;
          setItem.mutate({
            id: plan.id,
            classroomId,
            position: item.position,
            completed: checked === true,
          });
        }}
      />
      <span className={item.completed ? "text-muted-foreground line-through" : ""}>
        {item.title}
      </span>
      {nested && item.dueDate && (
        <span className="text-muted-foreground text-xs">
          {formatDate(item.dueDate)}
        </span>
      )}
      {item.completed && item.completedBy && (
        <span className="text-muted-foreground ml-auto text-xs">
          {t(`completedBy.${item.completedBy}`)}
        </span>
      )}
    </label>
  );

  const formatDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const exportPlan = async () => {
    if (!planId) return;
    const { filename, markdown } = await utils.studyPlan.exportMarkdown.fetch({
      id: planId,
      classroomId: classroomId ?? undefined,
    });
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const completed = plan?.items.filter((item) => item.completed).length ?? 0;
  const total = plan?.items.length ?? 0;

  return (
    <Dialog open={!!planId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plan?.title ?? t("loading")}</DialogTitle>
          <DialogDescription>
            {plan ? t("progress", { completed, total }) : null}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !plan ? (
          <p className="text-muted-foreground">{t("loading")}</p>
        ) : editing ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("editor.titleLabel")}</label>
              <Input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                {t("editor.descriptionLabel")}
              </label>
              <Input
                value={draft.description}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("editor.bodyLabel")}</label>
              <Textarea
                className="min-h-64 font-mono text-sm"
                value={draft.content}
                onChange={(event) =>
                  setDraft({ ...draft, content: event.target.value })
                }
              />
              <p className="text-muted-foreground text-xs">{t("editor.bodyHint")}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>
                {t("button.cancel")}
              </Button>
              <Button
                isPending={updatePlan.isPending}
                disabled={!draft.title.trim()}
                onClick={() =>
                  updatePlan.mutate({
                    id: plan.id,
                    title: draft.title.trim(),
                    description: draft.description.trim(),
                    content: draft.content,
                  })
                }
              >
                {t("button.save")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {plan.classrooms.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("classroomPicker.label")}</p>
                <div className="flex flex-wrap gap-2">
                  {plan.classrooms.map((classroom) => {
                    const canTick = teachable.has(classroom.id);
                    return (
                      <Button
                        key={classroom.id}
                        size="sm"
                        variant={classroom.id === classroomId ? "default" : "outline"}
                        disabled={!canTick}
                        onClick={() => setChosenClassroomId(classroom.id)}
                      >
                        {classroom.name}
                      </Button>
                    );
                  })}
                </div>
                {!classroomId && (
                  <p className="text-muted-foreground text-xs">
                    {t("classroomPicker.noClassroom")}
                  </p>
                )}
              </div>
            )}

            {plan.items.length === 0 && (
              <p className="text-muted-foreground">{t("timeline.empty")}</p>
            )}

            {timeline.map(([date, items]) => (
              <section key={date || "none"} className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium">
                  {date ? formatDate(date) : t("timeline.noDate")}
                </p>
                {items.map((item) => (
                  <div key={item.position} className="space-y-2">
                    {renderItem(item, false)}
                    {subItemsByParent.get(item.position)?.map((subItem) =>
                      renderItem(subItem, true),
                    )}
                  </div>
                ))}
              </section>
            ))}

            <section className="border-t pt-4">
              <ClassroomAttachments
                planId={plan.id}
                attachedClassroomIds={plan.classrooms.map((classroom) => classroom.id)}
              />
            </section>

            <div className="flex justify-between gap-2 border-t pt-4">
              <Button variant="outline" onClick={exportPlan}>
                {t("button.export")}
              </Button>
              <Button variant="outline" onClick={() => setEditing(true)}>
                {t("button.edit")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
