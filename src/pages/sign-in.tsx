import SignInForm from "~/components/SignIn/SignInForm";
import type { GetServerSideProps } from "next";
import { type Session, getServerSession } from "next-auth";
import Head from "next/head";
import { authOptions } from "~/server/auth";
import { getPreferredLocale, type Locale } from "~/lib/utils";
import type { ParsedUrlQuery } from "node:querystring";

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
				<div className="absolute top-0 z-[-2] h-screen w-screen bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
				<SignInForm callbackUrl={query.callback_url} />
			</div>
		</div>
	);
};

type ServerSideProps = {
	locale: Locale;
	session: Session | null;
	query: ParsedUrlQuery;
	messages: any;
};

export const getServerSideProps = (async ({ req, res, query }) => {
	const session = await getServerSession(req, res, authOptions);
	const locale = getPreferredLocale(req.headers["accept-language"]);

	if (session) {
		return {
			redirect: {
				destination: "/",
				permanent: false,
			},
		};
	}

	const messages = (await import(`../i18n/messages/${locale}.json`)).default;

	return {
		props: {
			session,
			query,
			locale,
			messages,
		},
	};
}) satisfies GetServerSideProps<ServerSideProps>;

export default SignIn;
