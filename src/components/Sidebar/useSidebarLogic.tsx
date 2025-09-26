import { useState } from "react";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

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

	const onNewWorkspace = () => {
		router.push("/");
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
