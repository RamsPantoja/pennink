import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "./Button";
import { Separator } from "../ui/separator";
import { signIn } from "next-auth/react";
import type { Session } from "next-auth";
import InputFeedbackMessage from "./InputFeedbackMessage";

const identificationValidationSchema = z.object({
	email: z.string({ required_error: "Email is required" }).email(),
	name: z
		.string({ required_error: "Name is required" })
		.min(2, "Name must be at least 2 characters long"),
});

export type IdentificationValidationSchema = z.infer<
	typeof identificationValidationSchema
>;

type IdentificationDialogFormProps = {
	onSubmit: (data: IdentificationValidationSchema) => void;
	session: Session | null;
	identificationData: IdentificationValidationSchema | null;
};

export const IdentificationDialogForm = ({
	onSubmit,
	session,
	identificationData,
}: IdentificationDialogFormProps) => {
	const {
		handleSubmit,
		formState: { errors },
		register,
	} = useForm<IdentificationValidationSchema>({
		defaultValues: {
			email: "",
			name: "",
		},
		resolver: zodResolver(identificationValidationSchema),
	});

	const onSignInWithGoogle = async () => {
		await signIn("google");
	};

	const onSubmitIdentificationData = async (
		data: IdentificationValidationSchema,
	) => {
		console.log(data);
		onSubmit(data);
	};

	console.log(errors);

	return (
		<Dialog open={identificationData === null && session === null}>
			<form>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Identify yourself</DialogTitle>
						<DialogDescription>
							Before you can proceed, please provide your name and email.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4">
						<div className="grid gap-3">
							<Label htmlFor="name">Name</Label>
							<Input id="name" {...register("name")} />
							{errors.name && (
								<InputFeedbackMessage
									status="ERROR"
									message={errors.name.message}
								/>
							)}
						</div>
						<div className="grid gap-3">
							<Label htmlFor="email">Email</Label>
							<Input id="email" {...register("email")} type="email" />
							{errors.email && (
								<InputFeedbackMessage
									status="ERROR"
									message={errors.email.message}
								/>
							)}
							<p className="text-xs text-mocha-sub-text">
								Your email will be used to send you updates about your form.
							</p>
						</div>
					</div>
					<DialogFooter>
						<Button
							onClick={handleSubmit(onSubmitIdentificationData)}
							className="w-full"
							type="button"
						>
							Submit
						</Button>
					</DialogFooter>
					<Separator />
					<Button
						onClick={onSignInWithGoogle}
						variant="outline"
						startIcon={
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20px"
								height="20px"
								viewBox="0 0 20 20"
								fill="none"
							>
								<g clipPath="url(#clip0_46_9139)">
									<path
										d="M10 8.18188V12.0546H15.3818C15.1455 13.3001 14.4363 14.3547 13.3727 15.0638L16.6182 17.582C18.5091 15.8366 19.6 13.2729 19.6 10.2275C19.6 9.51837 19.5364 8.83648 19.4182 8.18199L10 8.18188Z"
										fill="#1976D2"
									></path>
									<path
										d="M4.39569 11.9033L3.66372 12.4636L1.07275 14.4818C2.71821 17.7454 6.09071 20 9.99979 20C12.6997 20 14.9634 19.1091 16.618 17.5819L13.3725 15.0636C12.4816 15.6636 11.3452 16.0273 9.99979 16.0273C7.39979 16.0273 5.19075 14.2728 4.39978 11.9091L4.39569 11.9033Z"
										fill="#4CAF50"
									></path>
									<path
										d="M1.07278 5.51831C0.390993 6.86372 0.00012207 8.38193 0.00012207 10.0001C0.00012207 11.6183 0.390993 13.1365 1.07278 14.4819C1.07278 14.4909 4.40013 11.9 4.40013 11.9C4.20013 11.3 4.08191 10.6637 4.08191 9.99999C4.08191 9.33626 4.20013 8.69993 4.40013 8.09993L1.07278 5.51831Z"
										fill="#FFC107"
									></path>
									<path
										d="M10 3.98184C11.4728 3.98184 12.7818 4.49092 13.8273 5.47276L16.6909 2.60914C14.9545 0.990977 12.7 0 10 0C6.09091 0 2.71821 2.24546 1.07275 5.51822L4.4 8.10005C5.19087 5.73638 7.4 3.98184 10 3.98184Z"
										fill="#FF3D00"
									></path>
								</g>
								<defs>
									<clipPath id="clip0_46_9139">
										<rect width="19.6" height="20" fill="white"></rect>
									</clipPath>
								</defs>
							</svg>
						}
					>
						Sign in with Google
					</Button>
					<p className="text-xs text-mocha-text text-center">
						By Creating an account or Sign in, you agree to the{" "}
						<a
							className="text-blackLight underline"
							target="_blank"
							href="https://www.pennink.xyz/terms"
						>
							Terms
						</a>{" "}
						and our{" "}
						<a
							className="text-blackLight underline"
							target="_blank"
							href="https://www.pennink.xyz/privacy-policy"
						>
							Privacy Policy
						</a>
						.
					</p>
				</DialogContent>
			</form>
		</Dialog>
	);
};
