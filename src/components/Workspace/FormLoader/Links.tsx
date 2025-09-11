import { Card } from "~/components/ui/card";
import type { FormType } from "~/lib/enum";
import { Input } from "~/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { Button } from "~/components/common/Button";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Loading } from "~/components/common/Loading";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { LinkItem } from "./LinkItem";
import { useLinksLogic } from "./useLinksLogic";

type LinksProps = {
	id: string;
	type: FormType;
};

export const Links = ({ id, type }: LinksProps) => {
	const {
		linksData,
		linksIsPending,
		linksError,
		searchKey,
		setSearchKey,
		setSearchParam,
		performSearch,
	} = useLinksLogic({ id, type });

	return (
		<Card className="flex h-full w-full">
			<div className="flex flex-col gap-4 w-full">
				<div className="flex items-center relative gap-2 w-full">
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
						<div className="grid grid-cols-2 gap-4 w-full overflow-auto">
							{linksData.type === "BASIC" &&
								linksData.links.map((link) => (
									<LinkItem
										key={link.id}
										id={link.id}
										version={link.formVersion.version}
										customKey={link.key}
										createdAt={link.createdAt}
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
		</Card>
	);
};
