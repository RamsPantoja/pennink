import { Fragment } from "react";
import {
	Controller,
	type FieldErrors,
	type Control,
	type FieldValues,
} from "react-hook-form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import type { AiForm } from "~/lib/schemas/aiForm";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { CheckIcon } from "@heroicons/react/24/outline";

interface DynamicFormProps {
	data: AiForm;
	control: Control<FieldValues, any, FieldValues>;
	errors: FieldErrors<FieldValues>;
	showAnswer: boolean;
}

export function DynamicForm({
	data,
	control,
	errors,
	showAnswer,
}: DynamicFormProps) {
	const { questions, title, description, type } = data;

	const renderField = (question: AiForm["questions"][number]) => {
		const fieldId = question.key;
		const isRequired = question.required;

		switch (question.type) {
			case "text":
			case "number":
				return (
					<Controller
						name={fieldId}
						control={control}
						rules={{
							required: isRequired ? `${question.label} is required` : false,
						}}
						render={({ field }) => (
							<div className="flex flex-col gap-2 border p-3 border-mochaMantle rounded-2xl">
								<Label htmlFor={fieldId}>
									<span className="text-mochaSubText text-base font-black">
										{fieldId}.{" "}
									</span>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<Input
									{...field}
									id={fieldId}
									type={question.type}
									placeholder={question.placeholder}
									min={question.min}
									max={question.max}
									className="focus:ring-mochaSubText"
								/>
								{question.description && (
									<p className="text-sm text-muted-foreground">
										{question.description}
									</p>
								)}
								{errors[fieldId] && (
									<p className="text-sm text-red-500">
										{errors[fieldId]?.message as string}
									</p>
								)}
								{question.answer && showAnswer && (
									<div className="border py-2 px-3 border-mochaMantle bg-mochaCrust flex items-center gap-2 rounded-md w-fit">
										<CheckIcon className="h-5 min-w-5 text-green-500" />
										<p className="text-sm text-mochaSubText">
											{question.answer}
										</p>
									</div>
								)}
							</div>
						)}
					/>
				);

			case "email":
				return (
					<Controller
						name={fieldId}
						control={control}
						rules={{
							required: isRequired ? `${question.label} is required` : false,
							validate: (value) => {
								const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
								return emailRegex.test(value) || "Invalid email address";
							},
						}}
						render={({ field }) => (
							<div className="flex flex-col gap-2 border p-3 border-mochaMantle rounded-2xl">
								<Label htmlFor={fieldId}>
									<span className="text-mochaSubText text-base font-black">
										{fieldId}.{" "}
									</span>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<Input
									{...field}
									id={fieldId}
									type="email"
									placeholder={question.placeholder}
									min={question.min}
									max={question.max}
									className="focus:ring-mochaSubText"
								/>
								{question.description && (
									<p className="text-sm text-muted-foreground">
										{question.description}
									</p>
								)}
								{errors[fieldId] && (
									<p className="text-sm text-red-500">
										{errors[fieldId]?.message as string}
									</p>
								)}
							</div>
						)}
					/>
				);

			case "date":
				return (
					<Controller
						name={fieldId}
						control={control}
						rules={{
							required: isRequired ? `${question.label} is required` : false,
						}}
						render={({ field }) => (
							<div className="flex flex-col gap-2 border p-3 border-mochaMantle rounded-2xl">
								<Label htmlFor={fieldId}>
									<span className="text-mochaSubText text-base font-black">
										{fieldId}.{" "}
									</span>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<Input
									{...field}
									id={fieldId}
									type="date"
									className="focus:ring-mochaSubText w-fit"
								/>
								{question.description && (
									<p className="text-sm text-muted-foreground">
										{question.description}
									</p>
								)}
								{errors[fieldId] && (
									<p className="text-sm text-red-500">
										{errors[fieldId]?.message as string}
									</p>
								)}
								{question.answer && showAnswer && (
									<div className="border bg-mochaCrust p-2 rounded-md border-mochaMantle flex w-fit items-center gap-2">
										<CheckIcon className="h-5 min-w-5 text-green-500" />
										<p className="text-sm text-mochaSubText">
											{question.answer}
										</p>
									</div>
								)}
							</div>
						)}
					/>
				);

			case "textarea":
				return (
					<Controller
						name={fieldId}
						control={control}
						rules={{
							required: isRequired ? `${question.label} is required` : false,
						}}
						render={({ field }) => (
							<div className="flex flex-col gap-2 border p-3 border-mochaMantle rounded-2xl">
								<Label htmlFor={fieldId}>
									<span className="text-mochaSubText text-base font-black">
										{fieldId}.{" "}
									</span>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<Textarea
									{...field}
									id={fieldId}
									placeholder={question.placeholder}
									rows={4}
									className="focus:ring-mochaSubText"
								/>
								{question.description && (
									<p className="text-sm text-muted-foreground">
										{question.description}
									</p>
								)}
								{errors[fieldId] && (
									<p className="text-sm text-red-500">
										{errors[fieldId]?.message as string}
									</p>
								)}
								{question.answer && showAnswer && (
									<div className="border bg-mochaCrust p-2 rounded-md border-mochaMantle flex w-fit items-center gap-2">
										<CheckIcon className="h-5 min-w-5 text-green-500" />
										<p className="text-sm text-mochaSubText">
											{question.answer}
										</p>
									</div>
								)}
							</div>
						)}
					/>
				);

			case "select":
				return (
					<Controller
						name={fieldId}
						control={control}
						rules={{
							required: isRequired ? `${question.label} is required` : false,
						}}
						render={({ field }) => (
							<div className="flex flex-col gap-2 border p-3 border-mochaMantle rounded-2xl">
								<Label htmlFor={fieldId}>
									<span className="text-mochaSubText text-base font-black">
										{fieldId}.{" "}
									</span>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<Select onValueChange={field.onChange} value={field.value}>
									<SelectTrigger className="focus:ring-mochaSubText">
										<SelectValue placeholder={"Select option"} />
									</SelectTrigger>
									<SelectContent>
										{question.options?.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{question.description && (
									<p className="text-sm text-muted-foreground">
										{question.description}
									</p>
								)}
								{errors[fieldId] && (
									<p className="text-sm text-red-500">
										{errors[fieldId]?.message as string}
									</p>
								)}
								{question.answer && showAnswer && (
									<div className="border p-2 rounded-md border-mochaMantle w-fit flex items-center gap-2 bg-mochaCrust">
										<CheckIcon className="h-5 min-w-5 text-green-500" />
										<p className="text-sm text-mochaSubText">
											{question.options?.find(
												(option) => option.value === question.answer,
											)?.label || ""}
										</p>
									</div>
								)}
							</div>
						)}
					/>
				);

			case "radio":
				return (
					<Controller
						name={fieldId}
						control={control}
						rules={{
							required: isRequired ? `${question.label} is required` : false,
						}}
						render={({ field }) => (
							<div className="flex flex-col gap-3 border p-3 border-mochaMantle rounded-2xl">
								<Label htmlFor={fieldId}>
									<span className="text-mochaSubText text-base font-black">
										{fieldId}.{" "}
									</span>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<RadioGroup onValueChange={field.onChange} value={field.value}>
									{question.options?.map((option) => (
										<div
											key={option.value}
											className="flex items-center space-x-2"
										>
											<RadioGroupItem
												value={option.value}
												id={`${fieldId}-${option.value}`}
											/>
											<Label htmlFor={`${fieldId}-${option.value}`}>
												{option.label}
											</Label>
										</div>
									))}
								</RadioGroup>
								{question.description && (
									<p className="text-sm text-muted-foreground">
										{question.description}
									</p>
								)}
								{errors[fieldId] && (
									<p className="text-sm text-red-500">
										{errors[fieldId]?.message as string}
									</p>
								)}
								{question.answer && showAnswer && (
									<div className="border p-2 rounded-md border-mochaMantle w-fit flex items-center gap-2 bg-mochaCrust">
										<CheckIcon className="h-5 min-w-5 text-green-500" />
										<p className="text-sm text-mochaSubText">
											{question.options?.find(
												(option) => option.value === question.answer,
											)?.label || ""}
										</p>
									</div>
								)}
							</div>
						)}
					/>
				);

			case "checkbox":
				return (
					<Controller
						name={fieldId}
						control={control}
						defaultValue={[]}
						rules={{
							required: isRequired ? `${question.label} is required` : false,
						}}
						render={({ field }) => (
							<div className="flex flex-col gap-3 border p-3 border-mochaMantle rounded-2xl">
								<Label htmlFor={fieldId}>
									<span className="text-mochaSubText text-base font-black">
										{fieldId}.{" "}
									</span>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<div className="flex flex-col gap-2">
									{question.options?.map((option) => (
										<div
											key={option.value}
											className="flex items-center space-x-2"
										>
											<Checkbox
												id={`${fieldId}-${option.value}`}
												checked={field.value?.includes(option.value)}
												onCheckedChange={(checked) => {
													const currentValue = field.value || [];
													if (checked) {
														field.onChange([...currentValue, option.value]);
													} else {
														field.onChange(
															currentValue.filter(
																(v: string) => v !== option.value,
															),
														);
													}
												}}
											/>
											<Label htmlFor={`${fieldId}-${option.value}`}>
												{option.label}
											</Label>
										</div>
									))}
								</div>
								{question.description && (
									<p className="text-sm text-muted-foreground">
										{question.description}
									</p>
								)}
								{errors[fieldId] && (
									<p className="text-sm text-red-500">
										{errors[fieldId]?.message as string}
									</p>
								)}
								{question.answer && showAnswer && (
									<div className="border p-2 rounded-md border-mochaMantle w-fit flex items-center gap-2 bg-mochaCrust">
										<CheckIcon className="h-5 min-w-5 text-green-500" />
										<p className="text-sm text-mochaSubText">
											{Array.isArray(question.answer) &&
												question.answer
													.map((item) => {
														const option = question.options?.find(
															(opt) => opt.value === item,
														);
														return option ? option.label : item;
													})
													.join(", ")}
										</p>
									</div>
								)}
							</div>
						)}
					/>
				);

			case "switch":
				return (
					<Controller
						name={fieldId}
						control={control}
						defaultValue={false}
						render={({ field }) => (
							<div className="flex flex-col gap-2 border p-3 border-mochaMantle rounded-2xl">
								<div className="flex items-center space-x-2">
									<Switch
										id={fieldId}
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
									<Label htmlFor={fieldId}>
										<span className="text-mochaSubText text-base font-black">
											{fieldId}.{" "}
										</span>
										{question.label}
										{isRequired && <span className="text-red-500 ml-1">*</span>}
									</Label>
								</div>
								{question.description && (
									<p className="text-sm text-muted-foreground">
										{question.description}
									</p>
								)}
								{typeof question.answer === "boolean" && showAnswer && (
									<div className="border p-2 rounded-md border-mochaMantle w-fit flex items-center gap-2 bg-mochaCrust">
										<CheckIcon className="h-5 min-w-5 text-green-500" />
										<p className="text-sm text-mochaSubText">
											{question.answer ? "True" : "False"}
										</p>
									</div>
								)}
							</div>
						)}
					/>
				);

			case "slider":
				return (
					<Controller
						name={fieldId}
						control={control}
						defaultValue={[question.min || 0]}
						render={({ field }) => (
							<div className="flex flex-col gap-4 border p-3 border-mochaMantle rounded-2xl">
								<Label htmlFor={fieldId}>
									<span className="text-mochaSubText text-base font-black">
										{fieldId}.{" "}
									</span>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<div className="px-2">
									<Slider
										value={field.value}
										onValueChange={field.onChange}
										min={question.min || 0}
										max={question.max || 100}
										step={question.step || 1}
										className="w-full"
									/>
									<div className="flex justify-between text-sm text-muted-foreground mt-1">
										<span>{question.min || 0}</span>
										<span className="font-medium">
											Value: {field.value?.[0] || question.min || 0}
										</span>
										<span>{question.max || 100}</span>
									</div>
								</div>
								{question.description && (
									<p className="text-sm text-muted-foreground">
										{question.description}
									</p>
								)}
								{question.answer && showAnswer && (
									<div className="border p-2 rounded-md border-mochaMantle w-fit flex items-center gap-2 bg-mochaCrust">
										<CheckIcon className="h-5 min-w-5 text-green-500" />
										<p className="text-sm text-mochaSubText">
											{question.answer}
										</p>
									</div>
								)}
							</div>
						)}
					/>
				);

			default:
				break;
		}
	};

	return (
		<div className="flex flex-col gap-4 overflow-auto px-8 py-4 h-full">
			<div className="flex flex-col gap-3 mb-4">
				<div className="flex items-center gap-4 justify-between">
					<p className="text-mochaText font-semibold text-xl tracking-widest">
						{title}
					</p>
					<Badge variant="outline">{type}</Badge>
				</div>
				{description && (
					<p className="text-sm text-mochaSubText">{description}</p>
				)}
			</div>
			<Separator />
			<div className="flex flex-col gap-6">
				{questions.map((question) => (
					<Fragment key={question.key}>{renderField(question)}</Fragment>
				))}
			</div>
		</div>
	);
}
