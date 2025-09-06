import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "~/utils/api";

const shareLinkEditorValidationSchema = z.object({
	key: z
		.string({
			required_error: "Required field",
		})
		.min(1, "Required field"),
});

export type ShareLinkEditorValidationSchema = z.infer<
	typeof shareLinkEditorValidationSchema
>;

type UseShareLinkEditorLogicProps = {
	noteId: string;
};

const useShareLinkEditorLogic = ({ noteId }: UseShareLinkEditorLogicProps) => {
	const apiUtils = api.useUtils();
	const [openShareLinkMenu, setShareLinkMenu] = useState<boolean>(false);
	const useFormShareLinkEditor = useForm<ShareLinkEditorValidationSchema>({
		resolver: zodResolver(shareLinkEditorValidationSchema),
		defaultValues: {
			key: "",
		},
	});

	const {
		data: shareLinkData,
		isPending: shareLinkIsPending,
		error: shareLinkError,
	} = api.shareLink.shareLinkByNoteId.useQuery({
		noteId,
	});

	const {
		mutate: createShareLinkEditorMutation,
		isPending: createShareLinkEditorIsPending,
	} = api.shareLink.createShareLinkForNote.useMutation({
		onSuccess: async () => {
			useFormShareLinkEditor.reset();
			apiUtils.shareLink.shareLinkByNoteId.invalidate();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const onSendShareLinkEditor = (data: ShareLinkEditorValidationSchema) => {
		createShareLinkEditorMutation({
			key: data.key,
			noteId,
		});
	};

	return {
		openShareLinkMenu,
		setShareLinkMenu,
		onSendShareLinkEditor,
		createShareLinkEditorIsPending,
		useFormShareLinkEditor,
		shareLinkData,
		shareLinkIsPending,
		shareLinkError,
	};
};

export default useShareLinkEditorLogic;
