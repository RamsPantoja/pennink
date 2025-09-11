import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { FormType } from "~/lib/enum";
import { api } from "~/utils/api";

type UseLinksLogicProps = {
	id: string;
	type: FormType;
};

export const useLinksLogic = ({ id, type }: UseLinksLogicProps) => {
	const apiUtils = api.useUtils();
	const [searchKey, setSearchKey] = useState<string>("");
	const [searchParam, setSearchParam] = useState<string | undefined>();

	const {
		data: linksData,
		isPending: linksIsPending,
		error: linksError,
	} = api.link.linksByForm.useQuery({
		id,
		type,
		key: searchParam,
	});

	const performSearch = () => {
		if (searchKey) {
			setSearchParam(searchKey);
		} else {
			setSearchParam(undefined);
		}
	};

	return {
		linksData,
		linksIsPending,
		linksError,
		searchKey,
		setSearchKey,
		setSearchParam,
		performSearch,
	};
};
