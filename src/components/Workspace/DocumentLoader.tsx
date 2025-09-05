import { Button } from "../common/Button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
	DrawerHandle,
} from "../ui/drawer";
import { api } from "~/utils/api";
import { DocumentCard } from "./DocumentCard";
import { Loading } from "../common/Loading";
import FeedbackMessage from "../common/FeedbackMessage";
import { DateTime } from "luxon";
import type { PenninkDocument } from "./useWorkspaceStore";
import { Input } from "../ui/input";
import { useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type DocumentLoaderProps = {
	onSelect: (doc: PenninkDocument) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export const DocumentLoader = ({
	onSelect,
	open,
	onOpenChange,
}: DocumentLoaderProps) => {
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
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="left-0 md:left-1/2 bg-mocha-base border-mocha-mantle right-2 top-2 bottom-2 overflow-hidden fixed border z-50 rounded-xl outline-hidden mt-0">
				<div className="h-full w-full grow p-4 flex flex-col">
					<DrawerHeader>
						<DrawerTitle className="text-sm font-semibold">
							Your sources
						</DrawerTitle>
						<DrawerDescription>
							Select a document to read from all saved documents
						</DrawerDescription>
						<div className="flex items-center gap-2">
							<Input
								type="text"
								placeholder="Search for document"
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
								<TooltipContent>Search</TooltipContent>
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
					</DrawerHeader>
					<div className="grid gap-2 h-fit overflow-auto">
						{filesByUserLoading && <Loading />}
						{!filesByUserLoading && filesByUserError && (
							<FeedbackMessage
								status="ERROR"
								message="Failed to load documents"
							/>
						)}
						{!filesByUserLoading &&
							!filesByUserError &&
							filesByUser &&
							filesByUser.length === 0 && (
								<div className="flex items-center justify-center text-mocha-text">
									Your documents will appear here.
								</div>
							)}

						{!filesByUserLoading &&
							!filesByUserError &&
							filesByUser &&
							filesByUser.length > 0 && (
								<div className="grid gap-2">
									{filesByUser.map((doc) => (
										<DocumentCard
											key={doc.id}
											title={doc.filename}
											type={doc.type}
											date={DateTime.fromJSDate(doc.createdAt).toLocaleString(
												DateTime.DATETIME_MED,
											)}
											onSelect={onSelect}
											id={doc.id}
											storageKey={doc.key}
										/>
									))}
								</div>
							)}
					</div>
					<DrawerFooter>
						<DrawerClose asChild>
							<Button variant="outline">Close</Button>
						</DrawerClose>
					</DrawerFooter>
				</div>
			</DrawerContent>
		</Drawer>
	);
};
