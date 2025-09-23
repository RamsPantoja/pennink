import { Fragment, useState } from "react";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Loading } from "~/components/common/Loading";
import type { FormType } from "~/lib/enum";
import { api } from "~/utils/api";
import { ExamResultCard } from "./ExamResultCard";
import ClipBoard from "~/components/common/Clipboard";
import { Separator } from "~/components/ui/separator";
import type { SelectedLink } from "./useFormLoaderStore";
import { FormResultCard } from "./FormResultCard";
import { ExamReview } from "./ExamOverview";
import { FormReview } from "./FormOverview";

type ResultOverviewProps = {
	resultId: string;
	type: FormType;
};

export const ResultOverview = ({ resultId, type }: ResultOverviewProps) => {
	return (
		<div className="flex flex-col gap-4 w-full h-full overflow-auto">
			{type === "BASIC" && <FormResultOverview formResponseId={resultId} />}
			{type === "EXAM" && <ExamResultOverview examResultId={resultId} />}
		</div>
	);
};

const ExamResultOverview = ({ examResultId }: { examResultId: string }) => {
	const {
		data: result,
		isPending: resultIsPending,
		error: resultError,
	} = api.form.examResult.useQuery({
		examResultId,
	});

	return (
		<div className="flex flex-col gap-4 w-full h-full">
			{resultIsPending && <Loading />}
			{!resultIsPending && resultError && (
				<FeedbackMessage status="ERROR" message={resultError.message} />
			)}
			{!resultIsPending && !resultError && result && (
				<ExamReview
					data={{
						id: result.id,
						username: result.username,
						email: result.email,
						answers: result.answers as JSON,
						feedback: result.feedback,
						score: result.score,
						exam: {
							title: result.exam.title,
							instructions: result.exam.instructions,
						},
						questions: result.examVersion.questionsToExamVersions.map(
							(questionToExamVersion) => ({
								key: questionToExamVersion.question.key,
								type: questionToExamVersion.question.type,
								label: questionToExamVersion.question.label,
								answer: questionToExamVersion.question.answer,
								questionOptions:
									questionToExamVersion.question.questionOptions.map(
										(option) => ({
											label: option.label,
											value: option.value,
										}),
									),
							}),
						),
					}}
				/>
			)}
		</div>
	);
};

const FormResultOverview = ({ formResponseId }: { formResponseId: string }) => {
	const {
		data: result,
		isPending: resultIsPending,
		error: resultError,
	} = api.form.formResponse.useQuery({
		formResponseId,
	});

	return (
		<div className="flex flex-col gap-4 w-full h-full">
			{resultIsPending && <Loading />}
			{!resultIsPending && resultError && (
				<FeedbackMessage status="ERROR" message={resultError.message} />
			)}
			{!resultIsPending && !resultError && result && (
				<FormReview
					data={{
						id: result.id,
						username: result.username,
						email: result.email,
						answers: result.answers as JSON,
						form: {
							title: result.form.title,
							description: result.form.description,
						},
						questions: result.formVersion.questionsToFormVersions.map(
							(questionToFormersion) => ({
								key: questionToFormersion.question.key,
								type: questionToFormersion.question.type,
								label: questionToFormersion.question.label,
								questionOptions:
									questionToFormersion.question.questionOptions.map(
										(option) => ({
											label: option.label,
											value: option.value,
										}),
									),
							}),
						),
					}}
				/>
			)}
		</div>
	);
};
