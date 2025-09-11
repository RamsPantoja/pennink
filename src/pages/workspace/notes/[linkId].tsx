import { useCreateBlockNote } from "@blocknote/react";
import Head from "next/head";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Loading } from "~/components/common/Loading";
import { SharedContentLayout } from "~/layout/SharedContent";
import { api } from "~/utils/api";
import {
	BlockNoteView,
	darkDefaultTheme,
	lightDefaultTheme,
} from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import type { Block } from "@blocknote/core";
import { useAppStore } from "~/pages/_app";
import { useRouter } from "next/router";
import { DateTime } from "luxon";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Fragment } from "react";

const SharedNotes = () => {
	const { query } = useRouter();

	const { data, isPending, isError } = api.link.noteByLinkId.useQuery(
		{
			linkId: typeof query.linkId === "string" ? query.linkId : "",
		},
		{
			enabled: query.linkId !== undefined,
		},
	);

	return (
		<SharedContentLayout>
			<>
				<Head>
					<title>Pennink - Notes</title>
					<meta name="description" content="Share your notes with others!" />
					<link rel="icon" href="/icon.png" />
				</Head>
				{isPending && <Loading />}
				{!isPending && !isError && data && (
					<Fragment>
						<div className="flex px-14 flex-col">
							<div className="flex flex-row items-center gap-4 min-w-32 w-full text-light-mocha-text dark:text-mocha-text">
								<Avatar className="h-7 w-7">
									<AvatarImage src={data.note.user.image} />
									<AvatarFallback>{data.note.user.name}</AvatarFallback>
								</Avatar>
								<div className="flex flex-col w-full overflow-hidden">
									<p className="truncate text-sm">
										Created by <strong>{data.note.user.name}</strong>
									</p>
									<p className="text-xs">
										{DateTime.fromJSDate(data.createdAt).toLocaleString(
											DateTime.DATETIME_MED,
										)}
									</p>
								</div>
							</div>
						</div>
						<ReadEditor content={data.note.content} />
					</Fragment>
				)}
				{!isPending && !isError && !data && (
					<FeedbackMessage
						status="INFORMATION"
						message="No shared notes found."
					/>
				)}
				{!isPending && isError && (
					<FeedbackMessage
						status="ERROR"
						message="An error occurred while fetching the shared notes."
					/>
				)}
			</>
		</SharedContentLayout>
	);
};

type ReadEditorProps = {
	content: Block[] | null;
};

const ReadEditor = ({ content }: ReadEditorProps) => {
	const editor = useCreateBlockNote({
		defaultStyles: false,
		initialContent: content ? content : undefined,
	});

	const { theme } = useAppStore();

	const defaultColors =
		theme === "light" ? lightDefaultTheme.colors : darkDefaultTheme.colors;

	return (
		<BlockNoteView
			theme={{
				fontFamily: "GeistMono",
				colors: {
					...defaultColors,
					editor: {
						text: theme === "light" ? "#2e2e2e" : "#d1cfc0",
						background: theme === "light" ? "#f2f0e3" : "#1f1f1f",
					},
				},
			}}
			editor={editor}
			formattingToolbar={false}
			slashMenu={false}
			editable={false}
		/>
	);
};

export default SharedNotes;
