import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/utils/api";

const useSidebarLogic = () => {
	const [displaySignOutAlert, setDisplaySignOutAlert] =
		useState<boolean>(false);

	const {
		data: notebooksData,
		isLoading: notebooksIsLoading,
		isError: notebooksIsError,
	} = api.notebook.notebooks.useQuery();

	const { mutate: createNotebook, isPending: createNotebookIsPending } =
		api.notebook.create.useMutation({
			onSuccess: async (data) => {
				toast.success("Cuardo creado correctamente y listo para usar");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const onCreateNotebook = () => {
		createNotebook({
			name: "Hola mundo!",
		});
	};

	return {
		displaySignOutAlert,
		setDisplaySignOutAlert,
		notebooksData,
		notebooksIsLoading,
		notebooksIsError,
		onCreateNotebook,
		createNotebookIsPending,
	};
};

export default useSidebarLogic;
