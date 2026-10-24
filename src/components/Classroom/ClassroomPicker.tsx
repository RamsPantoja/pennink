"use client";

import {
	CheckIcon,
	ComputerDesktopIcon,
	MagnifyingGlassIcon,
	PlusIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { CreateClassroomForm } from "./CreateClassroomForm";
import { useActiveClassroom } from "./useActiveClassroom";

export function ClassroomPicker() {
	const t = useTranslations("ClassroomPicker");
	const [search, setSearch] = useState("");
	const [createOpen, setCreateOpen] = useState(false);
	const { data: classrooms, isLoading } = api.classroom.classrooms.useQuery();
	const { activeId, setActive } = useActiveClassroom(classrooms);

	const filteredClassrooms = useMemo(() => {
		const query = search.trim().toLowerCase();

		return (classrooms ?? []).filter((classroom) =>
			classroom.name.toLowerCase().includes(query),
		);
	}, [classrooms, search]);

	return (
		<div className="w-full max-w-md mx-auto overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
			<div className="flex items-center gap-2 border-b border-border px-3 py-2">
				<MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />
				<input
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					placeholder={t("search.placeholder")}
					className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
				/>
			</div>

			<p className="px-3 pt-3 pb-1 text-xs text-muted-foreground">
				{t("section")}
			</p>

			<ul className="max-h-72 overflow-auto p-1">
				{filteredClassrooms.map((classroom) => {
					const isActive = classroom.id === activeId;

					return (
						<li key={classroom.id}>
							<button
								type="button"
								onClick={() => setActive(classroom.id)}
								aria-pressed={isActive}
								className={cn(
									"flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent",
									isActive && "font-medium",
								)}
							>
								<ComputerDesktopIcon className="h-4 w-4 shrink-0" />
								<span className="flex-1 truncate">{classroom.name}</span>
								{isActive && <CheckIcon className="h-4 w-4 shrink-0" />}
							</button>
						</li>
					);
				})}

				{!isLoading && filteredClassrooms.length === 0 && (
					<li className="px-3 py-2 text-sm text-muted-foreground">
						{search.trim() ? t("empty.search") : t("empty.none")}
					</li>
				)}
				{isLoading && (
					<li className="px-3 py-2 text-sm text-muted-foreground">
						{t("loading")}
					</li>
				)}
			</ul>

			<div className="border-t border-border p-1">
				<button
					type="button"
					onClick={() => setCreateOpen(true)}
					className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
				>
					<PlusIcon className="h-4 w-4" />
					{t("button.new")}
				</button>
			</div>

			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent className="max-w-(--breakpoint-sm) w-full">
					<DialogHeader>
						<DialogTitle className="text-2xl font-bold">
							{t("dialog.title")}
						</DialogTitle>
						<DialogDescription>{t("dialog.description")}</DialogDescription>
					</DialogHeader>
					<CreateClassroomForm
						onCreated={() => setCreateOpen(false)}
						onCancel={() => setCreateOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
