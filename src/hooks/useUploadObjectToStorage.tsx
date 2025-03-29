import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { typeid } from "typeid-js";
import { api } from "~/utils/api";

export type onUploadFileInput = {
	path: string;
	file: File;
};

export type UploadObjectToStorageResponse = {
	key: string;
	bucket: string;
};

const useUploadObjectToStorage = () => {
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

			const res = await fetch(data.signedUrl, {
				method: "PUT",
				body: input.file,
				headers: {
					"Content-Type": input.file.type,
				},
			});

			return {
				key: data.key,
				bucket: "test",
			};
		} catch (error) {
			setUploadingToStorage(false);
			console.error(error);
			toast.error("Failed to upload file");
		}
	};

	return {
		onUploadFile,
		loading: uploadingToStorage || createPresignedUrlMutationIsPending,
	};
};

export default useUploadObjectToStorage;
