"use client";

import {
	ArrowDownIcon,
	ArrowUpIcon,
	DocumentDuplicateIcon,
	ExclamationTriangleIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { Button } from "../common/Button";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import type { DraftQuestion, Issue } from "./definition-form";

type Props = {
	index: number;
	total: number;
	question: DraftQuestion;
	issues: Issue[];
	onChange: (question: DraftQuestion) => void;
	onMove: (direction: -1 | 1) => void;
	onDuplicate: () => void;
	onRemove: () => void;
};

export function QuestionCard({
	index,
	total,
	question,
	issues,
	onChange,
	onMove,
	onDuplicate,
	onRemove,
}: Props) {
	const t = useTranslations("EvaluationSchema.builder");
	const instructionsId = useId();
	const trueId = useId();
	const falseId = useId();

	return (
		<Card className="p-0 shrink-0">
			<CardContent className="flex flex-col gap-4 p-4">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<span className="text-sm font-medium">
						{t("questionNumber", { number: index + 1 })}
					</span>
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							aria-label={t("actions.moveUp")}
							disabled={index === 0}
							onClick={() => onMove(-1)}
						>
							<ArrowUpIcon className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							aria-label={t("actions.moveDown")}
							disabled={index === total - 1}
							onClick={() => onMove(1)}
						>
							<ArrowDownIcon className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							aria-label={t("actions.duplicate")}
							onClick={onDuplicate}
						>
							<DocumentDuplicateIcon className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							aria-label={t("actions.remove")}
							onClick={onRemove}
						>
							<TrashIcon className="size-4" />
						</Button>
					</div>
				</div>

				{question.converted && (
					<p className="flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
						<ExclamationTriangleIcon className="size-4 shrink-0" />
						{t("converted")}
					</p>
				)}

				<div className="flex flex-col gap-1.5">
					<Label htmlFor={instructionsId}>{t("instructionsLabel")}</Label>
					<Textarea
						id={instructionsId}
						value={question.instructions}
						maxLength={2000}
						rows={2}
						className="min-h-0"
						placeholder={t("instructionsPlaceholder")}
						onChange={(event) =>
							onChange({
								...question,
								instructions: event.target.value,
								autoInstructions: false,
								converted: false,
							})
						}
					/>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={trueId}>{t("noul.whenTrue")}</Label>
						<Textarea
							id={trueId}
							value={question.whenTrue}
							maxLength={1000}
							rows={2}
							className="min-h-0"
							placeholder={t("noul.placeholderTrue")}
							onChange={(event) =>
								onChange({ ...question, whenTrue: event.target.value })
							}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={falseId}>{t("noul.whenFalse")}</Label>
						<Textarea
							id={falseId}
							value={question.whenFalse}
							maxLength={1000}
							rows={2}
							className="min-h-0"
							placeholder={t("noul.placeholderFalse")}
							onChange={(event) =>
								onChange({ ...question, whenFalse: event.target.value })
							}
						/>
					</div>
					<p className="text-xs text-muted-foreground sm:col-span-2">
						{t("noul.hint")}
					</p>
				</div>

				{issues.length > 0 && (
					<ul className="flex flex-col gap-1 text-xs text-destructive">
						{issues.map((issue) => (
							<li key={`${issue.path}:${issue.message}`}>{issue.message}</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
