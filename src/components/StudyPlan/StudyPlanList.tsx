"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { keepPreviousData } from "@tanstack/react-query";
import {
  ArrowUpTrayIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { api } from "~/trpc/react";
import { DEFAULT_PAGE_SIZE } from "~/server/api/schemas/pagination";
import { Button } from "../common/Button";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { ListSearch } from "../ui/list-search";
import { Pagination } from "../ui/pagination";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import { Progress } from "../ui/progress";
import { Skeleton } from "../ui/skeleton";
import { AttachPlanDialog } from "./AttachPlanDialog";
import { StudyPlanDialog } from "./StudyPlanDialog";

export function StudyPlanList() {
  const t = useTranslations("StudyPlan");
  const utils = api.useUtils();
  const fileInput = useRef<HTMLInputElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [startEditing, setStartEditing] = useState(false);
  const [attachId, setAttachId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState<string | undefined>();
  const {
    data,
    isLoading,
    isError,
  } = api.studyPlan.listAll.useQuery(
    { page, pageSize: DEFAULT_PAGE_SIZE, search },
    { placeholderData: keepPreviousData },
  );
  const plans = data?.items ?? [];

  const handleSearch = (term: string | undefined) => {
    setSearch(term);
    setPage(1);
  };

  const open = async (id: string, editing: boolean) => {
    await utils.studyPlan.invalidate();
    setOpenId(id);
    setStartEditing(editing);
  };

  const importPlan = api.studyPlan.importMarkdown.useMutation({
    onSuccess: ({ id }) => open(id, false),
  });

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    importPlan.mutate({
      markdown: await file.text(),
      fallbackTitle: file.name.replace(/\.md$/i, ""),
      classroomIds: [],
    });
  };

  const importButton = (
    <Button
      variant="outline"
      onClick={() => fileInput.current?.click()}
      isPending={importPlan.isPending}
    >
      <ArrowUpTrayIcon className="h-4 w-4" />
      {t("button.import")}
    </Button>
  );

  const attachingPlan = plans.find((plan) => plan.id === attachId);
  const showEmpty = !isLoading && !isError && plans.length === 0 && !search;
  const showNoResults = !isLoading && !isError && plans.length === 0 && !!search;

  return (
    <div className="flex w-full flex-col gap-6 p-3">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <ListSearch
          placeholder={t("search.placeholder")}
          onSearch={handleSearch}
        />
        {(plans.length > 0 || search) && importButton}
        <input
          ref={fileInput}
          type="file"
          accept=".md,text/markdown"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {importPlan.error && (
        <p className="text-destructive text-sm">{importPlan.error.message}</p>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-48 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t("page.error")}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      )}

      {showNoResults && (
        <p className="text-muted-foreground text-sm">{t("search.noResults")}</p>
      )}

      {showEmpty && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardDocumentListIcon />
            </EmptyMedia>
            <EmptyTitle>{t("page.empty")}</EmptyTitle>
            <EmptyDescription>{t("page.emptyDescription")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{importButton}</EmptyContent>
        </Empty>
      )}

      {plans.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-semibold">{plan.title}</p>
                  {plan.description && (
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {plan.description}
                    </p>
                  )}
                </div>
                {!plan.isOwner && (
                  <Badge variant="outline" className="shrink-0">
                    {t("page.shared")}
                  </Badge>
                )}
              </div>

              {plan.classrooms.length === 0 ? (
                <Badge variant="secondary" className="w-fit">
                  {t("page.notAttached")}
                </Badge>
              ) : (
                <div className="flex flex-col gap-3">
                  {plan.classrooms.map((classroom) => {
                    const progress = classroom.progress;
                    const percent =
                      progress && progress.total > 0
                        ? Math.round(
                            (progress.completed / progress.total) * 100,
                          )
                        : 0;

                    return (
                      <div key={classroom.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-medium">
                            {classroom.name}
                          </span>
                          <span className="text-muted-foreground shrink-0">
                            {progress
                              ? t("progress", {
                                  completed: progress.completed,
                                  total: progress.total,
                                })
                              : t("page.noProgress")}
                          </span>
                        </div>
                        {progress && <Progress value={percent} />}
                        {progress?.nextDue && (
                          <p className="text-muted-foreground flex items-center gap-2 text-xs">
                            <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {t("nextDue", {
                                title: progress.nextDue.title,
                                date: progress.nextDue.dueDate ?? "",
                              })}
                            </span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-auto flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAttachId(plan.id)}
                >
                  {t("button.classrooms")}
                </Button>
                <Button size="sm" onClick={() => open(plan.id, false)}>
                  {t("button.open")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          pageSize={data.pageSize}
          onPageChange={setPage}
        />
      )}

      <AttachPlanDialog
        planId={attachId}
        planTitle={attachingPlan?.title ?? ""}
        attachedClassroomIds={
          attachingPlan?.classrooms.map((classroom) => classroom.id) ?? []
        }
        onClose={() => setAttachId(null)}
      />

      <StudyPlanDialog
        planId={openId}
        startEditing={startEditing}
        onClose={() => {
          setOpenId(null);
          setStartEditing(false);
        }}
      />
    </div>
  );
}
