import { Button } from "../../common/Button";
import { api } from "~/trpc/react";
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
import { Manager } from "./Manager";
import { useFormLoaderStore } from "./useFormLoaderStore";
import { useTranslations } from "next-intl";

type FormLoaderProps = {
	onOpen: (doc: CurrentForm) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export const FormLoader = ({ onOpen, open, onOpenChange }: FormLoaderProps) => {
	const t = useTranslations("FormLoader");
	const [searchKey, setSearchKey] = useState<string>("");
	const [searchParam, setSearchParam] = useState<string | undefined>();
	const [type, setType] = useState<FormType>("BASIC");
	const {
		setCurrentForm,
		currentForm,
		setBreadcrumbs,
		setCurrentLink,
		setResultId,
	} = useFormLoaderStore();

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
						{t("sheetTitle")}
					</SheetTitle>
					<SheetDescription>{t("sheetDescription")}</SheetDescription>
				</SheetHeader>
				<div className="h-full w-full grow flex gap-4 overflow-hidden">
					<Card className="flex flex-col gap-4 border h-full min-w-96 max-w-96 p-0">
						<div className="flex items-center gap-4 p-4">
							<div className="flex items-center relative gap-2">
								<Input
									type="text"
									placeholder={t("input.placeholder")}
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
									<TooltipContent>{t("tooltip.search")}</TooltipContent>
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
									<Label className="text-foreground" htmlFor="r1">
										{t("formType.basic")}
									</Label>
								</div>
								<div className="flex items-center gap-3">
									<RadioGroupItem value="EXAM" id="r2" />
									<Label className="text-foreground" htmlFor="r2">
										{t("formType.exam")}
									</Label>
								</div>
							</RadioGroup>
						</div>
						<div className="flex flex-col h-fit overflow-auto w-full px-4 pb-4">
							{formsIsLoading && <Loading />}
							{!formsIsLoading && formsIsError && (
								<FeedbackMessage
									status="ERROR"
									message={t("error.loadForms")}
								/>
							)}
							{!formsIsLoading &&
								!formsIsError &&
								forms &&
								forms.data.length === 0 && (
									<div className="flex items-center justify-center text-foreground">
										{t("emptyState.forms")}
									</div>
								)}
							{!formsIsLoading &&
								!formsIsError &&
								forms &&
								forms.data.length > 0 && (
									<div className="flex flex-col gap-3">
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
													setCurrentForm({
														id: doc.id,
														type: forms.type,
													});
													setBreadcrumbs({ links: t("breadcrumbs.links") });
													setCurrentLink(null);
													setResultId(null);
												}}
												id={doc.id}
												selectedFormId={currentForm?.id}
											/>
										))}
									</div>
								)}
						</div>
					</Card>
					{!currentForm && (
						<FeedbackMessage
							status="INFORMATION"
							message={t("message.selectForm")}
						/>
					)}
					{currentForm && <Manager />}
				</div>
			</SheetContent>
		</Sheet>
	);
};
