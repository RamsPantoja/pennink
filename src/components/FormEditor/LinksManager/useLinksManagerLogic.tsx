import { useState } from "react";
import { sileo } from "sileo";
import type { FormType } from "~/lib/enum";
import { useActiveClassroom } from "~/components/Classroom/useActiveClassroom";
import { api } from "~/trpc/react";

type UseLinksManagerLogicProps = {
	id: string;
	type: FormType;
};

export const useLinksManagerLogic = ({
	id,
	type,
}: UseLinksManagerLogicProps) => {
	const apiUtils = api.useUtils();
	const [openLinkMenu, setLinkMenu] = useState<boolean>(false);

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

	const { mutate: createLinkFormMutation, isPending: createLinkFormIsPending } =
		api.link.createLinkForForm.useMutation({
			onSuccess: async () => {
				apiUtils.link.linksByForm.invalidate();
			},
			onError: (error) => {
				sileo.error({ title: error.message });
			},
		});

	const onCreateLink = () => {
		if (!classroomId) return;

		createLinkFormMutation({
			type,
			id,
			classroomId,
		});
	};

	return {
		openLinkMenu,
		setLinkMenu,
		onCreateLink,
		createLinkFormIsPending,
		canCreateLink: Boolean(classroomId),
		linksData,
		linksIsPending,
		linksError,
	};
};
