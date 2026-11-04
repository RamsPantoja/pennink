"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Fragment, useState } from "react";
import type {
	EvaluationAnswer,
	EvaluationAnswers,
} from "~/server/api/schemas/evaluation-run";
import { api } from "~/trpc/react";
import { Button } from "../common/Button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";

type Props = { runId: string; onBack: () => void };

export function RunResults({ runId, onBack }: Props) {
	const t = useTranslations("EvaluateExams");
	const utils = api.useUtils();
	const [open, setOpen] = useState<string | null>(null);
	const run = api.evaluationRun.byId.useQuery(
		{ id: runId },
		{
			placeholderData: keepPreviousData,
			// Keep polling while any student is still being graded.
			refetchInterval: (query) =>
				query.state.data?.submissions.some(
					(s) => s.status === "pending" || s.status === "running",
				)
					? 3000
					: false,
		},
	);
	const grade = api.evaluationRun.grade.useMutation({
		onSettled: () => utils.evaluationRun.byId.invalidate({ id: runId }),
	});
	const override = api.evaluationRun.overrideAnswer.useMutation({
		onSuccess: () => utils.evaluationRun.byId.invalidate({ id: runId }),
	});

	const exportRun = async () => {
		const { filename, csv } = await utils.evaluationRun.exportCsv.fetch({
			runId,
		});
		const url = URL.createObjectURL(
			new Blob([csv], { type: "text/csv;charset=utf-8" }),
		);
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
	};

	if (run.isLoading || !run.data)
		return <Skeleton className="m-3 h-96 rounded-xl" />;
	const data = run.data;

	return (
		<div className="flex w-full flex-col gap-6 p-3">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<Button variant="outline" onClick={onBack}>
					{t("button.back")}
				</Button>
				<Button variant="outline" onClick={exportRun}>
					{t("button.export")}
				</Button>
			</div>

			<div className="flex flex-col gap-1">
				<h2 className="text-lg font-semibold">{data.name}</h2>
				<span className="text-muted-foreground text-sm">
					{t("results.schema", {
						count: data.schemaSnapshot.questions.length,
					})}
				</span>
			</div>

			<div className="overflow-x-auto rounded-md border">
				<table className="w-full text-sm">
					<thead className="bg-muted/50 text-left">
						<tr>
							<th className="px-3 py-2">{t("results.student")}</th>
							<th className="px-3 py-2">{t("results.status")}</th>
							<th className="px-3 py-2">{t("results.total")}</th>
							<th className="px-3 py-2" />
						</tr>
					</thead>
					<tbody>
						{data.submissions.map((submission) => {
							const answers = (submission.answers ?? {}) as EvaluationAnswers;
							const isOpen = open === submission.id;
							return (
								<Fragment key={submission.id}>
									<tr className="border-t">
										<td className="px-3 py-2 font-medium">
											{submission.studentName}
										</td>
										<td className="px-3 py-2">
											<Badge variant="outline">
												{t(`status.${submission.status}`)}
											</Badge>
											{submission.errorMessage && (
												<p className="text-destructive mt-1 text-xs">
													{submission.errorMessage}
												</p>
											)}
										</td>
										<td className="px-3 py-2">{submission.score ?? "—"}</td>
										<td className="flex gap-2 px-3 py-2">
											{submission.status !== "pending" &&
												submission.status !== "running" && (
													<Button
														size="sm"
														variant="outline"
														onClick={() =>
															setOpen(isOpen ? null : submission.id)
														}
													>
														{isOpen ? t("button.hide") : t("button.details")}
													</Button>
												)}
											{(submission.status === "failed" ||
												submission.status === "pending") && (
												<Button
													size="sm"
													variant="outline"
													isPending={
														grade.isPending &&
														grade.variables?.id === submission.id
													}
													onClick={() => grade.mutate({ id: submission.id })}
												>
													{t("button.retry")}
												</Button>
											)}
										</td>
									</tr>
									{isOpen && (
										<tr className="border-t">
											<td colSpan={4} className="bg-muted/20 px-3 py-3">
												<AnswersTable
													answers={answers}
													questionKeys={data.schemaSnapshot.questions.map(
														(q) => q.key,
													)}
													onOverride={(key, score) =>
														override.mutate({
															submissionId: submission.id,
															key,
															score,
														})
													}
												/>
											</td>
										</tr>
									)}
								</Fragment>
							);
						})}
					</tbody>
				</table>
				{data.submissions.length === 0 && (
					<p className="text-muted-foreground p-4 text-sm">
						{t("results.empty")}
					</p>
				)}
			</div>
		</div>
	);
}

function AnswersTable({
	answers,
	questionKeys,
	onOverride,
}: {
	answers: EvaluationAnswers;
	questionKeys: string[];
	onOverride: (key: string, score: number | null) => void;
}) {
	const t = useTranslations("EvaluateExams");
	return (
		<table className="w-full text-sm">
			<thead className="text-left text-xs uppercase">
				<tr>
					<th className="py-1 pr-3">{t("results.question")}</th>
					<th className="py-1 pr-3">{t("results.answer")}</th>
					<th className="py-1 pr-3">{t("results.aiScore")}</th>
					<th className="py-1">{t("results.teacherScore")}</th>
				</tr>
			</thead>
			<tbody>
				{questionKeys.map((key) => {
					const answer = answers[key];
					return answer ? (
						<AnswerRow
							key={key}
							questionKey={key}
							answer={answer}
							onOverride={onOverride}
						/>
					) : null;
				})}
			</tbody>
		</table>
	);
}

function AnswerRow({
	questionKey,
	answer,
	onOverride,
}: {
	questionKey: string;
	answer: EvaluationAnswer;
	onOverride: (key: string, score: number | null) => void;
}) {
	const t = useTranslations("EvaluateExams");
	const [draft, setDraft] = useState(answer.override?.toString() ?? "");
	const shown = describeAnswer(answer, t("answer.box"));

	return (
		<tr className="border-t">
			<td className="py-1 pr-3 font-mono text-xs">{questionKey}</td>
			<td className="py-1 pr-3">
				{shown}
				{answer.flagged && (
					<Badge variant="outline" className="ml-2 text-xs">
						{t("results.flagged")}
					</Badge>
				)}
			</td>
			<td className="py-1 pr-3">{answer.score ?? "—"}</td>
			<td className="py-1">
				{answer.score !== null || answer.override !== undefined ? (
					<div className="flex items-center gap-2">
						<input
							type="number"
							min={0}
							max={100}
							className="border-input bg-background h-8 w-20 rounded-md border px-2"
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							onBlur={() => {
								const next = draft === "" ? null : Number(draft);
								if (next === (answer.override ?? null)) return;
								if (
									next !== null &&
									(!Number.isFinite(next) || next < 0 || next > 100)
								)
									return;
								onOverride(questionKey, next);
							}}
						/>
					</div>
				) : (
					<span className="text-muted-foreground text-xs">
						{t("answer.unscored")}
					</span>
				)}
			</td>
		</tr>
	);
}

function describeAnswer(answer: EvaluationAnswer, boxLabel: string) {
	if (answer.label) return answer.label;
	if (answer.box) return boxLabel;
	if (answer.probability !== undefined)
		return `${Math.round(answer.probability * 100)}%`;
	return answer.score?.toString() ?? "—";
}
