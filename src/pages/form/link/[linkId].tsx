import Head from "next/head";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Loading } from "~/components/common/Loading";
import { SharedContentLayout } from "~/layout/SharedContent";
import { api } from "~/utils/api";
import "@blocknote/mantine/style.css";
import { useRouter } from "next/router";
import { DateTime } from "luxon";

const ShareForm = () => {
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
					<title>Pennink - Form</title>
					<meta name="description" content="Form details" />
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

export default ShareForm;
