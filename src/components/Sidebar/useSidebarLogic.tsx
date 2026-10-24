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
		data: classroomsData,
		isLoading: classroomsIsLoading,
		isError: classroomsIsError,
	} = api.classroom.classrooms.useQuery();

	const onNewWorkspace = () => {
		router.push("/");
		resetWorkspaceStore();
	};

	return {
		displaySignOutAlert,
		setDisplaySignOutAlert,
		classroomsData,
		classroomsIsLoading,
		classroomsIsError,
		onNewWorkspace,
	};
};

export default useSidebarLogic;
