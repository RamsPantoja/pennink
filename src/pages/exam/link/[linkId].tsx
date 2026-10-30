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
import { useState } from "react";
import { Button } from "~/components/common/Button";
import { Badge } from "~/components/ui/badge";
import { getServerSession, type Session } from "next-auth";
import { notFound } from "next/navigation";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { authOptions } from "~/server/auth";
import { verifyLinkToken } from "~/server/api/services/link-token";
import {
	IdentificationDialogExam,
	type IdentificationValidationSchema,
} from "~/components/common/IdentificationDialogExam";
import { useTimer } from "~/hooks/use-timer";
import { sileo } from "sileo";
import { ExamFeedback } from "~/components/common/ExamFeedback";
import { useTranslations } from "next-intl";
import {
	LOCALE_COOKIE_NAME,
	getRequestLocale,
	type Locale,
} from "~/lib/utils";

const ShareExam = ({
	session,
	linkId,
	locale,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const t = useTranslations("ShareExam");
	const [identificationData, setIdentificationData] =
		useState<IdentificationValidationSchema | null>(null);
	const [displayResults, setDisplayResults] = useState<boolean>(false);
	const [examResultId, setExamResultId] = useState<string | null>(null);
	const [isExamStarted, setIsExamStarted] = useState<boolean>(false);

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitSuccessful },
	} = useForm();

	const [isGrading, setIsGrading] = useState<boolean>(false);

	const { mutateAsync: submitExam, isPending: submitExamPending } =
		api.form.submitExam.useMutation({
			onError: (error) => {
				sileo.error({ title: error.message });
			},
		});

	// Scores come from the server. The review is refetched once the AI has graded the open questions.
	const { data: review, refetch: refetchReview } = api.form.examReview.useQuery(
		{ examResultId: examResultId ?? "" },
		{ enabled: examResultId !== null },
	);

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
		if (!examData) {
			sileo.error({ title: t("toast.formDataMissing") });
			return;
		}

		const identity = session
			? {
					username: session.user.name,
					email: session.user.email,
					userId: session.user.id,
				}
			: identificationData
				? {
						username: identificationData.name,
						email: identificationData.email,
					}
				: null;

		if (!identity) {
			sileo.error({ title: t("toast.identificationDataMissing") });
			return;
		}

		setDisplayResults(true);

		try {
			const submission = await submitExam({
				examLinkId: linkId,
				answers: data,
				...identity,
			});

			setExamResultId(submission.examResultId);

			sileo.success({
				title: t("toast.submitSuccess"),
				description: t("toast.submitSuccessDescription"),
			});

			if (submission.hasPendingQuestions) {
				setIsGrading(true);

				try {
					const response = await fetch("/api/ai/exam-evaluation", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ examResultId: submission.examResultId }),
					});

					if (!response.ok) {
						throw new Error(`Grading failed with status ${response.status}`);
					}
				} catch (error) {
					sileo.error({ title: t("toast.errorOccurred") });
					console.error("An error occurred:", error);
				} finally {
					setIsGrading(false);
				}

				await refetchReview();
			}
		} catch {
			setDisplayResults(false);
		}
	};

	const onInvalid = () => {
		sileo.show({
			title: t("toast.invalidFieldsTitle"),
			description: t("toast.invalidFieldsDescription"),
		});
	};

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
					<title>Pennink - {t("title.exam")}</title>
					<meta name="description" content={t("meta.description")} />
					<link rel="icon" href="/favicon.svg" />
				</Head>
				<ExamFeedback
					open={displayResults}
					isGrading={isGrading}
					setOpen={setDisplayResults}
					review={review}
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
						<div className="flex flex-row items-center gap-4 min-w-32 w-full text-foreground dark:text-foreground">
							<Avatar className="h-7 w-7">
								<AvatarImage src={examData.examVersion.exam.user.image} />
								<AvatarFallback>
									{examData.examVersion.exam.user.name}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col w-full overflow-hidden">
								<p className="truncate text-sm">
									{t.rich("createdBy", {
										name: (chunks) => (
											<b>{examData.examVersion.exam.user.name}</b>
										),
									})}
								</p>
								<p className="text-xs">{examData.classroom.name}</p>
								<p className="text-xs">
									{DateTime.fromJSDate(examData.createdAt)
										.setLocale(locale)
										.toLocaleString(DateTime.DATETIME_MED)}
								</p>
							</div>
						</div>
						<div className="sticky top-0 z-10 bg-background/70 p-4 flex items-center clip backdrop-blur-xs rounded-b-xl gap-4 justify-between">
							<Badge>{t("badge.exam")}</Badge>
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
							{examResultId !== null && (
								<Button
									className="w-fit"
									variant="outline"
									onClick={() => {
										setDisplayResults(true);
									}}
								>
									{t("button.results")}
								</Button>
							)}
							<Button
								className="w-fit"
								disabled={isSubmitSuccessful}
								isPending={submitExamPending}
								onClick={() => {
									if (isRunning) {
										onPause();
									}
									handleSubmit(onSubmit, onInvalid)();
								}}
							>
								{t("button.submit")}
							</Button>
						</div>
					</div>
				)}
				{!isPending && !isError && !examData && (
					<FeedbackMessage
						status="INFORMATION"
						message={t("feedback.noExamFound")}
					/>
				)}
				{!isPending && isError && (
					<FeedbackMessage
						status="ERROR"
						message={t("feedback.errorFetchingExam")}
					/>
				)}
			</>
		</SharedContentLayout>
	);
};

type ServerSideProps = {
	session: Session | null;
	linkId: string;
	locale: Locale;
	messages: any;
};

export const getServerSideProps = (async ({ req, res, query }) => {
	const session = await getServerSession(req, res, authOptions);
	const { linkId } = query;
	const locale = getRequestLocale(
		req.cookies[LOCALE_COOKIE_NAME],
		req.headers["accept-language"],
	);
	const messages = (await import(`../../../i18n/messages/${locale}.json`))
		.default;

	if (typeof linkId !== "string") {
		return notFound();
	}

	const { t } = query;

	if (typeof t === "string" && !verifyLinkToken(t, linkId)) {
		return notFound();
	}

	return { props: { session, linkId, locale, messages } };
}) satisfies GetServerSideProps<ServerSideProps>;

export default ShareExam;
