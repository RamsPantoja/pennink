import { useEffect, useRef, useState } from "react";

import type { Subscription } from "~/lib/enum";
import { api } from "~/utils/api";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { env } from "~/env";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Button } from "../common/Button";
import {
	ArrowPathIcon,
	DocumentMagnifyingGlassIcon,
	LinkIcon,
	PaperAirplaneIcon,
	SparklesIcon,
} from "@heroicons/react/24/outline";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { AutoResizeTextarea } from "../common/AutoSizeTextarea";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { cn, markdownToHtml } from "~/lib/utils";
import InputFeedbackMessage from "../common/InputFeedbackMessage";

const insertLinkValidationSchema = z.object({
	link: z.string().min(1, "Required field").url().min(1),
	prompt: z.string().trim().optional(),
});

export type InsertLinkValidationSchema = z.infer<
	typeof insertLinkValidationSchema
>;

type InsertContentLinkDialogProps = {
	onInsert: (content: string) => void;
};

export default function InsertContentLinkDialog({
	onInsert,
}: InsertContentLinkDialogProps) {
	const [open, setOpen] = useState(false);
	const [linkContent, setLinkContent] = useState("");
	const messageContainerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (messageContainerRef.current) {
			const html = markdownToHtml(linkContent);
			messageContainerRef.current.innerHTML = html;
		}
	}, [linkContent]);

	const {
		control,
		formState: { errors },
		register,
		handleSubmit,
	} = useForm<InsertLinkValidationSchema>({
		resolver: zodResolver(insertLinkValidationSchema),
		defaultValues: {
			prompt: "",
			link: "",
		},
	});

	const { mutate: onProcessLinkMutate, isPending: onProcessLinkIsPending } =
		useMutation({
			mutationFn: (data: InsertLinkValidationSchema) => {
				return fetch("/api/ai/url-scraping", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						url: data.link,
						prompt: data.prompt,
					}),
				});
			},
			onSuccess: async (data) => {
				try {
					const stream = data.body;

					if (stream) {
						const reader = stream.getReader();
						const textDecoder = new TextDecoder();

						while (true) {
							const { done, value } = await reader.read();

							if (value) {
								setLinkContent((prev) => prev + textDecoder.decode(value));
							}

							if (done) {
								reader.releaseLock();
								break;
							}
						}
					}
				} catch (error) {
					console.error("Mutation failed:", error);
					toast.error("An error occurred while sending your message.");
				}
			},
			onError: (error) => {
				// Handle error
				console.error("Mutation failed:", error);
				toast.error("An error occurred while sending your message.");
			},
		});

	const onProcessLink = async (data: InsertLinkValidationSchema) => {
		setLinkContent("");
		onProcessLinkMutate({ link: data.link, prompt: data.prompt });
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				setOpen(v);
				setLinkContent("");
			}}
		>
			<Tooltip>
				<TooltipTrigger asChild>
					<DialogTrigger asChild>
						<Button variant="ghost" size="icon">
							<LinkIcon className="h-5 min-w-5" />
						</Button>
					</DialogTrigger>
				</TooltipTrigger>
				<TooltipContent>Import content from link</TooltipContent>
			</Tooltip>
			<DialogContent className="max-w-screen-md">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold">
						Import content from link
					</DialogTitle>
					<DialogDescription className="">
						Copy the link to the content you want to insert in editor and paste
						it here. You can also process the content with AI.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4 h-full">
					<div className="flex gap-2 items-center">
						<SparklesIcon className="min-w-4 h-4 text-mochaText" />
						<Controller
							control={control}
							name="prompt"
							render={({ field }) => (
								<AutoResizeTextarea
									placeholder="Ask AI to process the content..."
									className="border-none ring-0 text-mochaText bg-mochaMantle"
									onChange={field.onChange}
									value={field.value}
								/>
							)}
						/>
					</div>
					<div className="flex gap-2">
						<div className="flex flex-col gap-1">
							<Input
								{...register("link")}
								placeholder="Type or paste link here"
							/>
							{errors.link && (
								<InputFeedbackMessage
									status="ERROR"
									message={errors.link.message}
								/>
							)}
						</div>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="secondary"
									onClick={handleSubmit(onProcessLink)}
									isPending={onProcessLinkIsPending}
								>
									<DocumentMagnifyingGlassIcon className="h-5 min-w-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Search link</TooltipContent>
						</Tooltip>
					</div>
					{linkContent && (
						<Card className="flex flex-col flex-1 max-h-96 overflow-auto p-4 border border-mochaMantle">
							<div
								ref={messageContainerRef}
								className={cn([
									"flex flex-col markdown-styles prismjs-theme overflow-auto",
								])}
							/>
						</Card>
					)}
				</div>
				<DialogFooter>
					<Button
						disabled={linkContent === "" || onProcessLinkIsPending}
						className="w-fit"
						onClick={() => {
							onInsert(linkContent);
							setOpen(false);
						}}
					>
						Insert content
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
