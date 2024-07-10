import { type GetServerSideProps, type InferGetServerSidePropsType } from "next";
import { getServerSession, type Session } from "next-auth";
import Head from "next/head";
import BuuddyOverview from "~/components/Discover/BuuddyOverview";
import Dashboard from "~/layout/Dashboard";
import { authOptions } from "~/server/auth";

const BuuddyPage = ({ session }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
    return (
        <Dashboard session={session}>
            <>
                <Head>
                    <title>Tu buuddy</title>
                    <meta name="description" content="Find a partner to do anything!" />
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <BuuddyOverview />
            </>
        </Dashboard>
    )
}

type ServerSideProps = {
    session: Session | null
}

export const getServerSideProps = (async ({ req, res }) => {
    const session = await getServerSession(req, res, authOptions);

    return { props: { session } };
}) satisfies GetServerSideProps<ServerSideProps>


export default BuuddyPage;