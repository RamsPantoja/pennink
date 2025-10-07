import {
	BeakerIcon,
	EyeIcon,
	EyeSlashIcon,
	ShareIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../common/Button";
import { DynamicForm } from "../DynamicForm";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import { useState, useEffect, Fragment } from "react";
import { api } from "~/trpc/react";
import { Badge } from "../ui/badge";
import { Loading } from "../common/Loading";
import FeedbackMessage from "../common/FeedbackMessage";
import { LinksManager } from "./LinksManager";
import { useTranslations } from "next-intl";

export const FormEditor = () => {
	const t = useTranslations("FormEditor");
	const [showAnswer, setShowAnswer] = useState<boolean>(false);
	const {
		aiFormData,
		currentForm,
		setCurrentForm,
		setQueryFormData,
		setAiContextItems,
		aiContextItems,
	} = useWorkspaceStore();

	const {
		control,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm();

	const { mutate: createForm, isPending: createFormIsPending } =
		api.form.create.useMutation({
			onSuccess: async (data) => {
				setCurrentForm({
					id: data.data.id,
					type: data.type,
				});
			},
			onError: (error) => {
				toast(t("toast.error"));
			},
		});

	const { mutate: editForm, isPending: editFormIsPending } =
		api.form.edit.useMutation({
			onSuccess: async (data) => {
				switch (data.type) {
					case "BASIC":
						setCurrentForm({
							id: data.data.formId,
							type: data.type,
						});
						break;
					case "EXAM":
						setCurrentForm({
							id: data.data.examId,
							type: data.type,
						});
						break;
					default:
						break;
				}

				refetch();
			},
			onError: (error) => {
				toast(t("toast.error"));
			},
		});

	useEffect(() => {
		if (aiFormData) {
			if (!currentForm) {
				createForm({
					formData: aiFormData,
				});
			} else {
				if (aiFormData.isEdited) {
					editForm({
						formData: aiFormData,
						id: currentForm.id,
					});
				} else {
					createForm({
						formData: aiFormData,
					});
				}
			}
		}
	}, [aiFormData]);

	const { data, isPending, isError, refetch } = api.form.getData.useQuery(
		{
			id: currentForm?.id ?? "",
			type: currentForm?.type ?? "BASIC",
		},
		{
			enabled: Boolean(currentForm),
		},
	);

	useEffect(() => {
		if (data) {
			reset();
			setQueryFormData(data);

			const hasFormContextItem = aiContextItems.some(
				(item) => item.type === "form",
			);

			if (!hasFormContextItem) {
				setAiContextItems([
					...aiContextItems,
					{
						label: t("context.formLabel"),
						type: "form",
					},
				]);
			}
		}
	}, [data]);

	const onTestForm = () => {
		toast.success(t("toast.submitSuccess"), { position: "bottom-left" });
	};

	if (!currentForm) {
		return <Loading />;
	}

	return (
		<div
			key={currentForm.id}
			className="flex h-full flex-col overflow-hidden w-full"
		>
			{isPending && <Loading />}
			{!isPending && isError && (
				<FeedbackMessage status="ERROR" message={t("error.loadError")} />
			)}
			{!isPending && !isError && data && (
				<Fragment>
					<div className="p-2 flex gap-4 justify-between">
						<div className="flex items-center">
							{data.type && <Badge variant="outline">{data.type}</Badge>}
						</div>
						{data.type === "EXAM" && (
							<Button
								variant="outline"
								disabled={createFormIsPending || editFormIsPending}
								startIcon={
									showAnswer ? (
										<EyeSlashIcon className="min-w-5 h-5" />
									) : (
										<EyeIcon className="min-w-5 h-5" />
									)
								}
								onClick={() => setShowAnswer(!showAnswer)}
							>
								{showAnswer ? t("button.hideAnswers") : t("button.showAnswers")}
							</Button>
						)}
					</div>
					{data && (
						<div className="flex h-full w-full overflow-auto p-4">
							<DynamicForm
								showAnswer={showAnswer}
								formData={data}
								control={control}
								errors={errors}
							/>
						</div>
					)}
					<div className="flex gap-4 p-3 justify-end">
						<Button
							variant="outline"
							disabled={createFormIsPending || editFormIsPending}
							startIcon={<BeakerIcon className="min-w-5 h-5" />}
							onClick={handleSubmit(onTestForm)}
						>
							{t("button.test")}
						</Button>
						{!createFormIsPending && !editFormIsPending && currentForm && (
							<LinksManager id={currentForm.id} type={currentForm.type} />
						)}
					</div>
				</Fragment>
			)}
		</div>
	);
};
