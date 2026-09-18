import type { ChatStatus, UIDataTypes, UIMessage, UITools } from "ai";
import { useTranslations } from "next-intl";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Response } from "../ai-elements/response";
import { Fragment } from "react";
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from "../ai-elements/reasoning";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

type ExamFeedbackProps = {
	open: boolean;
	messages: UIMessage<unknown, UIDataTypes, UITools>[];
	status: ChatStatus;
	setOpen: (open: boolean) => void;
};

export const ExamFeedback = ({
	open,
	messages,
	status,
	setOpen,
}: ExamFeedbackProps) => {
	const t = useTranslations("ExamFeedback");

	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				if (status === "ready") {
					setOpen(value);
				}
			}}
		>
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>{t("dialog.title")}</DialogTitle>
					<DialogDescription>{t("dialog.description")}</DialogDescription>
				</DialogHeader>
				{status === "submitted" && (
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
				{status !== "submitted" && (
					<div className="flex flex-col gap-4 text-foreground max-h-[720px] overflow-auto">
						{messages.map((message, index) => {
							return (
								<div key={message.id}>
									{message.parts.length > 0 && (
										<Fragment>
											{message.parts.map((part, i) => {
												switch (part.type) {
													case "text":
														return (
															<Response
																key={`${message.id}-${i}`}
																content={part.text}
															/>
														);
													case "reasoning":
														return (
															<Reasoning
																key={`${message.id}-${i}`}
																className="w-full"
																isStreaming={status === "streaming"}
															>
																<ReasoningTrigger />
																<ReasoningContent content={part.text} />
															</Reasoning>
														);
												}
											})}
										</Fragment>
									)}
								</div>
							);
						})}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};
