"use client";

import {
	ArrowPathRoundedSquareIcon,
	BeakerIcon,
	PencilIcon,
	ShareIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../common/Button";
import { DynamicForm, type Question } from "../DynamicForm";
import { Card } from "../ui/card";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import z from "zod";
import { aiFormSchema } from "~/lib/schemas/aiForm";

export const FormEditor = () => {
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm();

	const { object, submit, isLoading, stop } = useObject({
		api: "/api/ai/form",
		schema: aiFormSchema,
	});

	const onTestForm = () => {
		toast.success("Form submitted successfully!");
	};

	return (
		<div className="flex h-full flex-col overflow-hidden p-0">
			<div className="p-4 flex gap-2 justify-end">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button size="icon" variant="outline">
							<PencilIcon className="min-w-5 h-5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Edit form</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							onClick={() => {
								submit({
									prompt: "I want my form about cats of 10 questions",
									context: "cats",
								});
							}}
							size="icon"
							variant="outline"
						>
							<ArrowPathRoundedSquareIcon className="min-w-5 h-5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Regenerate form</TooltipContent>
				</Tooltip>
			</div>
			{object && (
				<DynamicForm
					title={object.title}
					questions={object.questions || []}
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
