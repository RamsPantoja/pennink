import PDFUploader from "../PDFUploader";
import { Button } from "../common/Button";
import { Separator } from "../ui/separator";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
	DrawerHandle,
} from "../ui/drawer";
import { api } from "~/utils/api";
import { DocumentCard } from "./DocumentCard";
import { Loading } from "../common/Loading";
import FeedbackMessage from "../common/FeedbackMessage";
import { DateTime } from "luxon";

type DocumentLoaderProps = {
	onUpload: (file: File) => Promise<void>;
	isPending: boolean;
	onSelect: (doc: Document) => void;
};

export type Document = {
	id: string;
	filename: string;
	type: string;
	src: string;
};

export const DocumentLoader = ({
	onUpload,
	isPending,
	onSelect,
}: DocumentLoaderProps) => {
	const {
		data: filesByUser,
		isLoading: filesByUserLoading,
		isError: filesByUserError,
	} = api.workspace.filesByUserId.useQuery();

	return (
		<div className="flex flex-col gap-8 p-4">
			<Drawer direction="right">
				<DrawerTrigger className="relative" asChild>
					<Button className="relative" variant="outline">
						Select document
					</Button>
				</DrawerTrigger>
				<DrawerContent className="left-0 md:left-1/2 bg-white right-2 top-2 bottom-2 overflow-hidden fixed border z-50 rounded-xl outline-none mt-0">
					<div className="bg-zinc-50 h-full w-full grow p-4 flex flex-col">
						<DrawerHeader>
							<DrawerTitle>Your documents</DrawerTitle>
							<DrawerDescription>
								Select a document to read from all saved documents
							</DrawerDescription>
						</DrawerHeader>
						<div className="grid gap-2">
							{filesByUserLoading && <Loading />}
							{!filesByUserLoading && filesByUserError && (
								<FeedbackMessage
									status="ERROR"
									message="Failed to load documents"
								/>
							)}
							{!filesByUserLoading &&
								!filesByUserError &&
								filesByUser &&
								filesByUser.length === 0 && (
									<div className="flex items-center justify-center">
										Your documents will appear here.
									</div>
								)}

							{!filesByUserLoading &&
								!filesByUserError &&
								filesByUser &&
								filesByUser.length > 1 && (
									<div className="grid gap-2">
										{filesByUser.map((doc) => (
											<DocumentCard
												key={doc.id}
												title={doc.filename}
												type={doc.type}
												date={DateTime.fromJSDate(doc.createdAt).toLocaleString(
													DateTime.DATETIME_MED,
												)}
												onSelect={onSelect}
												id={doc.id}
												storageKey={doc.key}
											/>
										))}
									</div>
								)}
						</div>
						<DrawerFooter>
							<DrawerClose asChild>
								<Button variant="outline">Close</Button>
							</DrawerClose>
						</DrawerFooter>
					</div>
				</DrawerContent>
			</Drawer>
			<Separator />
			<PDFUploader onUpload={onUpload} isPending={isPending} />
		</div>
	);
};
