import { useLinksManagerLogic } from "./useLinksManagerLogic";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/common/Button";
import { Loading } from "~/components/common/Loading";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import type { FormType } from "~/lib/enum";
import { Separator } from "~/components/ui/separator";
import { LinkItem } from "./LinkItem";
import { ShareIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

type LinksManagerProps = {
	id: string;
	type: FormType;
};

export const LinksManager = ({ id, type }: LinksManagerProps) => {
	const t = useTranslations("LinksManager");
	const {
		openLinkMenu,
		setLinkMenu,
		onCreateLink,
		createLinkFormIsPending,
		canCreateLink,
		linksData,
		linksIsPending,
		linksError,
	} = useLinksManagerLogic({ id, type });

	return (
		<Popover
			open={openLinkMenu}
			onOpenChange={(open) => {
				setLinkMenu(open);
			}}
			modal={true}
		>
			<PopoverTrigger asChild>
				<Button
					size="sm"
					variant="outline"
					startIcon={<ShareIcon className="min-w-5 h-5" />}
					onClick={(e) => {
						e.stopPropagation();
					}}
				>
					{t("button.share")}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				onClick={(e) => {
					e.stopPropagation();
				}}
				className="max-h-(--radix-popover-content-available-height) overflow-auto"
			>
				<div className="flex gap-8 flex-col w-full">
					<div className="flex flex-col gap-4">
						{linksIsPending && <Loading />}
						{!linksIsPending && linksError && (
							<FeedbackMessage status="ERROR" message={linksError.message} />
						)}
						{!linksIsPending &&
							!linksError &&
							linksData &&
							linksData.links.length > 0 && (
								<div className="flex flex-col gap-2">
									{linksData.type === "BASIC" &&
										linksData.links.map((link) => (
											<LinkItem
												key={link.id}
												id={link.id}
												version={link.formVersion.version}
												createdAt={link.createdAt}
												classroomName={link.classroom.name}
												type="BASIC"
											/>
										))}
									{linksData.type === "EXAM" &&
										linksData.links.map((link) => (
											<LinkItem
												key={link.id}
												id={link.id}
												version={link.examVersion.version}
												createdAt={link.createdAt}
												classroomName={link.classroom.name}
												type="EXAM"
											/>
										))}
								</div>
							)}
						{!linksIsPending &&
							!linksError &&
							linksData &&
							linksData.links.length === 0 && (
								<FeedbackMessage
									status="INFORMATION"
									message={t("message.noLinks")}
								/>
							)}
					</div>
					<Separator />
					<div className="flex flex-col w-full h-full gap-2">
						<p className="text-xs text-muted-foreground">
							{t("message.linkAccess")}
						</p>
						<Button
							size="sm"
							variant="default"
							isPending={createLinkFormIsPending}
							disabled={!canCreateLink}
							onClick={onCreateLink}
						>
							{t("button.generateLink")}
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
};
