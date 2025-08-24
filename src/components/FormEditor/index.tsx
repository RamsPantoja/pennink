"use client";

import {
	ArrowPathRoundedSquareIcon,
	BeakerIcon,
	PencilIcon,
	ShareIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../common/Button";
import { DynamicForm } from "../DynamicForm";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";

export const FormEditor = () => {
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm();

	const { formData } = useWorkspaceStore();

	const onTestForm = () => {
		toast.success("Form submitted successfully!");
	};

	return (
		<div className="flex h-full flex-col overflow-hidden p-0">
			<div className="p-2 flex gap-2 justify-end">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button size="icon" variant="outline">
							<PencilIcon className="min-w-5 h-5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Edit form</TooltipContent>
				</Tooltip>
			</div>
			{formData && (
				<DynamicForm data={formData} control={control} errors={errors} />
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
