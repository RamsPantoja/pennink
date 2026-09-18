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
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { CheckIcon } from "@heroicons/react/24/outline";
import type { RouterOutputs } from "~/utils/api";
import type { Questions } from "~/server/api/services/form";
import { useTranslations } from "next-intl";

interface DynamicFormProps {
	formData: RouterOutputs["form"]["getData"];
	control: Control<FieldValues, any, FieldValues>;
	errors: FieldErrors<FieldValues>;
	showAnswer: boolean;
}

export function DynamicForm({
	formData,
	control,
	errors,
	showAnswer,
}: DynamicFormProps) {
	const t = useTranslations("DynamicForm");
	const { data, type } = formData;

	const renderField = (question: Questions) => {
		const fieldId = question.key;
		const isRequired = question.required;

		const getErrorMessage = (fieldId: string) => {
			if (question.type === "email") return t("validation.invalidEmail");
			return isRequired
				? t("validation.required", { field: question.label })
				: "";
		};

		switch (question.type) {
			case "text":
			case "number":
				return (
					<Controller
						name={fieldId}
						control={control}
						rules={{
							required: isRequired ? getErrorMessage(fieldId) : false,
							min: question.min
								? {
										value: question.min,
										message: t("validation.min", { min: question.min }),
									}
								: undefined,
							max: question.max
								? {
										value: question.max,
										message: t("validation.max", { max: question.max }),
									}
								: undefined,
						}}
						render={({ field }) => (
							<div className="flex flex-col gap-6 p-3 bg-card rounded-2xl">
								<Label htmlFor={fieldId} className="text-base">
									<span className="text-muted-foreground text-base">
										{fieldId}.{" "}
									</span>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<Input
									{...field}
									id={fieldId}
									type={question.type}
									placeholder={question.placeholder ?? undefined}
									min={question.min ?? undefined}
									max={question.max ?? undefined}
									step={question.step ?? undefined}
									className="focus:ring-muted-foreground"
									value={field.value || ""}
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
								{question.answer !== undefined &&
									question.answer !== null &&
									showAnswer && (
										<div className="border py-2 px-3 border-muted bg-card flex items-center gap-2 rounded-md w-fit">
											<CheckIcon className="h-5 min-w-5 text-green-500" />
											<p className="text-sm text-muted-foreground">
												{t("answerLabel.answer")}: {question.answer as string}
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
							required: isRequired ? getErrorMessage(fieldId) : false,
							validate: (value) => {
								const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
								return emailRegex.test(value) || t("validation.invalidEmail");
							},
						}}
						render={({ field }) => (
							<div className="flex flex-col gap-6 p-3 bg-card rounded-2xl">
								<Label htmlFor={fieldId} className="text-base">
									<span className="text-muted-foreground text-base">
										{fieldId}.{" "}
									</span>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<Input
									{...field}
									id={fieldId}
									type="email"
									placeholder={question.placeholder ?? t("placeholders.email")}
									className="focus:ring-muted-foreground"
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
							required: isRequired ? getErrorMessage(fieldId) : false,
						}}
						render={({ field }) => (
							<div className="flex flex-col gap-6 p-3 bg-card rounded-2xl">
								<Label htmlFor={fieldId} className="text-base">
									<span className="text-muted-foreground text-base">
										{fieldId}.{" "}
									</span>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<Input
									{...field}
									id={fieldId}
									type="date"
									className="focus:ring-muted-foreground w-fit"
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
								{question.answer !== undefined &&
									question.answer !== null &&
									showAnswer && (
										<div className="border bg-card p-2 rounded-md border-muted flex w-fit items-center gap-2">
											<CheckIcon className="h-5 min-w-5 text-green-500" />
											<p className="text-sm text-muted-foreground">
												{t("answerLabel.answer")}: {question.answer as string}
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
							required: isRequired ? getErrorMessage(fieldId) : false,
						}}
						render={({ field }) => (
							<div className="flex flex-col gap-6 p-3 bg-card rounded-2xl">
								<Label htmlFor={fieldId} className="text-base">
									<span className="text-muted-foreground text-base">
										{fieldId}.{" "}
									</span>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<Textarea
									{...field}
									id={fieldId}
									placeholder={
										question.placeholder ?? t("placeholders.textarea")
									}
									rows={4}
									className="focus:ring-muted-foreground"
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
								{question.answer !== undefined &&
									question.answer !== null &&
									showAnswer && (
										<div className="border bg-card p-2 rounded-md border-muted flex w-fit items-center gap-2">
											<CheckIcon className="h-5 min-w-5 text-green-500" />
											<p className="text-sm text-muted-foreground">
												{t("answerLabel.answer")}: {question.answer as string}
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
							required: isRequired ? getErrorMessage(fieldId) : false,
						}}
						render={({ field }) => (
							<div className="flex flex-col gap-6 p-3 bg-card rounded-2xl">
								<Label htmlFor={fieldId} className="text-base">
									<span className="text-muted-foreground text-base">
										{fieldId}.{" "}
									</span>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<Select onValueChange={field.onChange} value={field.value}>
									<SelectTrigger className="focus:ring-muted-foreground">
										<SelectValue placeholder={t("placeholders.selectOption")} />
									</SelectTrigger>
									<SelectContent>
										{question.questionOptions.map((option) => (
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
								{question.answer !== undefined &&
									question.answer !== null &&
									showAnswer && (
										<div className="border p-2 rounded-md border-muted w-fit flex items-center gap-2 bg-card">
											<CheckIcon className="h-5 min-w-5 text-green-500" />
											<p className="text-sm text-muted-foreground">
												{t("answerLabel.answer")}:{" "}
												{question.questionOptions.find(
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
							required: isRequired ? getErrorMessage(fieldId) : false,
						}}
						render={({ field }) => (
							<div className="flex flex-col gap-6 p-3 bg-card rounded-2xl">
								<Label htmlFor={fieldId} className="text-base">
									<span className="text-muted-foreground">{fieldId}. </span>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<RadioGroup
									className="gap-4"
									onValueChange={field.onChange}
									value={field.value}
								>
									{question.questionOptions.map((option) => (
										<div
											key={option.value}
											className="flex items-center space-x-2"
										>
											<RadioGroupItem
												value={option.value}
												id={`${fieldId}-${option.value}`}
											/>
											<Label
												htmlFor={`${fieldId}-${option.value}`}
												className="font-normal text-foreground"
											>
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
								{question.answer !== undefined &&
									question.answer !== null &&
									showAnswer && (
										<div className="border p-2 rounded-md border-muted w-fit flex items-center gap-2 bg-card">
											<CheckIcon className="h-5 min-w-5 text-green-500" />
											<p className="text-sm text-muted-foreground">
												{t("answerLabel.answer")}:{" "}
												{question.questionOptions.find(
													(option) => option.value === `${question.answer}`,
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
							required: isRequired ? getErrorMessage(fieldId) : false,
						}}
						render={({ field }) => (
							<div className="flex flex-col gap-6 p-3 bg-card rounded-2xl">
								<Label htmlFor={fieldId} className="text-base">
									<span className="text-muted-foreground text-base">
										{fieldId}.{" "}
									</span>
									{question.label}
									{isRequired && <span className="text-red-500 ml-1">*</span>}
								</Label>
								<div className="flex flex-col gap-4">
									{question.questionOptions.map((option) => (
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
											<Label
												htmlFor={`${fieldId}-${option.value}`}
												className="font-normal"
											>
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
								{question.answer !== undefined &&
									question.answer !== null &&
									showAnswer && (
										<div className="border p-2 rounded-md border-muted w-fit flex items-center gap-2 bg-card">
											<CheckIcon className="h-5 min-w-5 text-green-500" />
											<p className="text-sm text-muted-foreground">
												{t("answerLabel.answer")}:{" "}
												{Array.isArray(question.answer) &&
													question.answer
														.map((item) => {
															const option = question.questionOptions.find(
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
							<div className="flex flex-col gap-6 p-3 bg-card rounded-2xl">
								<div className="flex items-center space-x-2">
									<Switch
										id={fieldId}
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
									<Label htmlFor={fieldId} className="text-base">
										<span className="text-muted-foreground text-base">
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
									<div className="border p-2 rounded-md border-muted w-fit flex items-center gap-2 bg-card">
										<CheckIcon className="h-5 min-w-5 text-green-500" />
										<p className="text-sm text-muted-foreground">
											{t("answerLabel.answer")}:{" "}
											{question.answer ? t("boolean.true") : t("boolean.false")}
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
						rules={{
							required: isRequired ? getErrorMessage(fieldId) : false,
						}}
						render={({ field }) => (
							<div className="flex flex-col gap-6 p-3 bg-card rounded-2xl">
								<Label htmlFor={fieldId} className="text-base">
									<span className="text-muted-foreground text-base">
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
											{t("slider.currentValue")}:{" "}
											{field.value?.[0] || question.min || 0}
										</span>
										<span>{question.max || 100}</span>
									</div>
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
								{question.answer !== undefined &&
									question.answer !== null &&
									showAnswer && (
										<div className="border p-2 rounded-md border-muted w-fit flex items-center gap-2 bg-card">
											<CheckIcon className="h-5 min-w-5 text-green-500" />
											<p className="text-sm text-muted-foreground">
												{t("answerLabel.answer")}: {question.answer as number}
											</p>
										</div>
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
		<div className="flex flex-col gap-4">
			{type === "BASIC" && (
				<Fragment>
					<div className="flex flex-col gap-3 mb-4">
						<div className="flex items-center gap-4 justify-between">
							<p className="text-foreground font-semibold text-xl tracking-widest">
								{data.form.title}
							</p>
						</div>
						{data.form.description && (
							<p className="text-sm text-muted-foreground">
								{data.form.description}
							</p>
						)}
					</div>
					<Separator />
					<div className="flex flex-col gap-6">
						{data.questionsToFormVersions.map((item) => (
							<Fragment key={item.question.id}>
								{renderField(item.question)}
							</Fragment>
						))}
					</div>
				</Fragment>
			)}
			{type === "EXAM" && (
				<Fragment>
					<div className="flex flex-col gap-3 mb-4">
						<div className="flex items-center gap-4 justify-between">
							<p className="text-foreground font-semibold text-xl tracking-widest">
								{data.exam.title}
							</p>
						</div>
						{data.exam.instructions && (
							<p className="text-sm text-muted-foreground">
								{data.exam.instructions}
							</p>
						)}
					</div>
					<Separator />
					<div className="flex flex-col gap-6">
						{data.questionsToExamVersions.map((item) => (
							<Fragment key={item.question.id}>
								{renderField(item.question)}
							</Fragment>
						))}
					</div>
				</Fragment>
			)}
		</div>
	);
}
