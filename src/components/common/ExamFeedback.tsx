import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";

type ExamFeedbackProps = {
	open: boolean;
};

export const ExamFeedback = ({ open }: ExamFeedbackProps) => {
	return (
		<Dialog open={open}>
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>Exam results</DialogTitle>
					<DialogDescription>
						Here you can see your exam results and feedback.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4 text-mocha-text">
					<p>Exam Feedback</p>
				</div>
			</DialogContent>
		</Dialog>
	);
};
