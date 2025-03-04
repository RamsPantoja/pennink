import { useRouter } from "next/router";
import { Card } from "../ui/card";
import { api } from "~/utils/api";
import { Chat } from "../Chat";
import { Skeleton } from "../ui/skeleton";
import { SkeletonNotebook } from "./Skeleton";
import FeedbackMessage from "../common/FeedbackMessage";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "../ui/resizable";
import dynamic from "next/dynamic";
import { Loading } from "../common/Loading";
const DynamicEditor = dynamic(() => import("../Editor"), {
	ssr: false,
	loading: () => <Loading />,
});

type NotebookProps = {};

export const Notebook = ({}: NotebookProps) => {
	const router = useRouter();
	const { id } = router.query;

	const {
		data: notebookData,
		isLoading: notebookIsLoading,
		isError: notebookIsError,
	} = api.notebook.notebookById.useQuery({
		id: id as string,
	});

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
					className="min-h-[200px] w-fullrounded-lg border rounded-xl md:min-w-[450px]"
				>
					<ResizablePanel defaultSize={50}>
						<div className="w-full h-full flex">
							<Chat id={notebookData.chatId} isNew={false} />
						</div>
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize={50}>
						<div className="w-full h-full flex">
							<DynamicEditor onSave={() => {}} />
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</Card>
	);
};
