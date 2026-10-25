import type { FormType } from "~/lib/enum";
import { useActiveClassroom } from "~/components/Classroom/useActiveClassroom";
import { api } from "~/trpc/react";

type UseLinksLogicProps = {
	id: string;
	type: FormType;
};

export const useLinksLogic = ({ id, type }: UseLinksLogicProps) => {
	const { data: classrooms } = api.classroom.classrooms.useQuery();
	const { activeId: classroomId } = useActiveClassroom(classrooms);

	const {
		data: linksData,
		isPending: linksIsPending,
		error: linksError,
	} = api.link.linksByForm.useQuery(
		{
			id,
			type,
			classroomId: classroomId ?? "",
		},
		{ enabled: Boolean(classroomId) },
	);

	return {
		linksData,
		linksIsPending,
		linksError,
	};
};
