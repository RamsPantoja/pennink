import { type InferGetServerSidePropsType, type GetServerSideProps } from "next";
import { type Session, getServerSession } from "next-auth";
import Head from "next/head";
import YourBuuddyContainer from "~/components/YourBuuddy";
import Dashboard from "~/layout/Dashboard";
import { authOptions } from "~/server/auth";

const YourBuuddy = ({ session }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
    return (
        <Dashboard session={session}>
            <>
                <Head>
                    <title>Tú buuddy</title>
                    <meta name="description" content="Find a partner to do anything!" />
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <YourBuuddyContainer
                    session={session}
                />
            </>
        </Dashboard>
    )
}

type ServerSideProps = {
    session: Session | null
}

export const getServerSideProps = (async ({ req, res }) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return {
            redirect: {
                destination: "/sign_in",
                permanent: false,
            },
        }
    }

    return { props: { session } };
}) satisfies GetServerSideProps<ServerSideProps>

export default YourBuuddy;