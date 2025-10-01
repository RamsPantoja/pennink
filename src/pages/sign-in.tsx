import SignInForm from "~/components/SignIn/SignInForm";
import type { GetServerSideProps } from "next";
import { type Session, getServerSession } from "next-auth";
import Head from "next/head";
import { authOptions } from "~/server/auth";

type SignInProps = {
	query: {
		callback_url: string;
	};
};

const SignIn = ({ query }: SignInProps) => {
	return (
		<div className="absolute flex h-full w-full">
			<Head>
				<title>Pennink - Sign in</title>
				<meta name="description" content="Sign in to your account." />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<div className="relative flex h-full w-full items-center justify-center">
				<div class="absolute top-0 z-[-2] h-screen w-screen bg-mocha-base bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
				<SignInForm callbackUrl={query.callback_url} />
			</div>
		</div>
	);
};

export const getServerSideProps = (async ({ req, res, query }) => {
	const session = await getServerSession(req, res, authOptions);

	if (session) {
		return {
			redirect: {
				destination: "/",
				permanent: false,
			},
		};
	}

	return { props: { session, query } };
}) satisfies GetServerSideProps<{ session: Session | null }>;

export default SignIn;
