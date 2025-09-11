import { useRouter } from "next/router";
import { useState } from "react";
import { api } from "~/utils/api";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";

const useSidebarLogic = () => {
	const router = useRouter();
	const [displaySignOutAlert, setDisplaySignOutAlert] =
		useState<boolean>(false);
	const { resetWorkspaceStore } = useWorkspaceStore();

	const {
		data: workspacesData,
		isLoading: workspacesIsLoading,
		isError: workspacesIsError,
	} = api.workspace.workspaces.useQuery();

	const onNewWorkspace = async () => {
		await router.push("/");
		resetWorkspaceStore();
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
