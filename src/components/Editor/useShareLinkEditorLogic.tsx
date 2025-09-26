import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { api } from "~/trpc/react";

type UseShareLinkEditorLogicProps = {
	noteId: string;
};

const useShareLinkEditorLogic = ({ noteId }: UseShareLinkEditorLogicProps) => {
	const apiUtils = api.useUtils();
	const [openShareLinkMenu, setShareLinkMenu] = useState<boolean>(false);

	const {
		data: linkData,
		isPending: linkIsPending,
		error: linkError,
	} = api.link.linkByNoteId.useQuery({
		noteId,
	});

	const {
		mutate: createLinkEditorMutation,
		isPending: createLinkEditorIsPending,
	} = api.link.createLinkForNote.useMutation({
		onSuccess: async () => {
			apiUtils.link.linkByNoteId.invalidate();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const onCreateLinkEditor = () => {
		createLinkEditorMutation({
			noteId,
		});
	};

	return {
		openShareLinkMenu,
		setShareLinkMenu,
		onCreateLinkEditor,
		createLinkEditorIsPending,
		linkData,
		linkIsPending,
		linkError,
	};
};

export default useShareLinkEditorLogic;
