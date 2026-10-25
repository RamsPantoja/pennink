"use client";

import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { Checkbox } from "../ui/checkbox";

type ClassroomAttachmentsProps = {
  planId: string;
  attachedClassroomIds: string[];
};

export function ClassroomAttachments({
  planId,
  attachedClassroomIds,
}: ClassroomAttachmentsProps) {
  const t = useTranslations("StudyPlan");
  const utils = api.useUtils();
  const { data: classrooms = [] } = api.classroom.classrooms.useQuery();

  const refresh = () => utils.studyPlan.invalidate();
  const attach = api.studyPlan.attachToClassroom.useMutation({
    onSuccess: refresh,
  });
  const detach = api.studyPlan.detachFromClassroom.useMutation({
    onSuccess: refresh,
  });
  const error = attach.error ?? detach.error;
  const attached = new Set(attachedClassroomIds);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t("classrooms.title")}</p>
      {classrooms.length === 0 && (
        <p className="text-muted-foreground text-sm">{t("classrooms.empty")}</p>
      )}
      {classrooms.map((classroom) => (
        <label key={classroom.id} className="flex items-center gap-3">
          <Checkbox
            checked={attached.has(classroom.id)}
            disabled={attach.isPending || detach.isPending}
            onCheckedChange={(next) => {
              const input = { id: planId, classroomId: classroom.id };
              if (next === true) attach.mutate(input);
              else detach.mutate(input);
            }}
          />
          <span>{classroom.name}</span>
        </label>
      ))}
      {error && <p className="text-destructive text-sm">{error.message}</p>}
    </div>
  );
}
