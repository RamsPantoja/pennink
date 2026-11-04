"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { keepPreviousData } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DEFAULT_PAGE_SIZE } from "~/server/api/schemas/pagination";
import { api } from "~/trpc/react";
import { Button } from "../common/Button";
import { Card } from "../ui/card";
import { Empty, EmptyHeader, EmptyTitle } from "../ui/empty";
import { ListSearch } from "../ui/list-search";
import { Pagination } from "../ui/pagination";
import { Skeleton } from "../ui/skeleton";
import { NewRunForm } from "./NewRunForm";
import { RunResults } from "./RunResults";

export function EvaluateExamsManager() {
	const t = useTranslations("EvaluateExams");
	const [view, setView] = useState<
		{ kind: "list" } | { kind: "new" } | { kind: "run"; id: string }
	>({
		kind: "list",
	});
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState<string | undefined>();
	const runs = api.evaluationRun.list.useQuery(
		{ page, pageSize: DEFAULT_PAGE_SIZE, search },
		{ placeholderData: keepPreviousData },
	);

	if (view.kind === "new") {
		return (
			<NewRunForm
				onCreated={(id) => setView({ kind: "run", id })}
				onCancel={() => setView({ kind: "list" })}
			/>
		);
	}

	if (view.kind === "run") {
		return (
			<RunResults runId={view.id} onBack={() => setView({ kind: "list" })} />
		);
	}

	const items = runs.data?.items ?? [];

	return (
		<div className="flex w-full flex-col gap-6 p-3">
			<div className="flex flex-col gap-1">
				<h1 className="text-xl font-semibold">{t("title")}</h1>
				<p className="text-muted-foreground text-sm">{t("description")}</p>
			</div>

			<div className="flex flex-wrap items-end justify-between gap-4">
				<ListSearch
					placeholder={t("search.placeholder")}
					onSearch={(term) => {
						setSearch(term);
						setPage(1);
					}}
				/>
				<Button onClick={() => setView({ kind: "new" })}>
					<PlusIcon className="h-4 w-4" />
					{t("button.new")}
				</Button>
			</div>

			{runs.isLoading && (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{[0, 1, 2].map((key) => (
						<Skeleton key={key} className="h-32 rounded-xl" />
					))}
				</div>
			)}

			{!runs.isLoading && items.length === 0 && (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>
							{search ? t("search.noResults") : t("empty")}
						</EmptyTitle>
					</EmptyHeader>
				</Empty>
			)}

			{items.length > 0 && (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{items.map((run) => (
						<Card key={run.id} className="gap-3 p-4">
							<div className="flex flex-col gap-1">
								<span className="font-medium">{run.name}</span>
								<span className="text-muted-foreground text-xs">
									{t("runs.meta", {
										schema: run.schemaSnapshot.questions.length,
										date: new Date(run.createdAt).toLocaleDateString(),
									})}
								</span>
							</div>
							<div>
								<Button
									size="sm"
									onClick={() => setView({ kind: "run", id: run.id })}
								>
									{t("button.open")}
								</Button>
							</div>
						</Card>
					))}
				</div>
			)}

			{runs.data && runs.data.totalPages > 1 && (
				<Pagination
					page={runs.data.page}
					totalPages={runs.data.totalPages}
					total={runs.data.total}
					pageSize={runs.data.pageSize}
					onPageChange={setPage}
				/>
			)}
		</div>
	);
}
