import { Button } from "../../common/Button";
import { api } from "~/utils/api";
import { Loading } from "../../common/Loading";
import FeedbackMessage from "../../common/FeedbackMessage";
import { DateTime } from "luxon";
import type { CurrentForm } from "../useWorkspaceStore";
import { Input } from "../../ui/input";
import { useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import type { FormType } from "~/lib/enum";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { Label } from "../../ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "../../ui/sheet";
import { Card } from "../../ui/card";
import { FormCard } from "./FormCard";
import { Links } from "./Links";

type FormLoaderProps = {
	onOpen: (doc: CurrentForm) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type CurrentFormForLinks = {
	id: string;
	type: FormType;
};

export const FormLoader = ({ onOpen, open, onOpenChange }: FormLoaderProps) => {
	const [searchKey, setSearchKey] = useState<string>("");
	const [searchParam, setSearchParam] = useState<string | undefined>();
	const [type, setType] = useState<FormType>("BASIC");
	const [currentFormForLinks, setCurrentFormForLinks] =
		useState<CurrentFormForLinks | null>(null);

	const {
		data: forms,
		isLoading: formsIsLoading,
		isError: formsIsError,
	} = api.form.forms.useQuery({ search: searchParam, type });

	const performSearch = () => {
		if (searchKey) {
			setSearchParam(searchKey);
		} else {
			setSearchParam(undefined);
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full flex flex-col max-w-7xl">
				<SheetHeader>
					<SheetTitle className="text-sm font-semibold">
						Your forms and exams
					</SheetTitle>
					<SheetDescription>
						Manage your forms and exams, links, and responses
					</SheetDescription>
				</SheetHeader>
				<div className="h-full w-full grow flex gap-4 overflow-hidden">
					<Card className="flex flex-col gap-4 border h-full">
						<div className="flex items-center gap-4">
							<div className="flex items-center relative gap-2">
								<Input
									type="text"
									placeholder="Search by title"
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
										className="absolute right-12"
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
							<RadioGroup
								onValueChange={(value) => {
									setType(value as FormType);
								}}
								defaultValue="BASIC"
							>
								<div className="flex items-center gap-3">
									<RadioGroupItem value="BASIC" id="r1" />
									<Label className="text-mocha-text" htmlFor="r1">
										Basic
									</Label>
								</div>
								<div className="flex items-center gap-3">
									<RadioGroupItem value="EXAM" id="r2" />
									<Label className="text-mocha-text" htmlFor="r2">
										Exam
									</Label>
								</div>
							</RadioGroup>
						</div>
						<div className="grid gap-2 h-fit overflow-auto">
							{formsIsLoading && <Loading />}
							{!formsIsLoading && formsIsError && (
								<FeedbackMessage
									status="ERROR"
									message="Failed to load forms"
								/>
							)}
							{!formsIsLoading &&
								!formsIsError &&
								forms &&
								forms.data.length === 0 && (
									<div className="flex items-center justify-center text-mocha-text">
										Your forms will appear here.
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
												onOpen={onOpen}
												onResults={() => {
													setCurrentFormForLinks({
														id: doc.id,
														type: forms.type,
													});
												}}
												id={doc.id}
											/>
										))}
									</div>
								)}
						</div>
					</Card>
					{!currentFormForLinks && (
						<FeedbackMessage
							status="INFORMATION"
							message="Click the Links button from the form card to view links"
						/>
					)}
					{currentFormForLinks && (
						<Links
							id={currentFormForLinks.id}
							type={currentFormForLinks.type}
						/>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
};
