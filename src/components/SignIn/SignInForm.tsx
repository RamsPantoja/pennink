"use client";

import { signIn } from "next-auth/react";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Logo } from "../common/Logo";
import { Button } from "../common/Button";

type SignInFormProps = {
	callbackUrl?: string;
};

const SignInForm = ({ callbackUrl }: SignInFormProps) => {
	const onSignInWithGoogle = async () => {
		await signIn("google", { callbackUrl });
	};

	return (
		<Card className="max-w-72 bg-mochaBase p-0">
			<CardHeader>
				<CardTitle>
					<div className="flex flex-col items-center justify-center gap-4 text-mochaText">
						<Logo />
						<p className="text-base text-mochaText text-center">
							AI that speeds up learning and writing
						</p>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-xs text-mochaText">
					By creating an account, you agree to the{" "}
					<a
						className="text-blackLight underline"
						target="_blank"
						href="https://mitanda.xyz/tos"
					>
						Terms and Conditions
					</a>{" "}
					and our{" "}
					<a
						className="text-blackLight underline"
						target="_blank"
						href="https://mitanda.xyz/privacy_policy"
					>
						Privacy Policy
					</a>
					.
				</p>
			</CardContent>
			<CardFooter className="flex flex-col justify-center gap-2">
				<Button
					className=" w-full bg-mochaMantle text-mochaText"
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
					Sign in
				</Button>
				<Button
					className=" w-full bg-mochaMantle text-mochaText"
					onClick={onSignInWithGoogle}
					variant="outline"
					startIcon={
						<svg
							fill="none"
							height="24"
							viewBox="0 0 24 24"
							width="24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M21.5 12.058c0-5.28-4.253-9.558-9.5-9.558s-9.5 4.279-9.5 9.558c0 4.771 3.473 8.725 8.016 9.442v-6.68H8.104v-2.762h2.412V9.952c0-2.395 1.417-3.718 3.588-3.718 1.04 0 2.126.186 2.126.186v2.352h-1.198c-1.18 0-1.548.738-1.548 1.494v1.792h2.635l-.421 2.763h-2.214V21.5c4.543-.717 8.016-4.67 8.016-9.442z"
								fill="#0866ff"
							></path>
						</svg>
					}
				>
					Sign in
				</Button>
			</CardFooter>
		</Card>
	);
};

export default SignInForm;
