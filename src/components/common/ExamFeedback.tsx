import { useTranslations } from "next-intl";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Response } from "../ai-elements/response";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { Skeleton } from "../ui/skeleton";
import {
	type ExamReviewData,
	ExamQuestionReview,
	toReviewQuestions,
} from "./ExamQuestionReview";

type ExamFeedbackProps = {
	open: boolean;
	isGrading: boolean;
	setOpen: (open: boolean) => void;
	review?: ExamReviewData | null;
};

export const ExamFeedback = ({
	open,
	isGrading,
	setOpen,
	review,
}: ExamFeedbackProps) => {
	const t = useTranslations("ExamFeedback");

	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				if (!isGrading) {
					setOpen(value);
				}
			}}
		>
			<DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
				<DialogHeader>
					<DialogTitle>{t("dialog.title")}</DialogTitle>
					<DialogDescription>{t("dialog.description")}</DialogDescription>
				</DialogHeader>
				{isGrading && (
					<Card className="flex flex-col gap-2">
						<Skeleton className="w-full h-10" />
						<Skeleton className="w-full max-w-3xs h-6" />
						<Skeleton className="w-full max-w-md h-6" />
						<Skeleton className="w-full h-10" />
						<Skeleton className="w-full max-w-3xs h-6" />
						<Skeleton className="w-full max-w-md h-6" />
						<Skeleton className="w-full max-w-3xs h-6" />
						<Skeleton className="w-full max-w-md h-6" />
						<Skeleton className="w-full max-w-3xs h-6" />
					</Card>
				)}
				{!isGrading && review && (
					<div className="flex flex-col gap-4 min-h-0 flex-1 overflow-auto text-foreground">
						<Card className="flex flex-col gap-2">
							<p className="text-sm">{t("score.title")}</p>
							<p className="text-xl font-bold">{review.score}/100</p>
							<Progress value={review.score} />
						</Card>
						<ExamQuestionReview questions={toReviewQuestions(review)} />
						{review.feedback && <Response content={review.feedback} />}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};
