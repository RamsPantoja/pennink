import { useCreateBlockNote } from "@blocknote/react";
import Head from "next/head";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Loading } from "~/components/common/Loading";
import { SharedContentLayout } from "~/layout/SharedContent";
import { api } from "~/trpc/react";
import {
	BlockNoteView,
	darkDefaultTheme,
	lightDefaultTheme,
} from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import type { Block } from "@blocknote/core";
import { useSharedTheme } from "~/hooks/useSharedTheme";
import { useRouter } from "next/router";
import { DateTime } from "luxon";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Fragment } from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import {
	LOCALE_COOKIE_NAME,
	getRequestLocale,
	type Locale,
} from "~/lib/utils";
import { normalizeBlockNoteContent } from "~/lib/blocknote";

const SharedNotes = ({
	linkId,
	locale,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const t = useTranslations("SharedNotes");
	const { data, isPending, isError } = api.link.noteByLinkId.useQuery({
		linkId: linkId,
	});

	return (
		<SharedContentLayout>
			<>
				<Head>
					<title>Pennink - {t("title.notes")}</title>
					<meta name="description" content={t("meta.description")} />
					<link rel="icon" href="/favicon.svg" />
				</Head>
				{isPending && <Loading />}
				{!isPending && !isError && data && (
					<Fragment>
						<div className="flex px-14 flex-col">
							<div className="flex flex-row items-center gap-4 min-w-32 w-full text-foreground dark:text-foreground">
								<Avatar className="h-7 w-7">
									<AvatarImage src={data.note.user.image} />
									<AvatarFallback>{data.note.user.name}</AvatarFallback>
								</Avatar>
								<div className="flex flex-col w-full overflow-hidden">
									<p className="truncate text-sm">
										{t.rich("createdBy", {
											name: (chunks) => <b>{data.note.user.name}</b>,
										})}
									</p>
									<p className="text-xs">
										{DateTime.fromJSDate(data.createdAt)
											.setLocale(locale)
											.toLocaleString(DateTime.DATETIME_MED)}
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
						message={t("feedback.noSharedNotes")}
					/>
				)}
				{!isPending && isError && (
					<FeedbackMessage
						status="ERROR"
						message={t("feedback.errorFetching")}
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
	const t = useTranslations("SharedNotes");
	const editor = useCreateBlockNote({
		defaultStyles: false,
		initialContent: normalizeBlockNoteContent(content),
	});

	const theme = useSharedTheme();

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

type ServerSideProps = {
	linkId: string;
	messages: any;
	locale: Locale;
};

export const getServerSideProps = (async ({ req, res, query }) => {
	const locale = getRequestLocale(
		req.cookies[LOCALE_COOKIE_NAME],
		req.headers["accept-language"],
	);
	const messages = (await import(`../../i18n/messages/${locale}.json`)).default;
	const { linkId } = query;

	if (typeof linkId !== "string") {
		return notFound();
	}

	return { props: { linkId, messages, locale } };
}) satisfies GetServerSideProps<ServerSideProps>;

export default SharedNotes;
