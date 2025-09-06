import { MegaphoneIcon } from "@heroicons/react/24/outline";
import type { Session } from "next-auth";
import { Textarea } from "../ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../common/Button";
import InputFeedbackMessage from "../common/InputFeedbackMessage";
import useShareLinkEditorLogic from "./useShareLinkEditorLogic";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Loading } from "../common/Loading";
import FeedbackMessage from "../common/FeedbackMessage";
import ClipBoard from "../common/Clipboard";
import { env } from "~/env";
import { useMemo } from "react";

type ShareLinkEditorProps = {
	noteId: string;
};

export const ShareLinkEditor = ({ noteId }: ShareLinkEditorProps) => {
	const {
		openShareLinkMenu,
		setShareLinkMenu,
		onSendShareLinkEditor,
		createShareLinkEditorIsPending,
		useFormShareLinkEditor,
		shareLinkData,
		shareLinkIsPending,
		shareLinkError,
	} = useShareLinkEditorLogic({ noteId });

	const { register, formState, handleSubmit } = useFormShareLinkEditor;

	const clipboardContent = useMemo(() => {
		return `${env.NEXT_PUBLIC_BASE_URL}/workspace/editor/${shareLinkData?.shareLinkId}`;
	}, [shareLinkData]);

	return (
		<Popover
			open={openShareLinkMenu}
			onOpenChange={(open) => {
				setShareLinkMenu(open);
			}}
		>
			<PopoverTrigger asChild>
				<Button size="sm" variant="ghost">
					Share
				</Button>
			</PopoverTrigger>
			<PopoverContent className="max-h-(--radix-popover-content-available-height) overflow-auto">
				{shareLinkIsPending && <Loading />}
				{!shareLinkIsPending && shareLinkError && (
					<FeedbackMessage status="ERROR" message={shareLinkError.message} />
				)}
				{!shareLinkIsPending && !shareLinkError && shareLinkData && (
					<div className="flex gap-2 w-full flex-col">
						<p>Copy and share your link</p>
						<div className="flex items-center border-mocha-mauve border rounded-md gap-4 p-3">
							<p className="text-xs text-mocha-sub-text truncate">
								{clipboardContent}
							</p>
							<ClipBoard content={clipboardContent} />
						</div>
					</div>
				)}
				{!shareLinkIsPending && !shareLinkError && !shareLinkData && (
					<div className="flex gap-4 flex-col items-end w-full">
						<p className="text-sm text-mocha-text">
							Create a shareable link for your notes
						</p>
						<div className="flex flex-col w-full h-full gap-2">
							<Label htmlFor="key">Keyword</Label>
							<Input
								placeholder="Add a keyword to your link"
								className="resize-none"
								{...register("key")}
							/>
							{formState.errors.key && (
								<InputFeedbackMessage
									status="ERROR"
									message={formState.errors.key.message}
								/>
							)}
						</div>
						<p className="text-xs text-mocha-sub-text">
							Anyone on the web with the link can view your notes
						</p>
						<Button
							size="sm"
							variant="default"
							isPending={createShareLinkEditorIsPending}
							onClick={handleSubmit(onSendShareLinkEditor)}
						>
							Generate link
						</Button>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
};
