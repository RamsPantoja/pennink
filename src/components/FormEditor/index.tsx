import { BeakerIcon, ShareIcon } from "@heroicons/react/24/outline";
import { Button } from "../common/Button";
import { DynamicForm, type Question } from "../DynamicForm";
import { Card } from "../ui/card";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

// Sample questions data
const sampleQuestions: Question[] = [
	{
		id: "name",
		type: "text",
		label: "Full Name",
		placeholder: "Enter your full name",
		required: true,
	},
	{
		id: "email",
		type: "email",
		label: "Email Address",
		placeholder: "Enter your email",
		required: true,
	},
	{
		id: "age",
		type: "number",
		label: "Age",
		placeholder: "Enter your age",
		min: 18,
		max: 100,
	},
	{
		id: "bio",
		type: "textarea",
		label: "Bio",
		placeholder: "Tell us about yourself",
		description: "Brief description about yourself",
	},
	{
		id: "country",
		type: "select",
		label: "Country",
		required: true,
		options: [
			{ value: "us", label: "United States" },
			{ value: "uk", label: "United Kingdom" },
			{ value: "ca", label: "Canada" },
			{ value: "au", label: "Australia" },
			{ value: "de", label: "Germany" },
		],
	},
	{
		id: "experience",
		type: "radio",
		label: "Experience Level",
		required: true,
		options: [
			{ value: "beginner", label: "Beginner (0-1 years)" },
			{ value: "intermediate", label: "Intermediate (2-5 years)" },
			{ value: "advanced", label: "Advanced (5+ years)" },
		],
	},
	{
		id: "skills",
		type: "checkbox",
		label: "Skills",
		options: [
			{ value: "javascript", label: "JavaScript" },
			{ value: "typescript", label: "TypeScript" },
			{ value: "react", label: "React" },
			{ value: "nodejs", label: "Node.js" },
			{ value: "python", label: "Python" },
		],
	},
	{
		id: "notifications",
		type: "switch",
		label: "Email Notifications",
		description: "Receive updates via email",
	},
	{
		id: "satisfaction",
		type: "slider",
		label: "Satisfaction Level",
		min: 0,
		max: 10,
		step: 1,
		description: "Rate your satisfaction from 0 to 10",
	},
	{
		id: "birthdate",
		type: "date",
		label: "Birth Date",
	},
];

export const FormEditor = () => {
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
			<div className="p-4">
				<Button size="icon" variant="outline">
					<ShareIcon className="min-w-5 h-5" />
				</Button>
			</div>
			<DynamicForm
				title="Dynamic form"
				questions={sampleQuestions}
				control={control}
				errors={errors}
			/>
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
