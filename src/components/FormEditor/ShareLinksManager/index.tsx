import { env } from "~/env";
import { useMemo } from "react";
import useShareLinksManagerLogic from "./useShareLinksManagerLogic";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/common/Button";
import { Loading } from "~/components/common/Loading";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import ClipBoard from "~/components/common/Clipboard";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import InputFeedbackMessage from "~/components/common/InputFeedbackMessage";

type ShareLinksManagerProps = {
	id: string;
};

export const ShareLinksManager = ({ id }: ShareLinksManagerProps) => {
	const {
		openShareLinkMenu,
		setShareLinkMenu,
		onCreateShareLinkForm,
		createShareLinkFormIsPending,
		useFormShareLinkForm,
		shareLinkData,
		shareLinkIsPending,
		shareLinkError,
	} = useShareLinksManagerLogic({ id });

	const { register, formState, handleSubmit } = useFormShareLinkForm;

	const clipboardContent = useMemo(() => {
		return `${env.NEXT_PUBLIC_BASE_URL}/workspace/notes/${shareLinkData?.shareLinkId}`;
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
						<div className="flex items-center border-mocha-mauve border rounded-[5px] gap-4">
							<p
								className="text-xs text-mocha-sub-text truncate ml-2"
								title={clipboardContent}
							>
								{clipboardContent}
							</p>
							<ClipBoard className="rounded-[4px]" content={clipboardContent} />
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
							isPending={createShareLinkFormIsPending}
							onClick={handleSubmit(onCreateShareLinkForm)}
						>
							Generate link
						</Button>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
};
