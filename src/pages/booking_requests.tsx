import {
  type GetServerSideProps,
  type InferGetServerSidePropsType,
} from "next";
import { getServerSession, type Session } from "next-auth";
import Head from "next/head";
import BookingRequestManager from "~/components/BookingRequestManager";
import Dashboard from "~/layout/Dashboard";
import { authOptions } from "~/server/auth";

const BookingRequests = (
  { session }: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  return (
    <Dashboard session={session}>
      <>
        <Head>
          <title>Booking Requests</title>
          <meta name="description" content="Find a partner to do anything!" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <BookingRequestManager session={session} />
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

export default BookingRequests;
