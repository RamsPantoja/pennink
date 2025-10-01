import Head from "next/head";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Loading } from "~/components/common/Loading";
import { SharedContentLayout } from "~/layout/SharedContent";
import { api } from "~/trpc/react";
import "@blocknote/mantine/style.css";
import { DateTime } from "luxon";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { DynamicForm } from "~/components/DynamicForm";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
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
import { ExamFeedback } from "~/components/common/ExamFeedback";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolCallPart } from "ai-v5";
import type { EvaluationDetailsTool } from "~/lib/aiTools/getEvaluationDetails";

const ShareExam = ({
	session,
	linkId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const [identificationData, setIdentificationData] =
		useState<IdentificationValidationSchema | null>(null);
	const [displayResults, setDisplayResults] = useState<boolean>(false);
	const [toolCallEvaluationDetails, setToolCallEvaluationDetails] =
		useState<ToolCallPart | null>(null);
	const [isExamStarted, setIsExamStarted] = useState<boolean>(false);

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitSuccessful },
	} = useForm();

	const { messages, sendMessage, status } = useChat({
		experimental_throttle: 100,
		transport: new DefaultChatTransport({
			api: "/api/ai/exam-evaluation",
		}),
		onToolCall: ({ toolCall }) => {
			// Check if it's a dynamic tool first for proper type narrowing
			if (toolCall.dynamic) {
				return;
			}

			if (toolCall.toolName === "getEvaluationDetails") {
				setToolCallEvaluationDetails({ ...toolCall, type: "tool-call" });
			}
		},
		onError: (error) => {
			console.error("An error occurred:", error);
		},
	});

	const { mutate: saveExamResultsMutation, isPending: saveExamResultsPending } =
		api.form.saveExamResults.useMutation({
			onSuccess: async () => {
				toast.success("Form submitted successfully", {
					description: "Thank you for your submission!",
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const {
		data: examData,
		isPending,
		isError,
	} = api.link.examByLinkId.useQuery({
		linkId,
	});

	const { timeLeft, onStart, isFinished, formatTime, isRunning, onPause } =
		useTimer({
			minutes: examData?.examVersion.exam.duration ?? 0,
			onFinish: () => {
				handleSubmit(onSubmit, onInvalid)();
			},
		});

	const onSubmit = async (data: any) => {
		if (examData) {
			setDisplayResults(true);

			const questionsWithCorrectAnswers =
				examData.examVersion.questionsToExamVersions.map((item) => ({
					key: item.question.key,
					answer: item.question.answer,
					type: item.question.type,
					label: item.question.label,
					description: item.question.description,
					options: item.question.questionOptions.map((option) => ({
						label: option.label,
						value: option.value,
					})),
				}));

			await sendMessage(undefined, {
				body: {
					context: {
						messages: [],
					},
					prompt: `Evaluate the following exam and extract the score and feedback: Questions: ${JSON.stringify(
						questionsWithCorrectAnswers,
					)} and User Answers: ${JSON.stringify(data)}`,
				},
			});
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

	useEffect(() => {
		if (toolCallEvaluationDetails && examData) {
			const input =
				toolCallEvaluationDetails.input as EvaluationDetailsTool["input"];
			handleSubmit((data) => {
				if (session) {
					saveExamResultsMutation({
						examId: examData.examVersion.examId,
						examLinkId: linkId,
						examVersionId: examData.examVersionId,
						username: session.user.name,
						email: session.user.email,
						userId: session.user.id,
						answers: data,
						score: input.score,
						feedback: input.feedback,
					});
					return;
				}

				if (identificationData) {
					saveExamResultsMutation({
						examId: examData.examVersion.examId,
						examLinkId: linkId,
						examVersionId: examData.examVersionId,
						username: identificationData.name,
						email: identificationData.email,
						answers: data,
						score: input.score,
						feedback: input.feedback,
					});
				} else {
					toast.error("Identification data is missing");
				}
			})();
		}
	}, [
		toolCallEvaluationDetails,
		examData,
		handleSubmit,
		identificationData,
		linkId,
		saveExamResultsMutation,
		session,
	]);

	const handleOnStartExam = () => {
		if (
			examData?.examVersion.exam.duration &&
			examData?.examVersion.exam.duration > 0
		) {
			onStart();
			setIsExamStarted(true);
		} else {
			setIsExamStarted(true);
		}
	};

	return (
		<SharedContentLayout>
			<>
				<Head>
					<title>Pennink - Exam</title>
					<meta name="description" content="Exam details" />
					<link rel="icon" href="/favicon.svg" />
				</Head>
				<ExamFeedback
					messages={messages}
					open={displayResults}
					status={status}
					setOpen={setDisplayResults}
				/>
				{isPending && <Loading />}
				{!isPending && !isError && examData && (
					<div className="flex flex-col pl-4 pb-8 gap-4">
						<IdentificationDialogExam
							identificationData={identificationData}
							session={session}
							onSubmit={(data) => {
								setIdentificationData(data);
							}}
							isStarted={isExamStarted}
							onStart={handleOnStartExam}
							duration={examData.examVersion.exam.duration}
						/>
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
							{examData?.examVersion.exam.duration && (
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
							)}
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
						<div className="flex justify-end gap-4">
							{isSubmitSuccessful && messages.length > 0 && (
								<Button
									className="w-fit"
									variant="outline"
									onClick={() => {
										setDisplayResults(true);
									}}
								>
									Results
								</Button>
							)}
							<Button
								className="w-fit"
								disabled={isSubmitSuccessful}
								isPending={saveExamResultsPending}
								onClick={() => {
									if (isRunning) {
										onPause();
									}
									handleSubmit(onSubmit, onInvalid)();
								}}
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
