import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/utils/api";

const useSidebarLogic = () => {
	const router = useRouter();
	const [displaySignOutAlert, setDisplaySignOutAlert] =
		useState<boolean>(false);

	const {
		data: notebooksData,
		isLoading: notebooksIsLoading,
		isError: notebooksIsError,
	} = api.notebook.notebooks.useQuery();

	const onNewNotebook = () => {
		router.push("/");
	};

	return {
		displaySignOutAlert,
		setDisplaySignOutAlert,
		notebooksData,
		notebooksIsLoading,
		notebooksIsError,
		onNewNotebook,
	};
};

export default useSidebarLogic;
