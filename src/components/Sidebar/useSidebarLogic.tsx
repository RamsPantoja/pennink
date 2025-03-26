import { useRouter } from "next/router";
import { useState } from "react";
import { api } from "~/utils/api";

const useSidebarLogic = () => {
	const router = useRouter();
	const [displaySignOutAlert, setDisplaySignOutAlert] =
		useState<boolean>(false);

	const {
		data: workspacesData,
		isLoading: workspacesIsLoading,
		isError: workspacesIsError,
	} = api.workspace.workspaces.useQuery();

	const onNewWorkspace = () => {
		router.push("/");
	};

	return {
		displaySignOutAlert,
		setDisplaySignOutAlert,
		workspacesData,
		workspacesIsLoading,
		workspacesIsError,
		onNewWorkspace,
	};
};

export default useSidebarLogic;
