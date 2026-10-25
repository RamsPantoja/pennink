"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ClassroomAttachments } from "./ClassroomAttachments";

type AttachPlanDialogProps = {
  planId: string | null;
  planTitle: string;
  attachedClassroomIds: string[];
  onClose: () => void;
};

export function AttachPlanDialog({
  planId,
  planTitle,
  attachedClassroomIds,
  onClose,
}: AttachPlanDialogProps) {
  const t = useTranslations("StudyPlan");

  return (
    <Dialog open={!!planId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("attach.title", { title: planTitle })}</DialogTitle>
          <DialogDescription>{t("attach.description")}</DialogDescription>
        </DialogHeader>
        {planId && (
          <ClassroomAttachments
            planId={planId}
            attachedClassroomIds={attachedClassroomIds}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
