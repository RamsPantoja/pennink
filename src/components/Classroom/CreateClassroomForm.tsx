"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { Button } from "../common/Button";
import { Input } from "../ui/input";
import { useActiveClassroom } from "./useActiveClassroom";

type CreateClassroomFormProps = {
	onCreated?: () => void;
	onCancel?: () => void;
};

export function CreateClassroomForm({
	onCreated,
	onCancel,
}: CreateClassroomFormProps) {
	const t = useTranslations("ClassroomPicker");
	const utils = api.useUtils();
	const [name, setName] = useState("");
	const { setActive } = useActiveClassroom();

	const createClassroom = api.classroom.create.useMutation({
		onSuccess: async (classroom) => {
			setName("");
			setActive(classroom.id);
			await utils.classroom.classrooms.invalidate();
			onCreated?.();
		},
	});

	const submitCreate = () => {
		if (!name.trim() || createClassroom.isPending) return;

		createClassroom.mutate({ name });
	};

	return (
		<div className="flex flex-col gap-4">
			<Input
				value={name}
				onChange={(event) => setName(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === "Enter") submitCreate();
				}}
				placeholder={t("input.placeholder")}
			/>
			<div className="flex justify-end gap-2">
				{onCancel && (
					<Button variant="secondary" onClick={onCancel}>
						{t("button.cancel")}
					</Button>
				)}
				<Button
					onClick={submitCreate}
					isPending={createClassroom.isPending}
					disabled={!name.trim()}
				>
					{t("button.create")}
				</Button>
			</div>
		</div>
	);
}
