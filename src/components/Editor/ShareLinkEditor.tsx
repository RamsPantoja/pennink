import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../common/Button";
import { useTranslations } from "next-intl";
import useShareLinkEditorLogic from "./useShareLinkEditorLogic";
import { Loading } from "../common/Loading";
import FeedbackMessage from "../common/FeedbackMessage";
import ClipBoard from "../common/Clipboard";
import { env } from "~/env";
import { useMemo } from "react";

type ShareLinkEditorProps = {
	noteId: string;
};

export const ShareLinkEditor = ({ noteId }: ShareLinkEditorProps) => {
	const t = useTranslations("ShareLinkEditor");
	const {
		openShareLinkMenu,
		setShareLinkMenu,
		onCreateLinkEditor,
		createLinkEditorIsPending,
		linkData,
		linkIsPending,
		linkError,
	} = useShareLinkEditorLogic({ noteId });

	const clipboardContent = useMemo(() => {
		return `${env.NEXT_PUBLIC_BASE_URL}/notes/${linkData?.id}`;
	}, [linkData]);

	return (
		<Popover
			open={openShareLinkMenu}
			onOpenChange={(open) => {
				setShareLinkMenu(open);
			}}
		>
			<PopoverTrigger asChild>
				<Button size="sm" variant="ghost">
					{t("button.share")}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="max-h-(--radix-popover-content-available-height) overflow-auto">
				{linkIsPending && <Loading />}
				{!linkIsPending && linkError && (
					<FeedbackMessage status="ERROR" message={linkError.message} />
				)}
				{!linkIsPending && !linkError && linkData && (
					<div className="flex gap-2 w-full flex-col">
						<p>{t("message.copyAndShare")}</p>
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
				{!linkIsPending && !linkError && !linkData && (
					<div className="flex gap-4 flex-col items-end w-full">
						<p className="text-sm text-mocha-text">
							{t("message.createShareableLink")}
						</p>
						<p className="text-xs text-mocha-sub-text">
							{t("message.anyoneCanView")}
						</p>
						<Button
							size="sm"
							variant="default"
							isPending={createLinkEditorIsPending}
							onClick={onCreateLinkEditor}
						>
							{t("button.generateLink")}
						</Button>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
};
