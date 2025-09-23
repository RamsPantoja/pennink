import { AtSymbolIcon } from "@heroicons/react/24/outline";
import { CheckCircle, XCircle, AlertCircle, Target } from "lucide-react";
import { useState } from "react";
import { Response } from "~/components/ai-elements/response";
import { Button } from "~/components/common/Button";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import type { FormFieldType } from "~/lib/enum";

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
	const questions = data.questions;

	return (
		<div className="flex flex-col px-4 py-8 max-w-4xl text-mocha-text gap-8">
			{/* Header */}
			<div className="flex flex-col">
				<div className="flex flex-col">
					<p className="text-sm">{data.username}</p>
					<div className="flex items-center gap-2">
						<AtSymbolIcon className="min-w-4 h-4" />
						<p className="text-sm text-mocha-sub-text">{data.email}</p>
					</div>
				</div>
				<p className="tracking-wider font-semibold text-lg pt-4">
					{data.form.title}
				</p>
				<p className="text-sm text-mocha-sub-text">
					Description: {data.form.description}
				</p>
			</div>

			{/* Questions Review */}
			<div className="flex flex-col gap-4">
				<p className="font-semibold">Detailed review of questions</p>
				{questions.map((item) => {
					// @ts-expect-error
					const userAnswer = data.answers[item.key];

					return (
						<Card
							key={item.key}
							className="bg-mocha-mantle rounded-2xl shadow-none flex flex-col gap-4"
						>
							<div className="text-lg flex items-start gap-2">
								<span className="text-sm font-black">{item.key}.</span>
								<p className="text-balance text-base font-semibold">
									{item.label}
								</p>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<h4 className="font-semibold text-sm text-mocha-sub-text">
										Answer:
									</h4>
									<div className="p-3 bg-muted rounded-lg">
										{item.type === "select" && (
											<p className="text-sm">
												{item.questionOptions?.find(
													(option) => option.value === userAnswer,
												)?.label || "No answer"}
											</p>
										)}
										{item.type === "radio" && (
											<p className="text-sm">
												{item.questionOptions?.find(
													(option) => option.value === userAnswer,
												)?.label || "No answer"}
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
															return option ? option.label : item;
														})
														.join(", ")}
											</p>
										)}
										{item.type === "switch" &&
											typeof userAnswer === "boolean" && (
												<p className="text-sm">
													{userAnswer ? "True" : "False"}
												</p>
											)}
										{item.type === "slider" && Array.isArray(userAnswer) && (
											<p className="text-sm">{userAnswer[0]}</p>
										)}
										{item.type === "textarea" && (
											<p className="text-sm">
												{userAnswer ?? "No answer provided"}
											</p>
										)}
										{item.type === "date" && (
											<p className="text-sm">
												{userAnswer ?? "No answer provided"}
											</p>
										)}
										{item.type === "email" && (
											<p className="text-sm">
												{userAnswer ?? "No answer provided"}
											</p>
										)}
										{item.type === "text" && (
											<p className="text-sm">
												{userAnswer ?? "No answer provided"}
											</p>
										)}
										{item.type === "number" && (
											<p className="text-sm">
												{userAnswer ?? "No answer provided"}
											</p>
										)}
									</div>
								</div>
							</div>
							{item.questionOptions && item.questionOptions.length > 0 && (
								<div className="space-y-2">
									<h4 className="font-semibold text-sm text-mocha-sub-text">
										Available options:
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
