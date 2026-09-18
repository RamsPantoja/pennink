import { AtSymbolIcon } from "@heroicons/react/24/outline";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import type { FormFieldType } from "~/lib/enum";
import { useTranslations } from "next-intl";

type ResultData = {
	id: string;
	username: string;
	email: string;
	answers: JSON;
	form: {
		title: string;
		description: string | null;
	};
	questions: {
		key: string;
		type: FormFieldType;
		label: string;
		questionOptions?: Array<{
			label: string;
			value: string;
		}>;
	}[];
};

interface FormReviewProps {
	data: ResultData;
}

export function FormReview({ data }: FormReviewProps) {
	const t = useTranslations("FormReview");
	const questions = data.questions;

	return (
		<div className="flex flex-col px-4 py-8 max-w-4xl text-foreground gap-8">
			{/* Header */}
			<div className="flex flex-col">
				<div className="flex flex-col">
					<p className="text-sm">{data.username}</p>
					<div className="flex items-center gap-2">
						<AtSymbolIcon className="min-w-4 h-4" />
						<p className="text-sm text-muted-foreground">{data.email}</p>
					</div>
				</div>
				<p className="tracking-wider font-semibold text-lg pt-4">
					{data.form.title}
				</p>
				<p className="text-sm text-muted-foreground">
					{t("descriptionLabel")}: {data.form.description}
				</p>
			</div>

			{/* Questions Review */}
			<div className="flex flex-col gap-4">
				<p className="font-semibold">{t("detailedReview")}</p>
				{questions.map((item) => {
					// @ts-expect-error
					const userAnswer = data.answers[item.key];
					return (
						<Card
							key={item.key}
							className="bg-muted rounded-2xl shadow-none flex flex-col gap-4"
						>
							<div className="text-lg flex items-start gap-2">
								<span className="text-sm font-black">{item.key}.</span>
								<p className="text-balance text-base font-semibold">
									{item.label}
								</p>
							</div>
							<div className="space-y-2">
								<h4 className="font-semibold text-sm text-muted-foreground">
									{t("answerLabel")}:
								</h4>
								<div className="p-3 bg-card rounded-lg">
									{item.type === "select" && (
										<p className="text-sm">
											{item.questionOptions?.find(
												(option) => option.value === userAnswer,
											)?.label || t("noAnswer")}
										</p>
									)}
									{item.type === "radio" && (
										<p className="text-sm">
											{item.questionOptions?.find(
												(option) => option.value === userAnswer,
											)?.label || t("noAnswer")}
										</p>
									)}
									{item.type === "checkbox" && (
										<p className="text-sm">
											{Array.isArray(userAnswer) &&
												userAnswer
													.map((answer) => {
														const option = item.questionOptions?.find(
															(opt) => opt.value === answer,
														);
														return option ? option.label : answer;
													})
													.join(", ")}
										</p>
									)}
									{item.type === "switch" &&
										typeof userAnswer === "boolean" && (
											<p className="text-sm">
												{userAnswer ? t("trueValue") : t("falseValue")}
											</p>
										)}
									{item.type === "slider" && Array.isArray(userAnswer) && (
										<p className="text-sm">{userAnswer[0]}</p>
									)}
									{item.type === "textarea" && (
										<p className="text-sm">
											{userAnswer ?? t("noAnswerProvided")}
										</p>
									)}
									{item.type === "date" && (
										<p className="text-sm">
											{userAnswer ?? t("noAnswerProvided")}
										</p>
									)}
									{item.type === "email" && (
										<p className="text-sm">
											{userAnswer ?? t("noAnswerProvided")}
										</p>
									)}
									{item.type === "text" && (
										<p className="text-sm">
											{userAnswer ?? t("noAnswerProvided")}
										</p>
									)}
									{item.type === "number" && (
										<p className="text-sm">
											{userAnswer ?? t("noAnswerProvided")}
										</p>
									)}
								</div>
							</div>
							{item.questionOptions && item.questionOptions.length > 0 && (
								<div className="space-y-2">
									<h4 className="font-semibold text-sm text-muted-foreground">
										{t("availableOptions")}:
									</h4>
									<div className="flex flex-wrap gap-2">
										{item.questionOptions.map((option) => (
											<Badge key={option.value} variant="outline">
												{option.label}
											</Badge>
										))}
									</div>
								</div>
							)}
						</Card>
					);
				})}
			</div>
		</div>
	);
}
