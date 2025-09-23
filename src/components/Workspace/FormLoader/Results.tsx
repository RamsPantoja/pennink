import { Fragment } from "react";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Loading } from "~/components/common/Loading";
import type { FormType } from "~/lib/enum";
import { api } from "~/utils/api";
import { ExamResultCard } from "./ExamResultCard";
import ClipBoard from "~/components/common/Clipboard";
import { Separator } from "~/components/ui/separator";
import type { SelectedLink } from "./useFormLoaderStore";
import { FormResultCard } from "./FormResultCard";

type ResultsProps = {
	link: SelectedLink;
	type: FormType;
};

export const Results = ({ link, type }: ResultsProps) => {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col w-full">
				<p className="text-mocha-text">{link.key}</p>
				<div className="flex items-center gap-2">
					<p className="text-xs text-mocha-sub-text truncate" title={link.link}>
						{link.link}
					</p>
					<ClipBoard className="rounded-[4px]" content={link.link} />
				</div>
			</div>
			<Separator />
			{type === "BASIC" && <FormResults linkId={link.id} />}
			{type === "EXAM" && <ExamResults linkId={link.id} />}
		</div>
	);
};

const ExamResults = ({ linkId }: { linkId: string }) => {
	const {
		data: results,
		isPending: resultsIsPending,
		error: resultsError,
	} = api.form.examResults.useQuery({
		examLinkId: linkId,
	});

	return (
		<div className="flex flex-col gap-4">
			{resultsIsPending && <Loading />}
			{!resultsIsPending && resultsError && (
				<FeedbackMessage status="ERROR" message={resultsError.message} />
			)}
			{!resultsIsPending && !resultsError && results && results.length > 0 && (
				<div className="flex flex-col gap-2 w-full overflow-auto">
					{results.map((result) => (
						<ExamResultCard
							key={result.id}
							email={result.email}
							username={result.username}
							createdAt={result.createdAt}
							score={result.score}
							id={result.id}
						/>
					))}
				</div>
			)}
			{!resultsIsPending &&
				!resultsError &&
				results &&
				results.length === 0 && (
					<FeedbackMessage
						status="INFORMATION"
						message="Your exam results will appear here"
					/>
				)}
		</div>
	);
};

const FormResults = ({ linkId }: { linkId: string }) => {
	const {
		data: results,
		isPending: resultsIsPending,
		error: resultsError,
	} = api.form.formResponses.useQuery({
		formLinkId: linkId,
	});

	return (
		<div className="flex flex-col gap-4">
			{resultsIsPending && <Loading />}
			{!resultsIsPending && resultsError && (
				<FeedbackMessage status="ERROR" message={resultsError.message} />
			)}
			{!resultsIsPending && !resultsError && results && results.length > 0 && (
				<div className="flex flex-col gap-2 w-full overflow-auto">
					{results.map((result) => (
						<FormResultCard
							key={result.id}
							email={result.email}
							username={result.username}
							createdAt={result.createdAt}
							id={result.id}
						/>
					))}
				</div>
			)}
			{!resultsIsPending &&
				!resultsError &&
				results &&
				results.length === 0 && (
					<FeedbackMessage
						status="INFORMATION"
						message="Your form results will appear here"
					/>
				)}
		</div>
	);
};
