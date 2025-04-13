import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { type Session, getServerSession } from "next-auth";
import Head from "next/head";
import Dashboard from "~/layout/Dashboard";
import { authOptions } from "~/server/auth";

const Settings = ({
	session,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	return (
		<Dashboard session={session}>
			<>
				<Head>
					<title>Settings</title>
					<meta name="description" content="Find a partner to do anything!" />
					<link rel="icon" href="/icon.ico" />
				</Head>
				<p>Settings</p>
			</>
		</Dashboard>
	);
};

type ServerSideProps = {
	session: Session | null;
};

export const getServerSideProps = (async ({ req, res }) => {
	const session = await getServerSession(req, res, authOptions);

	if (!session) {
		return {
			redirect: {
				destination: "/sign-in",
				permanent: false,
			},
		};
	}

	if (!session.user.onBoardingCompleted) {
		return {
			redirect: {
				destination: "/onboarding",
				permanent: false,
			},
		};
	}

	return { props: { session } };
}) satisfies GetServerSideProps<ServerSideProps>;

export default Settings;
