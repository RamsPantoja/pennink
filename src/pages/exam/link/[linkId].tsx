import Head from "next/head";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Loading } from "~/components/common/Loading";
import { SharedContentLayout } from "~/layout/SharedContent";
import { api } from "~/utils/api";
import "@blocknote/mantine/style.css";
import { useRouter } from "next/router";
import { DateTime } from "luxon";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { DynamicForm } from "~/components/DynamicForm";
import { useForm } from "react-hook-form";
import { Fragment } from "react";
import { Button } from "~/components/common/Button";
import { Badge } from "~/components/ui/badge";

const ShareExam = () => {
	const { query } = useRouter();

	const {
		control,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm();

	const { data, isPending, isError } = api.link.examByLinkId.useQuery(
		{
			linkId: typeof query.linkId === "string" ? query.linkId : "",
		},
		{
			enabled: query.linkId !== undefined,
		},
	);

	const onSubmit = async (data: any) => {
		console.log(data);
	};

	return (
		<SharedContentLayout>
			<>
				<Head>
					<title>Pennink - Exam</title>
					<meta name="description" content="Exam details" />
					<link rel="icon" href="/icon.png" />
				</Head>
				{isPending && <Loading />}
				{!isPending && !isError && data && (
					<div className="flex flex-col pl-4 pb-8 gap-4">
						<div className="flex flex-row items-center gap-4 min-w-32 w-full text-light-mocha-text dark:text-mocha-text">
							<Avatar className="h-7 w-7">
								<AvatarImage src={data.examVersion.exam.user.image} />
								<AvatarFallback>
									{data.examVersion.exam.user.name}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col w-full overflow-hidden">
								<p className="truncate text-sm">
									Created by <strong>{data.examVersion.exam.user.name}</strong>
								</p>
								<p className="text-xs">
									{DateTime.fromJSDate(data.createdAt).toLocaleString(
										DateTime.DATETIME_MED,
									)}
								</p>
							</div>
						</div>
						<div className="sticky top-4">
							<Badge>EXAM</Badge>
						</div>
						<DynamicForm
							showAnswer={false}
							formData={{
								data: data.examVersion,
								type: "EXAM",
							}}
							control={control}
							errors={errors}
						/>
						<div className="flex justify-end">
							<Button className="w-fit" onClick={handleSubmit(onSubmit)}>
								Submit
							</Button>
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

export default ShareExam;
