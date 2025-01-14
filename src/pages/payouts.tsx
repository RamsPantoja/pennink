import {
	type InferGetServerSidePropsType,
	type GetServerSideProps,
} from "next";
import { type Session, getServerSession } from "next-auth";
import Head from "next/head";
import ConnectPayment from "~/components/YourBuuddy/ConnectPayment";
import Dashboard from "~/layout/Dashboard";
import { authOptions } from "~/server/auth";

const Payouts = ({
	session,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	return (
		<Dashboard session={session}>
			<>
				<Head>
					<title>Payouts</title>
					<meta name="description" content="Find a partner to do anything!" />
					<link rel="icon" href="/favicon.ico" />
				</Head>
				<ConnectPayment />
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
				destination: "/sign_in",
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

export default Payouts;
