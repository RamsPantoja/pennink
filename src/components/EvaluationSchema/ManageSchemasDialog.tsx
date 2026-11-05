"use client";

import { useTranslations } from "next-intl";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { EvaluationSchemaManager } from "./EvaluationSchemaManager";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function ManageSchemasDialog({ open, onOpenChange }: Props) {
	const t = useTranslations("EvaluateExams.manageSchemas");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<EvaluationSchemaManager />
			</DialogContent>
		</Dialog>
	);
}
