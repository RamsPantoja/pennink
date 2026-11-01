"use client";
import { AcademicCapIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CHAT_CONTEXT_WINDOW, getContextUsage } from "~/lib/contextWindow";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { AgentVisual } from "../AgentVisual";
import { Button } from "../common/Button";
import { StudyPlanDialog } from "../StudyPlan/StudyPlanDialog";
import { Card } from "../ui/card";
import { useWorkspaceStore } from "./useWorkspaceStore";

type MiniSectionProps = {
  title: string;
  children: ReactNode;
};

export const MiniSection = ({ title, children }: MiniSectionProps) => (
  <Card size="sm" className="shrink-0 gap-2">
    <h3 className="px-3 text-xs font-medium tracking-wide text-muted-foreground">
      {title}
    </h3>
    <div className="px-3">{children}</div>
  </Card>
);

const USAGE_BAR_CLASS = {
  ok: "bg-primary",
  warn: "bg-amber-500",
  danger: "bg-destructive",
} as const;

const formatTokens = (tokens: number) =>
  tokens >= 1000 ? `${Math.round(tokens / 1000)}K` : `${tokens}`;

export const WorkspaceSidePanel = () => {
  const t = useTranslations("Workspace.sidePanel");
  const contextTokens = useWorkspaceStore((state) => state.contextTokens);
  const contextUsage =
    contextTokens === null ? null : getContextUsage(contextTokens);
  const params = useParams();
  const workspaceId =
    typeof params?.workspaceId === "string" ? params.workspaceId : "";
  const utils = api.useUtils();
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);

  const { data: workspace } = api.workspace.workspaceById.useQuery(
    { id: workspaceId },
    { enabled: !!workspaceId },
  );
  const classroomId = workspace?.classroomId ?? "";
  const { data: classrooms } = api.classroom.classrooms.useQuery();
  const classroom = classrooms?.find((item) => item.id === classroomId);

  const { data: plans = [] } = api.studyPlan.listForClassroom.useQuery(
    { classroomId },
    { enabled: !!classroomId },
  );
  const { data: sources = [] } = api.workspace.sourcesByWorkspace.useQuery(
    { workspaceId },
    { enabled: !!workspaceId },
  );

  const detachSource = api.workspace.detachSource.useMutation({
    onSuccess: () => utils.workspace.sourcesByWorkspace.invalidate(),
  });

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto bg-background p-3">
      <MiniSection title={t("classroom")}>
        <div className="flex items-center gap-2 text-sm font-medium">
          <AcademicCapIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          {classroom ? (
            <span className="truncate">{classroom.name}</span>
          ) : (
            <span className="text-muted-foreground">{t("noClassroom")}</span>
          )}
        </div>
      </MiniSection>

      <MiniSection title={t("contextUsage")}>
        {contextUsage && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                {t("contextUsed", {
                  used: formatTokens(contextUsage.tokens),
                  total: formatTokens(CHAT_CONTEXT_WINDOW),
                })}
              </span>
              <span className="font-medium">{contextUsage.percent}%</span>
            </div>
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full transition-all",
                  USAGE_BAR_CLASS[contextUsage.level],
                )}
                style={{ width: `${contextUsage.percent}%` }}
              />
            </div>
            {contextUsage.level === "warn" && (
              <p className="text-xs text-amber-600">{t("contextWarn")}</p>
            )}
            {contextUsage.level === "danger" && (
              <div className="space-y-2">
                <p className="text-xs text-destructive">{t("contextDanger")}</p>
                <Link
                  href="/"
                  className="block rounded border p-2 text-center text-sm font-medium hover:bg-muted/60"
                >
                  {t("startNewWorkspace")}
                </Link>
              </div>
            )}
          </div>
        )}
      </MiniSection>

      <MiniSection title={""}>
        <div className="h-56">
          <AgentVisual />
        </div>
      </MiniSection>
      <MiniSection title={t("studyPlans")}>
        {plans.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("noStudyPlans")}</p>
        ) : (
          <ul className="space-y-2">
            {plans.map((plan) => {
              const percent =
                plan.total === 0
                  ? 0
                  : Math.round((plan.completed / plan.total) * 100);

              return (
                <li key={plan.id}>
                  <button
                    type="button"
                    onClick={() => setOpenPlanId(plan.id)}
                    className="w-full space-y-2 rounded border p-2 text-left hover:bg-muted/60"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className="truncate text-sm font-medium"
                        title={plan.title}
                      >
                        {plan.title}
                      </p>
                      <p className="shrink-0 text-xs text-muted-foreground">
                        {t("planProgress", {
                          completed: plan.completed,
                          total: plan.total,
                        })}
                      </p>
                    </div>
                    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </MiniSection>
      <MiniSection title={t("sources")}>
        {sources.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("noSources")}</p>
        ) : (
          <ul className="space-y-1">
            {sources.map((source) => (
              <li
                key={source.id}
                className="flex items-center gap-2 rounded border p-2"
              >
                <p
                  className="min-w-0 flex-1 truncate text-sm"
                  title={source.filename}
                >
                  {source.filename}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  title={t("removeSource")}
                  aria-label={t("removeSource")}
                  isPending={detachSource.isPending}
                  onClick={() =>
                    detachSource.mutate({
                      workspaceId,
                      fileId: source.id,
                    })
                  }
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </MiniSection>
      <StudyPlanDialog
        planId={openPlanId}
        startEditing={false}
        onClose={() => {
          setOpenPlanId(null);
          void utils.studyPlan.listForClassroom.invalidate({ classroomId });
        }}
      />
    </div>
  );
};
