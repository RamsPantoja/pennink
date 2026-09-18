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
import { toast } from "sonner";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "~/server/auth";
import { notFound } from "next/navigation";
import {
	IdentificationDialogForm,
	type IdentificationValidationSchema,
} from "~/components/common/IdentificationDialogForm";
import { getPreferredLocale, type Locale } from "~/lib/utils";
import { useTranslations } from "next-intl";

const ShareForm = ({
	session,
	linkId,
	locale,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const t = useTranslations("ShareForm");
	const [identificationData, setIdentificationData] =
		useState<IdentificationValidationSchema | null>(null);

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitSuccessful },
	} = useForm();

	const {
		mutate: saveFormResponsesMutation,
		isPending: saveFormResponsesPending,
	} = api.form.saveFormResponses.useMutation({
		onSuccess: async () => {
			toast.success(t("toast.success"), {
				description: t("toast.successDescription"),
			});
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const {
		data: formData,
		isPending,
		isError,
	} = api.link.formByLinkId.useQuery({
		linkId,
	});

	const onSubmit = async (data: any) => {
		if (formData) {
			if (session) {
				saveFormResponsesMutation({
					formId: formData.formVersion.formId,
					formLinkId: linkId,
					formVersionId: formData.formVersionId,
					username: session.user.name,
					email: session.user.email,
					userId: session.user.id,
					answers: data,
				});
				return;
			}

			if (identificationData) {
				saveFormResponsesMutation({
					formId: formData.formVersion.formId,
					formLinkId: linkId,
					formVersionId: formData.formVersionId,
					username: identificationData.name,
					email: identificationData.email,
					answers: data,
				});
			} else {
				toast.error(t("toast.identificationMissing"));
			}
		} else {
			toast.error(t("toast.formDataMissing"));
		}
	};

	const onInvalid = () => {
		toast(t("toast.invalidFields"), {
			description: t("toast.invalidFieldsDescription"),
		});
	};

	return (
		<SharedContentLayout>
			<>
				<Head>
					<title>Pennink - {t("head.title")}</title>
					<meta name="description" content={t("head.description")} />
					<link rel="icon" href="/favicon.svg" />
				</Head>
				{isPending && <Loading />}
				<IdentificationDialogForm
					identificationData={identificationData}
					session={session}
					onSubmit={(data) => {
						setIdentificationData(data);
					}}
				/>
				{!isPending && !isError && formData && (
					<div className="flex flex-col pl-4 pb-8 gap-4">
						<div className="flex flex-row items-center gap-4 min-w-32 w-full text-foreground dark:text-foreground">
							<Avatar className="h-7 w-7">
								<AvatarImage src={formData.formVersion.form.user.image} />
								<AvatarFallback>
									{formData.formVersion.form.user.name}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col w-full overflow-hidden">
								<p className="truncate text-sm">
									{t.rich("createdBy", {
										name: (chunks) => (
											<b>{formData.formVersion.form.user.name}</b>
										),
									})}
								</p>
								<p className="text-xs">
									{DateTime.fromJSDate(formData.createdAt)
										.setLocale(locale)
										.toLocaleString(DateTime.DATETIME_MED)}
								</p>
							</div>
						</div>
						<DynamicForm
							showAnswer={false}
							formData={{
								data: formData.formVersion,
								type: "BASIC",
							}}
							control={control}
							errors={errors}
						/>
						<div className="flex justify-end">
							<Button
								className="w-fit"
								disabled={isSubmitSuccessful}
								isPending={saveFormResponsesPending}
								onClick={handleSubmit(onSubmit, onInvalid)}
							>
								{t("button.submit")}
							</Button>
						</div>
					</div>
				)}
				{!isPending && !isError && !formData && (
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

type ServerSideProps = {
	session: Session | null;
	linkId: string;
	locale: Locale;
	messages: any;
};

export const getServerSideProps = (async ({ req, res, query }) => {
	const session = await getServerSession(req, res, authOptions);
	const { linkId } = query;
	const locale = getPreferredLocale(req.headers["accept-language"]);
	const messages = (await import(`../../../i18n/messages/${locale}.json`))
		.default;

	if (typeof linkId !== "string") {
		return notFound();
	}

	return { props: { session, linkId, locale, messages } };
}) satisfies GetServerSideProps<ServerSideProps>;

export default ShareForm;
