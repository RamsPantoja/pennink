import { useLinksManagerLogic } from "./useLinksManagerLogic";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/common/Button";
import { Loading } from "~/components/common/Loading";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import InputFeedbackMessage from "~/components/common/InputFeedbackMessage";
import type { FormType } from "~/lib/enum";
import { Separator } from "~/components/ui/separator";
import { LinkItem } from "./LinkItem";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import {
	MagnifyingGlassIcon,
	ShareIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";

type LinksManagerProps = {
	id: string;
	type: FormType;
};

export const LinksManager = ({ id, type }: LinksManagerProps) => {
	const {
		openLinkMenu,
		setLinkMenu,
		onCreateLinkForm,
		createLinkFormIsPending,
		useFormLinkForm,
		linksData,
		linksIsPending,
		linksError,
		searchKey,
		setSearchKey,
		setSearchParam,
		performSearch,
	} = useLinksManagerLogic({ id, type });

	const { register, formState, handleSubmit } = useFormLinkForm;

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
					Share
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
						<div className="flex items-center relative gap-2">
							<Input
								type="text"
								placeholder="Search by keyword"
								value={searchKey}
								onChange={(e) => setSearchKey(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && performSearch()}
								className="pr-10"
							/>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										disabled={searchKey === ""}
										variant="ghost"
										size="icon"
										onClick={performSearch}
									>
										<MagnifyingGlassIcon className="min-w-5 h-5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Search</TooltipContent>
							</Tooltip>
							{searchKey && (
								<Button
									className="absolute right-11"
									variant="ghost"
									size="icon"
									onClick={() => {
										setSearchKey("");
										setSearchParam(undefined);
									}}
								>
									<XMarkIcon className="min-w-5 h-5" />
								</Button>
							)}
						</div>
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
												customKey={link.key}
												createdAt={link.createdAt}
												type="BASIC"
											/>
										))}

									{linksData.type === "EXAM" &&
										linksData.links.map((link) => (
											<LinkItem
												key={link.id}
												id={link.id}
												version={link.examVersion.version}
												customKey={link.key}
												createdAt={link.createdAt}
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
									message="Your links will appear here"
								/>
							)}
					</div>
					<Separator />
					<div className="flex flex-col w-full h-full gap-2">
						<Label htmlFor="key">Keyword*</Label>
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
						<p className="text-xs text-mocha-sub-text">
							Anyone on the web with the link can answer your form
						</p>
						<Button
							size="sm"
							variant="default"
							isPending={createLinkFormIsPending}
							onClick={handleSubmit(onCreateLinkForm)}
						>
							Generate link
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
};
