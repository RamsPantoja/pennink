"use client";

import {
	ArrowPathRoundedSquareIcon,
	BeakerIcon,
	EyeIcon,
	EyeSlashIcon,
	PencilIcon,
	ShareIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../common/Button";
import { DynamicForm } from "../DynamicForm";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import { useState } from "react";

export const FormEditor = () => {
	const [showAnswer, setShowAnswer] = useState<boolean>(false);
	const { formData, formId } = useWorkspaceStore();

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm();

	const onTestForm = () => {
		toast.success("Form submitted successfully!");
	};

	return (
		<div className="flex h-full flex-col overflow-hidden p-0">
			<div className="p-2 flex gap-2 justify-end">
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
				<Button startIcon={<ShareIcon className="min-w-5 h-5" />}>Share</Button>
			</div>
		</div>
	);
};
