import { type InferGetServerSidePropsType, type GetServerSideProps } from "next";
import { type Session, getServerSession } from "next-auth";
import Head from "next/head";
import Dashboard from "~/layout/Dashboard";
import { authOptions } from "~/server/auth";

const Balance = ({ session }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
    return (
        <Dashboard session={session}>
            <>
                <Head>
                    <title>Balance</title>
                    <meta name="description" content="Find a partner to do anything!" />
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <main>
                    <p>Balance</p>
                </main>
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

export default Balance;