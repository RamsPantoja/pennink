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

const SharedNotes = () => {
	const { query } = useRouter();

	const { data, isPending, isError } = api.shareLink.noteByShareLinkId.useQuery(
		{
			shareLinkId:
				typeof query.shareLinkId === "string" ? query.shareLinkId : "",
		},
		{
			enabled: query.shareLinkId !== undefined,
		},
	);

	return (
		<SharedContentLayout>
			<>
				<Head>
					<title>Pennink - Workspace</title>
					<meta name="description" content="Find a partner to do anything!" />
					<link rel="icon" href="/icon.png" />
				</Head>
				{isPending && <Loading />}
				{!isPending && !isError && data && (
					<div className="flex w-full absolute justify-center left-0 right-0 bottom-0 top-[49px] overflow-auto">
						<div className="flex w-full max-w-5xl p-6 flex-col gap-4">
							<div className="flex px-14 flex-col">
								<p className="text-xs">Author: {data.note.user.name}</p>
								<p className="text-xs">
									Date:{" "}
									{DateTime.fromJSDate(data.note.createdAt).toLocaleString(
										DateTime.DATETIME_MED,
									)}
								</p>
							</div>
							<ReadEditor content={data.note.content} />
						</div>
					</div>
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
