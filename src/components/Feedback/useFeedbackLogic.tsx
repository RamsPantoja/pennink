import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "~/trpc/react";
import { type createTranslator, useTranslations } from "next-intl";

const feedbackValidationSchema = z.object({
	content: z
		.string({
			required_error: "Required field",
		})
		.min(1, "Required field"),
});

const createFeedbackValidationSchema = (
	t: ReturnType<typeof createTranslator>,
) => {
	return z.object({
		content: z
			.string({
				required_error: t("validation.required"),
			})
			.min(1, t("validation.required")),
	});
};

export type FeedbackValidationSchema = z.infer<
	ReturnType<typeof createFeedbackValidationSchema>
>;

const useFeedbackLogic = () => {
	const t = useTranslations("Feedback");
	const [openCommentsBox, setOpenCommentsBox] = useState<boolean>(false);

	const useFormFeedback = useForm<FeedbackValidationSchema>({
		resolver: zodResolver(createFeedbackValidationSchema(t)),
		defaultValues: {
			content: "",
		},
	});

	const { mutate: createFeedbackMutation, isPending: createFeedbackIsPending } =
		api.feedback.createFeedback.useMutation({
			onSuccess: async () => {
				useFormFeedback.reset();
				setOpenCommentsBox(false);
				toast.success(t("toast.success"));
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
