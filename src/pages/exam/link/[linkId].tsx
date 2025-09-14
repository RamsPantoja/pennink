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
import { useState } from "react";
import { Button } from "~/components/common/Button";
import { Badge } from "~/components/ui/badge";
import { getServerSession, type Session } from "next-auth";
import { notFound } from "next/navigation";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { authOptions } from "~/server/auth";
import {
	IdentificationDialogExam,
	type IdentificationValidationSchema,
} from "~/components/common/IdentificationDialogExam";
import { useTimer } from "~/hooks/use-timer";
import { toast } from "sonner";

const ShareExam = ({
	session,
	linkId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const { query } = useRouter();
	const [identificationData, setIdentificationData] =
		useState<IdentificationValidationSchema | null>(null);
	const [isStarted, setIsStarted] = useState<boolean>(false);

	const { timeLeft, onStart, isFinished, formatTime, isRunning } = useTimer({
		minutes: 1,
		onFinish: () => {
			toast.success("Time is up!");
		},
	});

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitSuccessful },
		reset,
	} = useForm();

	const {
		data: examData,
		isPending,
		isError,
	} = api.link.examByLinkId.useQuery({
		linkId,
	});

	const onSubmit = async (data: any) => {
		if (examData) {
			if (session) {
				console.log(data);
				// saveFormResponsesMutation({
				// 	formId: formData.formVersion.formId,
				// 	formLinkId: linkId,
				// 	formVersionId: formData.formVersionId,
				// 	username: session.user.name,
				// 	email: session.user.email,
				// 	userId: session.user.id,
				// 	answers: data,
				// });
				return;
			}

			if (identificationData) {
				console.log(data);
			} else {
				toast.error("Identification data is missing");
			}
		} else {
			toast.error("Form data is missing");
		}
	};

	const onInvalid = () => {
		toast("Some fields are required or invalid", {
			description:
				"Please fill in all required fields and ensure they are valid.",
		});
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
				<IdentificationDialogExam
					identificationData={identificationData}
					session={session}
					onSubmit={(data) => {
						setIdentificationData(data);
					}}
					isStarted={isRunning || isFinished}
					onStart={onStart}
				/>
				{!isPending && !isError && examData && (
					<div className="flex flex-col pl-4 pb-8 gap-4">
						<div className="flex flex-row items-center gap-4 min-w-32 w-full text-light-mocha-text dark:text-mocha-text">
							<Avatar className="h-7 w-7">
								<AvatarImage src={examData.examVersion.exam.user.image} />
								<AvatarFallback>
									{examData.examVersion.exam.user.name}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col w-full overflow-hidden">
								<p className="truncate text-sm">
									Created by{" "}
									<strong>{examData.examVersion.exam.user.name}</strong>
								</p>
								<p className="text-xs">
									{DateTime.fromJSDate(examData.createdAt).toLocaleString(
										DateTime.DATETIME_MED,
									)}
								</p>
							</div>
						</div>
						<div className="sticky top-0 z-10 bg-mocha-base/70 p-4 flex items-center clip backdrop-blur-xs rounded-b-xl gap-4 justify-between">
							<Badge>EXAM</Badge>
							<div
								className={`text-2xl font-mono font-bold ${
									isFinished
										? "text-red-500"
										: timeLeft <= 30
											? "text-orange-500"
											: "text-foreground"
								}`}
							>
								{formatTime(timeLeft)}
							</div>
						</div>
						<DynamicForm
							showAnswer={false}
							formData={{
								data: examData.examVersion,
								type: "EXAM",
							}}
							control={control}
							errors={errors}
						/>
						<div className="flex justify-end">
							<Button
								className="w-fit"
								disabled={isSubmitSuccessful}
								isPending={false}
								onClick={handleSubmit(onSubmit, onInvalid)}
							>
								Submit
							</Button>
						</div>
					</div>
				)}
				{!isPending && !isError && !examData && (
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

type ServerSideProps = {
	session: Session | null;
	linkId: string;
};

export const getServerSideProps = (async ({ req, res, query }) => {
	const session = await getServerSession(req, res, authOptions);
	const { linkId } = query;

	if (typeof linkId !== "string") {
		return notFound();
	}

	return { props: { session, linkId } };
}) satisfies GetServerSideProps<ServerSideProps>;

export default ShareExam;
