import { useSession } from "next-auth/react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { typeid } from "typeid-js";
import { api } from "~/trpc/react";

export type onUploadFileInput = {
	path: string;
	file: File;
};

export type UploadObjectToStorageResponse = {
	key: string;
};

const useUploadObjectToStorage = () => {
	const t = useTranslations("UploadObjectToStorage");
	const { data: session } = useSession();
	const [uploadingToStorage, setUploadingToStorage] = useState<boolean>(false);
	const customId = typeid().toUUID();

	// Get pre-signed URL from backend
	const {
		mutateAsync: createPresignedUrlMutation,
		isPending: createPresignedUrlMutationIsPending,
	} = api.storage.createPresignedUrl.useMutation();

	const onUploadFile = async (input: onUploadFileInput) => {
		try {
			if (!session) {
				throw new Error("User is not authenticated");
			}

			const key = `${input.path}/${customId}`;

			const data = await createPresignedUrlMutation({
				key,
				command: "PUT",
			});

			setUploadingToStorage(true);

			await fetch(data.signedUrl, {
				method: "PUT",
				body: input.file,
				headers: {
					"Content-Type": input.file.type,
				},
			});

			setUploadingToStorage(false);

			return {
				key: data.key,
			};
		} catch (error) {
			setUploadingToStorage(false);
			console.error(error);
			toast.error(t("error"));
		}
	};

	return {
		onUploadFile,
		loading: uploadingToStorage || createPresignedUrlMutationIsPending,
	};
};

export default useUploadObjectToStorage;
