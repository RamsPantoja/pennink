import { useEffect, useRef, useState } from "react";
import { sileo } from "sileo";
import { useTranslations } from "next-intl";
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
import { LinkIcon, SparklesIcon } from "@heroicons/react/24/outline";
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
	link: z.string().min(1, "validation.required").url("validation.invalidUrl"),
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
	const t = useTranslations("InsertContentLinkDialog");
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
					sileo.error({ title: t("toast.error") });
				}
			},
			onError: (error) => {
				console.error("Mutation failed:", error);
				sileo.error({ title: t("toast.error") });
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
				<TooltipContent>{t("tooltip.importFromLink")}</TooltipContent>
			</Tooltip>
			<DialogContent className="max-w-(--breakpoint-md) w-full flex flex-col">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold">
						{t("dialog.title")}
					</DialogTitle>
					<DialogDescription>{t("dialog.description")}</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4 h-full w-full">
					<div className="flex gap-2 w-full">
						<div className="flex flex-col gap-1 w-full">
							<Input
								{...register("link")}
								placeholder={t("input.linkPlaceholder")}
							/>
							{errors.link && (
								<InputFeedbackMessage
									status="ERROR"
									message={
										errors.link.message === "Required field"
											? t("validation.required")
											: t("validation.invalidUrl")
									}
								/>
							)}
						</div>
					</div>
					<div className="flex gap-2 items-center">
						<SparklesIcon className="min-w-4 h-4 text-foreground" />
						<Controller
							control={control}
							name="prompt"
							render={({ field }) => (
								<AutoResizeTextarea
									placeholder={t("input.promptPlaceholder")}
									className="border-none ring-0 text-foreground bg-muted"
									onChange={field.onChange}
									value={field.value}
								/>
							)}
						/>
					</div>
					{linkContent && (
						<Card className="flex flex-col flex-1 max-h-96 w-full p-4 border border-muted overflow-auto">
							<div
								ref={messageContainerRef}
								className={cn(["flex flex-col markdown-styles prismjs-theme"])}
							/>
						</Card>
					)}
				</div>
				<DialogFooter>
					<Button
						variant="secondary"
						onClick={handleSubmit(onProcessLink)}
						isPending={onProcessLinkIsPending}
					>
						{t("button.searchLink")}
					</Button>
					{!(linkContent === "" || onProcessLinkIsPending) && (
						<Button
							className="w-fit"
							onClick={() => {
								onInsert(linkContent);
								setOpen(false);
							}}
						>
							{t("button.insertContent")}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
