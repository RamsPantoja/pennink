import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { FormType } from "~/lib/enum";
import { api } from "~/trpc/react";

const linkFormValidationSchema = z.object({
	key: z
		.string({
			required_error: "Required field",
		})
		.min(1, "Required field"),
});

export type LinkFormValidationSchema = z.infer<typeof linkFormValidationSchema>;

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
	const [searchKey, setSearchKey] = useState<string>("");
	const [searchParam, setSearchParam] = useState<string | undefined>();

	const useFormLinkForm = useForm<LinkFormValidationSchema>({
		resolver: zodResolver(linkFormValidationSchema),
		defaultValues: {
			key: "",
		},
	});

	const {
		data: linksData,
		isPending: linksIsPending,
		error: linksError,
	} = api.link.linksByForm.useQuery({
		id,
		type,
		key: searchParam,
	});

	const { mutate: createLinkFormMutation, isPending: createLinkFormIsPending } =
		api.link.createLinkForForm.useMutation({
			onSuccess: async () => {
				useFormLinkForm.reset();
				apiUtils.link.linksByForm.invalidate();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const onCreateLinkForm = (data: LinkFormValidationSchema) => {
		createLinkFormMutation({
			key: data.key,
			type,
			id,
		});
	};

	const performSearch = () => {
		if (searchKey) {
			setSearchParam(searchKey);
		} else {
			setSearchParam(undefined);
		}
	};

	return {
		openLinkMenu,
		setLinkMenu,
		onCreateLinkForm,
		createLinkFormIsPending,
		useFormLinkForm,
		linksData,
		linksIsPending,
		linksError,
		searchKey,
		setSearchKey,
		setSearchParam,
		performSearch,
	};
};
