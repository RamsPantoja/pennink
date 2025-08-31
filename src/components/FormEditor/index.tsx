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
import { api } from "~/utils/api";
import { Badge } from "../ui/badge";
import { Loading } from "../common/Loading";
import FeedbackMessage from "../common/FeedbackMessage";

export const FormEditor = () => {
	const [showAnswer, setShowAnswer] = useState<boolean>(false);
	const { aiFormData, currentForm, setCurrentForm } = useWorkspaceStore();
	const {
		control,
		handleSubmit,
		formState: { errors },
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
				toast(error.message);
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
				toast(error.message);
			},
		});

	useEffect(() => {
		if (aiFormData) {
			if (!currentForm) {
				createForm({
					formData: aiFormData,
				});
			} else {
				if (aiFormData.type === currentForm.type) {
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

	const onTestForm = () => {
		toast.success("Form submitted successfully!");
	};

	if (!currentForm) {
		return <Loading />;
	}

	return (
		<div className="flex h-full flex-col overflow-hidden p-0 w-full">
			{isPending && <Loading />}
			{!isPending && isError && (
				<FeedbackMessage status="ERROR" message={"Something went wrong"} />
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
								{showAnswer ? "Hide answers" : "Show answers"}
							</Button>
						)}
					</div>
					{data && (
						<DynamicForm
							showAnswer={showAnswer}
							formData={data}
							control={control}
							errors={errors}
						/>
					)}
					<div className="flex gap-4 p-3 justify-end">
						<Button
							variant="outline"
							disabled={createFormIsPending || editFormIsPending}
							startIcon={<BeakerIcon className="min-w-5 h-5" />}
							onClick={handleSubmit(onTestForm)}
						>
							Test
						</Button>
						<Button
							isPending={createFormIsPending || editFormIsPending}
							startIcon={<ShareIcon className="min-w-5 h-5" />}
						>
							Share
						</Button>
					</div>
				</Fragment>
			)}
		</div>
	);
};
