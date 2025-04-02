import { useEffect } from "react";
import PDFUploader from "../PDFUploader";
import { Button } from "../common/Button";
import { Separator } from "../ui/separator";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const textSplitter = new RecursiveCharacterTextSplitter({
	chunkSize: 1000,
	chunkOverlap: 200,
});

type DocumentLoaderProps = {
	onUpload: (file: File) => Promise<void>;
	isPending: boolean;
};

export const DocumentLoader = ({
	onUpload,
	isPending,
}: DocumentLoaderProps) => {
	useEffect(() => {
		const loadDoc = async () => {
			const response = await fetch(
				"https://storage-dev.pennink.xyz/workspace/documents/0195acd6-cd95-79e8-ac6f-5417397bcd2b/0195e35a-2817-7ff3-b902-2d15991953a6",
			);
			const blob = await response.blob();
			const loader = new WebPDFLoader(blob);
			const docs = await loader.load();
			const allSplits = await textSplitter.splitDocuments(docs);

			console.log(allSplits);
		};

		loadDoc();
	}, []);

	return (
		<div className="flex flex-col gap-8 p-4">
			<PDFUploader onUpload={onUpload} isPending={isPending} />
			<Separator />
			<Button className="w-full">Select a document</Button>
		</div>
	);
};
