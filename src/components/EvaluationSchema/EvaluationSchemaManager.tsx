"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { keepPreviousData } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "~/server/api/schemas/pagination";
import {
	type EvaluationSchemaDraft,
	takeEvaluationSchemaDraft,
} from "./draft-handoff";
import { api } from "~/trpc/react";
import { Button } from "../common/Button";
import { Card } from "../ui/card";
import { Empty, EmptyHeader, EmptyTitle } from "../ui/empty";
import { ListSearch } from "../ui/list-search";
import { Pagination } from "../ui/pagination";
import { Skeleton } from "../ui/skeleton";
import {
	EvaluationSchemaEditor,
	STARTER_DEFINITION,
} from "./EvaluationSchemaEditor";

export function EvaluationSchemaManager() {
	const t = useTranslations("EvaluationSchema");
	const utils = api.useUtils();
	const [editingId, setEditingId] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);
	// A schema drafted in the chat, waiting for the teacher to review it.
	const [pendingDraft, setPendingDraft] =
		useState<EvaluationSchemaDraft | null>(null);

	useEffect(() => {
		const draft = takeEvaluationSchemaDraft();
		if (draft) {
			setPendingDraft(draft);
			setCreating(true);
		}
	}, []);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState<string | undefined>();

	const list = api.evaluationSchema.list.useQuery(
		{ page, pageSize: DEFAULT_PAGE_SIZE, search },
		{ placeholderData: keepPreviousData },
	);
	const editing = api.evaluationSchema.byId.useQuery(
		{ id: editingId ?? "" },
		{ enabled: !!editingId },
	);

	const refresh = () => utils.evaluationSchema.list.invalidate();

	const create = api.evaluationSchema.create.useMutation({
		onSuccess: async ({ id }) => {
			await refresh();
			setCreating(false);
			setPendingDraft(null);
			setEditingId(id);
		},
	});
	const update = api.evaluationSchema.update.useMutation({
		onSuccess: async (row) => {
			await refresh();
			// Saved schemas are stored in the current format, so nothing is converted any more.
			utils.evaluationSchema.byId.setData(
				{ id: row.id },
				{ ...row, convertedKeys: [] },
			);
		},
	});
	const duplicate = api.evaluationSchema.duplicate.useMutation({
		onSuccess: refresh,
	});
	const remove = api.evaluationSchema.delete.useMutation({
		onSuccess: refresh,
	});

	const handleSearch = (term: string | undefined) => {
		setSearch(term);
		setPage(1);
	};

	if (creating) {
		return (
			<EvaluationSchemaEditor
				key={pendingDraft ? "draft" : "new"}
				initialName={pendingDraft?.name ?? ""}
				initialDescription={pendingDraft?.description ?? ""}
				initialDefinition={pendingDraft?.definition ?? STARTER_DEFINITION}
				isSaving={create.isPending}
				error={create.error?.message}
				onSave={(input) => create.mutate(input)}
				onBack={() => {
					setCreating(false);
					setPendingDraft(null);
				}}
			/>
		);
	}

	if (editingId) {
		if (editing.isLoading || !editing.data) {
			return <Skeleton className="m-3 h-96 rounded-xl" />;
		}
		return (
			<EvaluationSchemaEditor
				key={editing.data.id}
				initialName={editing.data.name}
				initialDescription={editing.data.description}
				initialDefinition={editing.data.definition}
				convertedKeys={editing.data.convertedKeys}
				isSaving={update.isPending}
				error={update.error?.message}
				onSave={(input) => update.mutate({ id: editingId, ...input })}
				onBack={() => setEditingId(null)}
			/>
		);
	}

	const items = list.data?.items ?? [];
	const showEmpty = !list.isLoading && items.length === 0 && !search;

	return (
		<div className="flex w-full flex-col gap-6 p-3 justify-center">
			<div className="flex flex-col gap-1">
				<h1 className="text-xl font-semibold">{t("title")}</h1>
				<p className="text-muted-foreground text-sm">{t("description")}</p>
			</div>

			<div className="flex flex-wrap items-end justify-between gap-4">
				<ListSearch
					placeholder={t("search.placeholder")}
					onSearch={handleSearch}
				/>
				<Button onClick={() => setCreating(true)}>
					<PlusIcon className="h-4 w-4" />
					{t("button.create")}
				</Button>
			</div>

			{list.isLoading && (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{[0, 1, 2].map((key) => (
						<Skeleton key={key} className="h-40 rounded-xl" />
					))}
				</div>
			)}

			{showEmpty && (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>{t("empty")}</EmptyTitle>
					</EmptyHeader>
				</Empty>
			)}

			{!list.isLoading && items.length === 0 && search && (
				<p className="text-muted-foreground text-sm">{t("search.noResults")}</p>
			)}

			{items.length > 0 && (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{items.map((schema) => (
						<Card key={schema.id} className="gap-3 p-4">
							<div className="flex flex-col gap-1">
								<span className="font-medium">{schema.name}</span>
								{schema.description && (
									<span className="text-muted-foreground line-clamp-2 text-sm">
										{schema.description}
									</span>
								)}
								<span className="text-muted-foreground text-xs">
									{t("questions", {
										count: schema.definition.questions.length,
									})}
								</span>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button size="sm" onClick={() => setEditingId(schema.id)}>
									{t("button.open")}
								</Button>
								<Button
									size="sm"
									variant="outline"
									isPending={
										duplicate.isPending && duplicate.variables?.id === schema.id
									}
									onClick={() => duplicate.mutate({ id: schema.id })}
								>
									{t("button.duplicate")}
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => {
										if (window.confirm(t("confirmDelete"))) {
											remove.mutate({ id: schema.id });
										}
									}}
								>
									{t("button.delete")}
								</Button>
							</div>
						</Card>
					))}
				</div>
			)}

			{list.data && list.data.totalPages > 1 && (
				<Pagination
					page={list.data.page}
					totalPages={list.data.totalPages}
					total={list.data.total}
					pageSize={list.data.pageSize}
					onPageChange={setPage}
				/>
			)}
		</div>
	);
}
