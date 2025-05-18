"use client";

import {
	ChatBubbleLeftEllipsisIcon,
	MegaphoneIcon,
} from "@heroicons/react/24/outline";
import type { Session } from "next-auth";
import { Textarea } from "../ui/textarea";
import useFeedbackLogic from "./useFeedbackLogic";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../common/Button";
import InputFeedbackMessage from "../common/InputFeedbackMessage";

type FeedbackProps = {
	session: Session;
};

export const Feedback = ({ session }: FeedbackProps) => {
	const {
		openCommentsBox,
		setOpenCommentsBox,
		onSendFeedback,
		createFeedbackIsPending,
		useFormFeedback,
	} = useFeedbackLogic();

	const { register, formState, handleSubmit } = useFormFeedback;

	return (
		<Popover
			open={openCommentsBox}
			onOpenChange={(open) => {
				setOpenCommentsBox(open);
			}}
		>
			<PopoverTrigger asChild>
				<Button
					size="sm"
					variant="outline"
					startIcon={<MegaphoneIcon className="w-5 h-5" />}
				>
					Feedback
				</Button>
			</PopoverTrigger>
			<PopoverContent className="max-h-[--radix-popover-content-available-height] overflow-auto">
				<div className="flex gap-2 flex-col items-end w-full">
					<p className="text-xs">
						Share feedback or ideas on how we can improve Pennink
					</p>
					<div className="flex flex-col w-full h-full gap-2">
						<Textarea
							placeholder="Please share your feedback"
							className="resize-none"
							rows={7}
							{...register("content")}
						/>
						{formState.errors.content && (
							<InputFeedbackMessage
								status="ERROR"
								message={formState.errors.content.message}
							/>
						)}
					</div>
					<Button
						size="sm"
						variant="default"
						isPending={createFeedbackIsPending}
						onClick={handleSubmit(onSendFeedback)}
					>
						Send
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
};
