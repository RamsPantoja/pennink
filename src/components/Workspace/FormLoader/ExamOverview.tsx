import { AtSymbolIcon } from "@heroicons/react/24/outline";
import { CheckCircle, XCircle, AlertCircle, Target } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
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
	feedback: string;
	score: number;
	exam: {
		title: string;
		instructions: string | null;
	};
	questions: {
		key: string;
		type: FormFieldType;
		label: string;
		answer: any;
		questionOptions?: Array<{
			label: string;
			value: string;
		}>;
	}[];
};

interface ExamReviewProps {
	data: ResultData;
}

export function ExamReview({ data }: ExamReviewProps) {
	const t = useTranslations("ExamReview");
	const [showFeedback, setShowFeedback] = useState(false);
	const questions = data.questions;
	const totalQuestions = questions.length;
	const answeredQuestions = Object.keys(data.answers).length;
	const scorePercentage = (data.score / 100) * 100;

	const getQuestionStatus = (
		questionKey: string,
		userAnswer: any,
		correctAnswer: any,
	) => {
		if (!userAnswer) return "unanswered";

		if (Array.isArray(correctAnswer)) {
			if (Array.isArray(userAnswer)) {
				const correctSet = new Set(correctAnswer);
				const userSet = new Set(userAnswer);
				const intersection = [...userSet].filter((x) => correctSet.has(x));
				return intersection.length === correctAnswer.length &&
					userSet.size === correctSet.size
					? "correct"
					: "incorrect";
			}
			return "incorrect";
		}

		return userAnswer.toString() === correctAnswer.toString()
			? "correct"
			: "incorrect";
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "correct":
				return <CheckCircle className="h-5 min-w-5 text-green-500" />;
			case "incorrect":
				return <XCircle className="h-5 min-w-5 text-red-500" />;
			case "unanswered":
				return <AlertCircle className="h-5 min-w-5" />;
			default:
				return null;
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "correct":
				return <Badge variant="outline">{t("correct")}</Badge>;
			case "incorrect":
				return <Badge variant="outline">{t("incorrect")}</Badge>;
			case "unanswered":
				return <Badge variant="outline">{t("unanswered")}</Badge>;
			default:
				return null;
		}
	};

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
					{data.exam.title}
				</p>
				<p className="text-sm text-mocha-sub-text">
					{t("instructions")}: {data.exam.instructions}
				</p>
			</div>

			{/* Performance Summary */}
			<Card className="shadow-none border flex flex-col gap-4 rounded-2xl">
				<div className="flex items-center gap-2">
					<Target className="h-5 w-5" />
					<p className="text-base font-semibold">{t("performanceSummary")}</p>
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="text-center">
						<div className="text-xl font-bold mb-2">{data.score}/100</div>
						<div className="text-sm">{t("finalScore")}</div>
						<Progress value={scorePercentage} className="mt-2" />
					</div>
					<div className="text-center">
						<div className="text-xl font-bold text-accent mb-2">
							{answeredQuestions}/{totalQuestions}
						</div>
						<div className="text-sm">{t("answeredQuestions")}</div>
					</div>
					<div className="text-center">
						<div className="text-xl font-bold mb-2">
							{
								questions.filter(
									(q) =>
										// @ts-expect-error
										getQuestionStatus(q.key, data.answers[q.key], q.answer) ===
										"correct",
								).length
							}
						</div>
						<div className="text-sm">{t("correctAnswers")}</div>
					</div>
				</div>
			</Card>

			{/* Questions Review */}
			<div className="flex flex-col gap-4">
				<p className="font-semibold">{t("detailedQuestionReview")}</p>
				{questions.map((item) => {
					// @ts-expect-error
					const userAnswer = data.answers[item.key];
					const status = getQuestionStatus(item.key, userAnswer, item.answer);

					return (
						<Card
							key={item.key}
							className="bg-mocha-mantle rounded-2xl shadow-none flex flex-col gap-4"
						>
							<div className="flex items-start justify-between">
								<div className="text-lg flex items-start gap-2">
									<span className="text-sm font-black">{item.key}.</span>
									<p className="text-balance text-base font-semibold">
										{item.label}
									</p>
								</div>
								<div className="flex items-center gap-2">
									{getStatusBadge(status)}
									{getStatusIcon(status)}
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<h4 className="font-semibold text-sm text-mocha-sub-text">
										{t("answer")}:
									</h4>
									<div className="p-3 bg-muted rounded-lg">
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
															return option ? option.label : item;
														})
														.join(", ")}
											</p>
										)}
										{item.type === "switch" &&
											typeof userAnswer === "boolean" && (
												<p className="text-sm">
													{userAnswer ? t("true") : t("false")}
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
								<div className="space-y-2">
									<h4 className="font-semibold text-sm text-mocha-sub-text">
										{t("correctAnswer")}:
									</h4>
									<div className="p-3 border border-mocha-mauve bg-mocha-base rounded-2xl">
										{item.type === "select" && (
											<p className="text-sm">
												{item.questionOptions?.find(
													(option) => option.value === item.answer,
												)?.label || t("noAnswer")}
											</p>
										)}
										{item.type === "radio" && (
											<p className="text-sm">
												{item.questionOptions?.find(
													(option) => option.value === item.answer,
												)?.label || t("noAnswer")}
											</p>
										)}
										{item.type === "checkbox" && (
											<p className="text-sm">
												{Array.isArray(item.answer) &&
													item.answer
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
											typeof item.answer === "boolean" && (
												<p className="text-sm">
													{item.answer ? t("true") : t("false")}
												</p>
											)}
										{item.type === "slider" &&
											typeof item.answer === "number" && (
												<p className="text-sm">{item.answer}</p>
											)}
										{item.type === "textarea" && (
											<p className="text-sm">{item.answer}</p>
										)}
										{item.type === "date" && (
											<p className="text-sm">{item.answer}</p>
										)}
										{item.type === "email" && (
											<p className="text-sm">{item.answer}</p>
										)}
										{item.type === "text" && (
											<p className="text-sm">{item.answer}</p>
										)}
										{item.type === "number" && (
											<p className="text-sm">{item.answer}</p>
										)}
									</div>
								</div>
							</div>
							{item.questionOptions && item.questionOptions.length > 0 && (
								<div className="space-y-2">
									<h4 className="font-semibold text-sm text-mocha-sub-text">
										{t("availableOptions")}
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

			{/* Detailed Feedback */}
			<div className="flex flex-col gap-1">
				<Button
					variant="outline"
					className="w-fit"
					onClick={() => setShowFeedback(!showFeedback)}
				>
					{showFeedback ? t("hideFeedback") : t("showFeedback")}
				</Button>
				{showFeedback && (
					<Card className="text-sm max-h-96 overflow-auto border bg-mocha-crust">
						<Response content={data.feedback} />
					</Card>
				)}
			</div>
		</div>
	);
}
