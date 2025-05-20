import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "~/utils/api";

const feedbackValidationSchema = z.object({
	content: z
		.string({
			required_error: "Required field",
		})
		.min(1, "Required field"),
});

export type FeedbackValidationSchema = z.infer<typeof feedbackValidationSchema>;

const useFeedbackLogic = () => {
	const [openCommentsBox, setOpenCommentsBox] = useState<boolean>(false);
	const useFormFeedback = useForm<FeedbackValidationSchema>({
		resolver: zodResolver(feedbackValidationSchema),
		defaultValues: {
			content: "",
		},
	});

	const { mutate: createFeedbackMutation, isPending: createFeedbackIsPending } =
		api.feedback.createFeedback.useMutation({
			onSuccess: async () => {
				useFormFeedback.reset();
				setOpenCommentsBox(false);
				toast.success("Feedback sent successfully!");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const onSendFeedback = (data: FeedbackValidationSchema) => {
		createFeedbackMutation({
			content: data.content,
		});
	};

	return {
		openCommentsBox,
		setOpenCommentsBox,
		onSendFeedback,
		createFeedbackIsPending,
		useFormFeedback,
	};
};

export default useFeedbackLogic;
