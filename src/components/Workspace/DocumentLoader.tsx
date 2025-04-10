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
import type { PenninkDocument } from "./useWorkspaceStore";

type DocumentLoaderProps = {
	onSelect: (doc: PenninkDocument) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export const DocumentLoader = ({
	onSelect,
	open,
	onOpenChange,
}: DocumentLoaderProps) => {
	const {
		data: filesByUser,
		isLoading: filesByUserLoading,
		isError: filesByUserError,
	} = api.workspace.filesByUserId.useQuery();

	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="left-0 md:left-1/2 bg-white right-2 top-2 bottom-2 overflow-hidden fixed border z-50 rounded-xl outline-none mt-0">
				<div className="h-full w-full grow p-4 flex flex-col">
					<DrawerHeader>
						<DrawerTitle className="text-sm font-semibold">
							Your documents
						</DrawerTitle>
						<DrawerDescription>
							Select a document to read from all saved documents
						</DrawerDescription>
					</DrawerHeader>
					<div className="grid gap-2 h-full overflow-auto">
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
	);
};
