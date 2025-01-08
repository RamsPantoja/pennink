import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getServerSession, type Session } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { BookingRequest } from "~/components/BookingRequestManager/BookingRequest";
import Dashboard from "~/layout/Dashboard";
import { authOptions } from "~/server/auth";

const BookingRequestPage = ({
	session,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const router = useRouter();
	const { id } = router.query;

	return (
		<Dashboard session={session}>
			<>
				<Head>
					<title>Booking Request</title>
					<meta name="description" content="Find a partner to do anything!" />
					<link rel="icon" href="/favicon.ico" />
				</Head>
				<BookingRequest id={id as string} />
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

export default BookingRequestPage;
