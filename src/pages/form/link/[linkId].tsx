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

const ShareForm = ({
	session,
	linkId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
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
			toast.success("Form submitted successfully", {
				description: "Thank you for your submission!",
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
					<title>Pennink - Form</title>
					<meta name="description" content="Form details" />
					<link rel="icon" href="/icon.png" />
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
						<div className="flex flex-row items-center gap-4 min-w-32 w-full text-light-mocha-text dark:text-mocha-text">
							<Avatar className="h-7 w-7">
								<AvatarImage src={formData.formVersion.form.user.image} />
								<AvatarFallback>
									{formData.formVersion.form.user.name}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col w-full overflow-hidden">
								<p className="truncate text-sm">
									Created by{" "}
									<strong>{formData.formVersion.form.user.name}</strong>
								</p>
								<p className="text-xs">
									{DateTime.fromJSDate(formData.createdAt).toLocaleString(
										DateTime.DATETIME_MED,
									)}
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
								Submit
							</Button>
						</div>
					</div>
				)}
				{!isPending && !isError && !formData && (
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

export default ShareForm;
