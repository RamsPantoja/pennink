import { useRouter } from "next/router";
import { Card } from "../ui/card";
import { api } from "~/utils/api";
import { Chat } from "../Chat";
import { Skeleton } from "../ui/skeleton";
import { SkeletonNotebook } from "./Skeleton";
import FeedbackMessage from "../common/FeedbackMessage";

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
		<Card className="w-full h-full flex flex-col items-center">
			{notebookIsLoading && <SkeletonNotebook />}
			{notebookIsError && (
				<FeedbackMessage
					status="ERROR"
					message="Algo salió mal, inténtalo de nuevo más tarde."
				/>
			)}
			{notebookData && (
				<div className="w-full h-full flex  max-w-screen-lg">
					<Chat id={notebookData.chatId} />
				</div>
			)}
		</Card>
	);
};
