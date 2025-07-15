import SignInForm from "~/components/SignIn/SignInForm";
import type { GetServerSideProps } from "next";
import { type Session, getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import Head from "next/head";

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
				<meta name="description" content="Find a partner to do anything!" />
				<link rel="icon" href="/icon.png" />
			</Head>
			<div className="relative flex h-full w-full items-center justify-center bg-mochaBase">
				<div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
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
