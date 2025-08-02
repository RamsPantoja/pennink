import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Button } from "../common/Button";

// Define the question types
export interface QuestionOption {
	value: string;
	label: string;
}

export interface Question {
	id: string;
	type:
		| "text"
		| "textarea"
		| "checkbox"
		| "radio"
		| "select"
		| "switch"
		| "slider"
		| "email"
		| "number"
		| "date";
	label: string;
	placeholder?: string;
	required?: boolean;
	options?: QuestionOption[];
	min?: number;
	max?: number;
	step?: number;
	description?: string;
}

interface DynamicFormProps {
	questions: Question[];
	onSubmit: (data: any) => void;
	title?: string;
	description?: string;
}

export function DynamicForm({
	questions,
	onSubmit,
	title = "Dynamic Form",
	description,
}: DynamicFormProps) {
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm();

	const renderField = (question: Question) => {
		const fieldId = question.id;
		const isRequired = question.required;

		switch (question.type) {
			case "text":
			case "email":
			case "number":
				return (
					<Controller
						name={fieldId}
						control={control}
						rules={{
							required: isRequired ? `${question.label} is required` : false,
						}}
						render={({ field }) => (
							<div className="space-y-2">
								<Label htmlFor={fieldId}>
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
							<div className="space-y-2">
								<Label htmlFor={fieldId}>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<Input {...field} id={fieldId} type="date" />
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

			case "textarea":
				return (
					<Controller
						name={fieldId}
						control={control}
						rules={{
							required: isRequired ? `${question.label} is required` : false,
						}}
						render={({ field }) => (
							<div className="space-y-2">
								<Label htmlFor={fieldId}>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<Textarea
									{...field}
									id={fieldId}
									placeholder={question.placeholder}
									rows={4}
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

			case "select":
				return (
					<Controller
						name={fieldId}
						control={control}
						rules={{
							required: isRequired ? `${question.label} is required` : false,
						}}
						render={({ field }) => (
							<div className="space-y-2">
								<Label htmlFor={fieldId}>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<Select onValueChange={field.onChange} value={field.value}>
									<SelectTrigger>
										<SelectValue
											placeholder={`Select ${question.label.toLowerCase()}`}
										/>
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
							<div className="space-y-2">
								<Label>
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
						render={({ field }) => (
							<div className="space-y-2">
								<Label>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<div className="space-y-2">
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
							<div className="space-y-2">
								<div className="flex items-center space-x-2">
									<Switch
										id={fieldId}
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
									<Label htmlFor={fieldId}>
										{question.label}
										{isRequired && <span className="text-red-500 ml-1">*</span>}
									</Label>
								</div>
								{question.description && (
									<p className="text-sm text-muted-foreground">
										{question.description}
									</p>
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
							<div className="space-y-2">
								<Label htmlFor={fieldId}>
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
							</div>
						)}
					/>
				);

			default:
				return null;
		}
	};

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					{questions.map((question) => (
						<div key={question.id}>{renderField(question)}</div>
					))}
					<Button type="submit" className="w-full">
						Submit Form
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
