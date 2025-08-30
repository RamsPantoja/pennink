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
import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import { Badge } from "../ui/badge";

export const FormEditor = () => {
	const [showAnswer, setShowAnswer] = useState<boolean>(false);
	const { formData, currentForm, setCurrentForm } = useWorkspaceStore();

	const { mutate: createForm, isPending } = api.form.create.useMutation({
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

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm();

	const onTestForm = () => {
		toast.success("Form submitted successfully!");
	};

	useEffect(() => {
		if (formData) {
			if (!currentForm) {
				createForm({
					formData,
				});
			} else {
				if (formData.type === currentForm.type) {
				} else {
					createForm({
						formData,
					});
				}
			}
		}
	}, [formData]);

	return (
		<div className="flex h-full flex-col overflow-hidden p-0">
			<div className="p-2 flex gap-4 justify-between">
				<div className="flex items-center">
					{formData?.type && <Badge variant="outline">{formData?.type}</Badge>}
				</div>
				{formData?.type === "EXAM" && (
					<Button
						variant="outline"
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
			{formData && (
				<DynamicForm
					showAnswer={showAnswer}
					data={formData}
					control={control}
					errors={errors}
				/>
			)}
			<div className="flex gap-4 p-3 justify-end">
				<Button
					variant="outline"
					startIcon={<BeakerIcon className="min-w-5 h-5" />}
					onClick={handleSubmit(onTestForm)}
				>
					Test
				</Button>
				<Button
					isPending={isPending}
					startIcon={<ShareIcon className="min-w-5 h-5" />}
				>
					Share
				</Button>
			</div>
		</div>
	);
};
