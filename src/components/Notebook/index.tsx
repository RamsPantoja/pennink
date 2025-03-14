import { useRouter } from "next/router";
import { Card } from "../ui/card";
import { api } from "~/utils/api";
import { Chat } from "../Chat";
import { SkeletonNotebook } from "./Skeleton";
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
const DynamicEditor = dynamic(() => import("../Editor"), {
	ssr: false,
	loading: () => <Loading />,
});

type NotebookProps = {};

export const Notebook = ({}: NotebookProps) => {
	const router = useRouter();
	const { id } = router.query;
	const utils = api.useUtils();

	const {
		data: notebookData,
		isLoading: notebookIsLoading,
		isError: notebookIsError,
	} = api.notebook.notebookById.useQuery({
		id: id as string,
	});

	const { mutate: updateNote, isPending: updateNoteIsPending } =
		api.note.updateNote.useMutation({
			onSuccess: async () => {
				await utils.notebook.notebookById.invalidate();
			},
			onError: (error) => {
				toast(error.message);
			},
		});

	const getNoteContent = async (data: OutputData) => {
		const { version, time, blocks } = data;

		if (!notebookData?.noteId) {
			toast("Invalid note ID");
			return;
		}

		updateNote({
			noteId: notebookData.noteId,
			content: {
				version,
				time,
				blocks,
			},
		});
	};

	return (
		<Card className="w-full h-full flex flex-col items-center p-0">
			{notebookIsLoading && <SkeletonNotebook />}
			{notebookIsError && (
				<FeedbackMessage
					status="ERROR"
					message="Algo salió mal, inténtalo de nuevo más tarde."
				/>
			)}
			{notebookData && (
				<ResizablePanelGroup
					direction="horizontal"
					className="min-h-[200px] w-full rounded-xl md:min-w-[450px] flex h-full"
				>
					<ResizablePanel defaultSize={50}>
						<div className="w-full h-full flex">
							<Chat id={notebookData.chatId} isNew={false} />
						</div>
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize={50}>
						<Card className="w-full h-full flex" key={id as string}>
							<DynamicEditor
								data={notebookData.note.content}
								onSave={getNoteContent}
							/>
						</Card>
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</Card>
	);
};
