import PDFUploader from "../PDFUploader";
import { Button } from "../common/Button";
import { Separator } from "../ui/separator";

type DocumentLoaderProps = {
	onUpload: (file: File) => Promise<void>;
	isPending: boolean;
};

export const DocumentLoader = ({
	onUpload,
	isPending,
}: DocumentLoaderProps) => {
	return (
		<div className="flex flex-col gap-8 p-4">
			<PDFUploader onUpload={onUpload} isPending={isPending} />
			<Separator />
			<Button className="w-full">Select a document</Button>
		</div>
	);
};
