"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarDaysIcon,
  DocumentTextIcon,
  PaperClipIcon,
  PencilSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { sileo } from "sileo";
import { api } from "~/trpc/react";
import { Button } from "../common/Button";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";
import { Skeleton } from "../ui/skeleton";
import { PlanArtifactEditor } from "./PlanArtifactEditor";
import {
  PlanArtifactSettingsDialog,
  type PlanSettings,
} from "./PlanArtifactSettingsDialog";

export function PlanArtifactList({ workspaceId }: { workspaceId: string }) {
  const t = useTranslations("PlanArtifact");
  const utils = api.useUtils();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanSettings | null>(null);
  const { data: workspace } = api.workspace.workspaceById.useQuery({
    id: workspaceId,
  });
  const {
    data: allPlans = [],
    isLoading,
    isError,
  } = api.planArtifact.listAll.useQuery();
  // Only plans of the open workspace's classroom can be attached to it.
  const plans = allPlans.filter(
    (plan) => plan.classroomId === workspace?.classroomId,
  );

  const attach = api.planArtifact.attachToWorkspace.useMutation({
    onSuccess: () => {
      sileo.show({ title: t("attach.success") });
      void utils.planArtifact.listForWorkspace.invalidate({ workspaceId });
    },
    onError: (error) => {
      sileo.show({ title: error.message });
    },
  });

  return (
    <ResizablePanelGroup
      key={selectedId ? "split" : "list"}
      direction="horizontal"
      className="h-full w-full"
    >
      <ResizablePanel
        defaultSize={selectedId ? 50 : 100}
        minSize={30}
        className="overflow-y-auto"
      >
        <div className="flex w-full flex-col gap-6 p-3">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">{t("description")}</p>
          </div>

          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((key) => (
                <Skeleton key={key} className="h-40 rounded-xl" />
              ))}
            </div>
          )}

          {isError && (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{t("error")}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}

          {!isLoading && !isError && plans.length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <DocumentTextIcon />
                </EmptyMedia>
                <EmptyTitle>{t("title")}</EmptyTitle>
                <EmptyDescription>{t("empty")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {plans.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className="flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-semibold">{plan.title}</p>
                      <p className="text-muted-foreground flex items-center gap-2 text-xs">
                        <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {plan.range !== "week"
                            ? plan.startDate
                            : t("dates", {
                                start: plan.startDate,
                                end: plan.endDate,
                              })}
                        </span>
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {t(`range.${plan.range}`)}
                    </Badge>
                  </div>

                  <div className="text-muted-foreground flex flex-col gap-1 text-xs">
                    <span className="truncate font-medium text-foreground">
                      {plan.classroomName}
                    </span>
                    <span>
                      {t("updated", {
                        date: format(new Date(plan.updatedAt), "PP"),
                      })}
                    </span>
                  </div>

                  <div className="mt-auto flex justify-end gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      isPending={attach.isPending}
                      onClick={() =>
                        attach.mutate({
                          workspaceId,
                          planArtifactId: plan.id,
                        })
                      }
                    >
                      <PaperClipIcon className="h-4 w-4" />
                      {t("attach.button")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingPlan(plan)}
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      {t("settings.button")}
                    </Button>
                    <Button size="sm" onClick={() => setSelectedId(plan.id)}>
                      {t("open")}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ResizablePanel>

      {selectedId && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex h-full flex-col">
              <div className="flex justify-end p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("close")}
                  title={t("close")}
                  onClick={() => setSelectedId(null)}
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
              <PlanArtifactEditor id={selectedId} />
            </div>
          </ResizablePanel>
        </>
      )}
      <PlanArtifactSettingsDialog
        plan={editingPlan}
        onClose={() => setEditingPlan(null)}
      />
    </ResizablePanelGroup>
  );
}
