import { type GetServerSideProps, type InferGetServerSidePropsType } from "next";
import { getServerSession, type Session } from "next-auth";
import Head from "next/head";
import Discover from "~/components/Discover";
import Dashboard from "~/layout/Dashboard";
import { authOptions } from "~/server/auth";

export default function Home({ session }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <Dashboard session={session}>
      <>
        <Head>
          <title>Buuddy - Connect with great people!</title>
          <meta name="description" content="Find a partner to do anything!" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className="flex w-full h-full">
          <Discover />
        </main>
      </>
    </Dashboard>
  );
}

type ServerSideProps = {
  session: Session | null
}

export const getServerSideProps = (async ({ req, res }) => {
  const session = await getServerSession(req, res, authOptions);

  if (session && !session.user.onBoardingCompleted) {
    return {
        redirect: {
            destination: "/onboarding",
            permanent: false,
        },
    }
}

  return { props: { session } };
}) satisfies GetServerSideProps<ServerSideProps>

