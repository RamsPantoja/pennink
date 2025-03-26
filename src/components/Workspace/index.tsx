import { useRouter } from "next/router";
import { Card, CardContent } from "../ui/card";
import { api } from "~/utils/api";
import { Chat } from "../Chat";
import { SkeletonWorkspace } from "./Skeleton";
import FeedbackMessage from "../common/FeedbackMessage";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "../ui/resizable";
import dynamic from "next/dynamic";
import { Loading } from "../common/Loading";
import type { OutputData } from "@editorjs/editorjs";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
	BookOpenIcon,
	ChatBubbleLeftIcon,
	ChatBubbleLeftRightIcon,
	DocumentTextIcon,
} from "@heroicons/react/24/outline";
import PDFUploader from "../PDFUploader";
const DynamicEditor = dynamic(() => import("../Editor"), {
	ssr: false,
	loading: () => <Loading />,
});

const DynamicPDFViewer = dynamic(() => import("../common/PDFViewer"), {
	ssr: false,
	loading: () => <Loading />,
});

type WorkspaceProps = {};

export const Workspace = ({}: WorkspaceProps) => {
	const router = useRouter();
	const { id } = router.query;
	const utils = api.useUtils();
	const [file, setFile] = useState<File | null>(null);
	const [url, setUrl] = useState<string | null>(null);

	// Clean up object URLs when component unmounts
	useEffect(() => {
		return () => {
			if (url) {
				URL.revokeObjectURL(url);
			}
		};
	}, []);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			// Clean up previous URL if it exists
			if (url) {
				URL.revokeObjectURL(url);
			}

			setFile(selectedFile);
			// Create a URL for the file
			const fileUrl = URL.createObjectURL(selectedFile);
			setUrl(fileUrl);
		}
	};

	const {
		data: workspaceData,
		isLoading: workspaceIsLoading,
		isError: workspaceIsError,
	} = api.workspace.workspaceById.useQuery({
		id: id as string,
	});

	const { mutate: updateWorkspace, isPending: updateWorkspaceIsPending } =
		api.note.updateNote.useMutation({
			onSuccess: async () => {
				await utils.workspace.workspaceById.invalidate();
			},
			onError: (error) => {
				toast(error.message);
			},
		});

	const getNoteContent = async (data: OutputData) => {
		const { version, time, blocks } = data;

		if (!workspaceData?.noteId) {
			toast("Invalid note ID");
			return;
		}

		updateWorkspace({
			noteId: workspaceData.noteId,
			content: {
				version,
				time,
				blocks,
			},
		});
	};

	return (
		<Card className="w-full h-full flex flex-col items-center p-0 rounded-none">
			{workspaceIsLoading && <SkeletonWorkspace />}
			{workspaceIsError && (
				<FeedbackMessage
					status="ERROR"
					message="Algo salió mal, inténtalo de nuevo más tarde."
				/>
			)}
			{workspaceData && (
				<ResizablePanelGroup
					direction="horizontal"
					className="min-h-[200px] w-full rounded-xl md:min-w-[450px] flex h-full"
				>
					<ResizablePanel defaultSize={50}>
						<div className="w-full h-full flex">
							<Chat id={workspaceData.chatId} isNew={false} />
						</div>
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize={50}>
						<Card
							className="w-full h-full flex p-0 rounded-none"
							key={id as string}
						>
							<Tabs
								defaultValue="notes"
								className="w-full flex flex-col gap-2 h-full"
							>
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="notes">
										<DocumentTextIcon className="min-w-5 h-5 mr-2" />
										Notes
									</TabsTrigger>
									<TabsTrigger value="reader">
										<BookOpenIcon className="min-w-5 h-5 mr-2" /> Reader
									</TabsTrigger>
								</TabsList>
								<TabsContent
									value="notes"
									className="w-full h-full overflow-hidden"
								>
									<DynamicEditor
										data={workspaceData.note.content}
										onSave={getNoteContent}
									/>
								</TabsContent>
								<TabsContent
									value="reader"
									className="w-full h-full overflow-hidden"
								>
									<div className="flex overflow-hidden h-full w-full flex-col gap-2 items-center">
										{/* <PDFUploader /> */}
									</div>
								</TabsContent>
							</Tabs>
						</Card>
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</Card>
	);
};
