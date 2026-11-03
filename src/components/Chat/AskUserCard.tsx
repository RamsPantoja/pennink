import { useState } from "react";
import { useTranslations } from "next-intl";
import type {
	AskUserAnswer,
	AskUserInput,
	AskUserOutput,
	AskUserQuestion,
} from "~/app/agents/chat/ask-user";
import { Button } from "../common/Button";
import { Card } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const OTHER = "__other__";

type Draft = { selected: string[]; other: string };

const emptyDraft: Draft = { selected: [], other: "" };

type AskUserCardProps = {
	toolCallId: string;
	input: AskUserInput;
	output?: AskUserOutput;
	disabled?: boolean;
	onSubmit: (toolCallId: string, output: AskUserOutput) => void;
};

const isComplete = (question: AskUserQuestion, draft: Draft) => {
	const other = draft.other.trim();

	if (!question.options) return other.length > 0;
	if (draft.selected.includes(OTHER)) return other.length > 0;

	return draft.selected.length > 0;
};

export const AskUserCard = ({
	toolCallId,
	input,
	output,
	disabled,
	onSubmit,
}: AskUserCardProps) => {
	const t = useTranslations("Chat.askUser");
	const [drafts, setDrafts] = useState<Record<string, Draft>>({});

	const updateDraft = (id: string, next: Partial<Draft>) => {
		setDrafts((prev) => ({
			...prev,
			[id]: { ...(prev[id] ?? emptyDraft), ...next },
		}));
	};

	if (output) {
		return (
			<Card className="flex flex-col gap-3 p-4 text-sm">
				{"skipped" in output ? (
					<p className="text-muted-foreground">{t("skipped")}</p>
				) : (
					input.questions.map((question) => {
						const answer = output.answers.find(
							(item: AskUserAnswer) => item.id === question.id,
						);
						const values = [
							...(answer?.selected ?? []),
							...(answer?.other ? [answer.other] : []),
						];

						return (
							<div key={question.id} className="flex flex-col gap-1">
								<p className="font-medium">{question.question}</p>
								<p className="text-muted-foreground">
									{values.length > 0 ? values.join(", ") : "-"}
								</p>
							</div>
						);
					})
				)}
			</Card>
		);
	}

	const canSubmit =
		!disabled &&
		input.questions.every((question) =>
			isComplete(question, drafts[question.id] ?? emptyDraft),
		);

	const submit = () => {
		const answers: AskUserAnswer[] = input.questions.map((question) => {
			const draft = drafts[question.id] ?? emptyDraft;
			const other = draft.other.trim();
			const usesOther = !question.options || draft.selected.includes(OTHER);

			return {
				id: question.id,
				selected: draft.selected.filter((value) => value !== OTHER),
				...(usesOther && other ? { other } : {}),
			};
		});

		onSubmit(toolCallId, { answers });
	};

	return (
		<Card className="flex flex-col gap-4 p-4">
			{input.questions.map((question) => {
				const draft = drafts[question.id] ?? emptyDraft;
				const showOtherInput =
					!question.options || draft.selected.includes(OTHER);

				return (
					<fieldset key={question.id} className="flex flex-col gap-2">
						<legend className="mb-1 text-sm font-medium text-foreground">
							{question.question}
						</legend>

						{question.options && !question.multiSelect && (
							<RadioGroup
								value={draft.selected[0] ?? ""}
								onValueChange={(value) =>
									updateDraft(question.id, { selected: [value] })
								}
								disabled={disabled}
							>
								{[...question.options, OTHER].map((option) => (
									<div key={option} className="flex items-center gap-2">
										<RadioGroupItem
											id={`${toolCallId}-${question.id}-${option}`}
											value={option}
										/>
										<Label
											htmlFor={`${toolCallId}-${question.id}-${option}`}
											className="font-normal"
										>
											{option === OTHER ? t("other") : option}
										</Label>
									</div>
								))}
							</RadioGroup>
						)}

						{question.options && question.multiSelect && (
							<div className="flex flex-col gap-2">
								{[...question.options, OTHER].map((option) => {
									const id = `${toolCallId}-${question.id}-${option}`;
									const checked = draft.selected.includes(option);

									return (
										<div key={option} className="flex items-center gap-2">
											<Checkbox
												id={id}
												checked={checked}
												disabled={disabled}
												onCheckedChange={(next) =>
													updateDraft(question.id, {
														selected: next
															? [...draft.selected, option]
															: draft.selected.filter((v) => v !== option),
													})
												}
											/>
											<Label htmlFor={id} className="font-normal">
												{option === OTHER ? t("other") : option}
											</Label>
										</div>
									);
								})}
							</div>
						)}

						{showOtherInput && (
							<Input
								aria-label={question.question}
								placeholder={t("placeholder")}
								value={draft.other}
								disabled={disabled}
								onChange={(event) =>
									updateDraft(question.id, { other: event.target.value })
								}
							/>
						)}
					</fieldset>
				);
			})}

			<div className="flex justify-end">
				<Button size="sm" onClick={submit} disabled={!canSubmit}>
					{t("submit")}
				</Button>
			</div>
		</Card>
	);
};
