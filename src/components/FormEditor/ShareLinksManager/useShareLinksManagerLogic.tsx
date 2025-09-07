import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "~/utils/api";

const linkFormValidationSchema = z.object({
	key: z
		.string({
			required_error: "Required field",
		})
		.min(1, "Required field"),
});

export type LinkFormValidationSchema = z.infer<typeof linkFormValidationSchema>;

type UseShareLinkFormLogicProps = {
	id: string;
};

const useShareLinksManagerLogic = ({ id }: UseShareLinkFormLogicProps) => {
	const apiUtils = api.useUtils();
	const [openShareLinkMenu, setShareLinkMenu] = useState<boolean>(false);
	const useFormLinkForm = useForm<LinkFormValidationSchema>({
		resolver: zodResolver(linkFormValidationSchema),
		defaultValues: {
			key: "",
		},
	});

	const {
		data: shareLinkData,
		isPending: shareLinkIsPending,
		error: shareLinkError,
	} = api.link.useQuery({
		noteId,
	});

	const {
		mutate: createShareLinkFormMutation,
		isPending: createShareLinkFormIsPending,
	} = api.shareLink.createShareLinkForNote.useMutation({
		onSuccess: async () => {
			useFormShareLinkForm.reset();
			apiUtils.shareLink.shareLinkByNoteId.invalidate();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const onCreateShareLinkForm = (data: LinkFormValidationSchema) => {
		createShareLinkFormMutation({
			key: data.key,
			noteId,
		});
	};

	return {
		openShareLinkMenu,
		setShareLinkMenu,
		onCreateShareLinkForm,
		createShareLinkFormIsPending,
		useFormShareLinkForm,
		shareLinkData,
		shareLinkIsPending,
		shareLinkError,
	};
};

export default useShareLinksManagerLogic;
