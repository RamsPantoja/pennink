import { Button } from "../common/Button";
import { api } from "~/trpc/react";
import { Loading } from "../common/Loading";
import FeedbackMessage from "../common/FeedbackMessage";
import { DateTime } from "luxon";
import type { PenninkDocument } from "./useWorkspaceStore";
import { Input } from "../ui/input";
import { Fragment, useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "../ui/sheet";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

type DocumentLoaderProps = {
	onSelect: (doc: PenninkDocument) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const PDFDocumentCard = dynamic(() => import("./PDFDocumentCard"), {
	ssr: false,
	loading: () => <Loading />,
});

export const DocumentLoader = ({
	onSelect,
	open,
	onOpenChange,
}: DocumentLoaderProps) => {
	const t = useTranslations("DocumentLoader");
	const [documentName, setDocumentName] = useState<string>("");
	const [searchParam, setSearchParam] = useState<string | undefined>();

	const {
		data: filesByUser,
		isLoading: filesByUserLoading,
		isError: filesByUserError,
	} = api.workspace.filesByUserId.useQuery({ search: searchParam });

	const performSearch = () => {
		if (documentName) {
			setSearchParam(documentName);
		} else {
			setSearchParam(undefined);
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="overflow-hidden max-w-3xl">
				<div className="h-full w-full grow p-4 flex flex-col gap-4">
					<SheetHeader className="p-0">
						<SheetTitle className="text-sm font-semibold">
							{t("sheetTitle")}
						</SheetTitle>
						<SheetDescription>{t("sheetDescription")}</SheetDescription>
						<div className="flex items-center gap-2">
							<Input
								type="text"
								placeholder={t("input.placeholder")}
								value={documentName}
								onChange={(e) => setDocumentName(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && performSearch()}
								className="pr-10"
							/>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										disabled={documentName === ""}
										variant="ghost"
										size="icon"
										onClick={performSearch}
									>
										<MagnifyingGlassIcon className="min-w-5 h-5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>{t("tooltip.search")}</TooltipContent>
							</Tooltip>
							{documentName && (
								<Button
									className="absolute right-20"
									variant="ghost"
									size="icon"
									onClick={() => {
										setDocumentName("");
										setSearchParam(undefined);
									}}
								>
									<XMarkIcon className="min-w-5 h-5" />
								</Button>
							)}
						</div>
					</SheetHeader>
					<div className="flex gap-2 h-fit overflow-auto w-full">
						{filesByUserLoading && <Loading />}
						{!filesByUserLoading && filesByUserError && (
							<FeedbackMessage
								status="ERROR"
								message={t("error.loadDocuments")}
							/>
						)}
						{!filesByUserLoading &&
							!filesByUserError &&
							filesByUser &&
							filesByUser.length === 0 && (
								<div className="flex items-center justify-center text-mocha-text">
									{t("emptyState.documents")}
								</div>
							)}
						{!filesByUserLoading &&
							!filesByUserError &&
							filesByUser &&
							filesByUser.length > 0 && (
								<div className="grid gap-4 grid-cols-4 w-full">
									{filesByUser.map((doc) => {
										return (
											<Fragment key={doc.id}>
												{doc.type === "application/pdf" && (
													<PDFDocumentCard
														key={doc.id}
														title={doc.filename}
														type={doc.type}
														date={DateTime.fromJSDate(
															doc.createdAt,
														).toLocaleString(DateTime.DATETIME_MED)}
														onSelect={onSelect}
														id={doc.id}
														storageKey={doc.key}
													/>
												)}
											</Fragment>
										);
									})}
								</div>
							)}
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
};
