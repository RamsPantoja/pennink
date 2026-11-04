"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { ListSearch } from "../ui/list-search";
import { Pagination } from "../ui/pagination";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedId: string;
	onSelect: (schema: { id: string; name: string }) => void;
};

const PAGE_SIZE = 10;

export function SchemaPickerDialog({
	open,
	onOpenChange,
	selectedId,
	onSelect,
}: Props) {
	const t = useTranslations("EvaluateExams.new.schemaPicker");
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState<string | undefined>();

	const schemas = api.evaluationSchema.list.useQuery(
		{ page, pageSize: PAGE_SIZE, search },
		{ enabled: open },
	);

	const choose = (schema: { id: string; name: string }) => {
		onSelect(schema);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>

				<ListSearch
					placeholder={t("searchPlaceholder")}
					onSearch={(term) => {
						setSearch(term);
						setPage(1);
					}}
				/>

				<div className="flex flex-col gap-2">
					{schemas.data?.items.map((schema) => (
						<Button
							key={schema.id}
							type="button"
							variant={schema.id === selectedId ? "secondary" : "outline"}
							className="h-auto justify-start whitespace-normal py-2 text-left"
							onClick={() => choose({ id: schema.id, name: schema.name })}
						>
							<span className="flex flex-col gap-0.5">
								<span className="font-medium">{schema.name}</span>
								{schema.description && (
									<span className="text-muted-foreground text-xs">
										{schema.description}
									</span>
								)}
							</span>
						</Button>
					))}
					{schemas.data && schemas.data.items.length === 0 && (
						<p className="text-muted-foreground text-sm">{t("empty")}</p>
					)}
				</div>

				{schemas.data && schemas.data.totalPages > 1 && (
					<Pagination
						page={schemas.data.page}
						totalPages={schemas.data.totalPages}
						total={schemas.data.total}
						pageSize={schemas.data.pageSize}
						onPageChange={setPage}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
