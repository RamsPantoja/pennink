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
import type { FormType } from "~/lib/enum";
import { FormCard } from "./FormCard";

type FormLoaderProps = {
	onSelect: (doc: PenninkDocument) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export const FormLoader = ({
	onSelect,
	open,
	onOpenChange,
}: FormLoaderProps) => {
	const [documentName, setDocumentName] = useState<string>("");
	const [searchParam, setSearchParam] = useState<string | undefined>();
	const [type, setType] = useState<FormType>("BASIC");

	const {
		data: forms,
		isLoading: formsIsLoading,
		isError: formsIsError,
	} = api.form.forms.useQuery({ search: searchParam, type });

	const performSearch = () => {
		if (documentName) {
			setSearchParam(documentName);
		} else {
			setSearchParam(undefined);
		}
	};

	console.log(forms);

	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="left-0 md:left-1/2 bg-mocha-base border-mocha-mantle right-2 top-2 bottom-2 overflow-hidden fixed border z-50 rounded-xl outline-hidden mt-0">
				<div className="h-full w-full grow p-4 flex flex-col">
					<DrawerHeader>
						<DrawerTitle className="text-sm font-semibold">
							Your forms and exams
						</DrawerTitle>
						<DrawerDescription>
							Select an item to see and edit it
						</DrawerDescription>
						<div className="flex items-center gap-2">
							<Input
								type="text"
								placeholder="Search by title"
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
						{formsIsLoading && <Loading />}
						{!formsIsLoading && formsIsError && (
							<FeedbackMessage
								status="ERROR"
								message="Failed to load documents"
							/>
						)}
						{!formsIsLoading &&
							!formsIsError &&
							forms &&
							forms.data.length === 0 && (
								<div className="flex items-center justify-center text-mocha-text">
									Your documents will appear here.
								</div>
							)}

						{!formsIsLoading &&
							!formsIsError &&
							forms &&
							forms.data.length > 0 && (
								<div className="grid gap-2">
									{forms.data.map((doc) => (
										<FormCard
											key={doc.id}
											title={doc.title}
											type={forms.type}
											date={DateTime.fromJSDate(doc.createdAt).toLocaleString(
												DateTime.DATETIME_MED,
											)}
											onSelect={onSelect}
											id={doc.id}
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
