import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { type Session, getServerSession } from "next-auth";
import Head from "next/head";
import { Workspace } from "~/components/Workspace";
import Dashboard from "~/layout/Dashboard";
import { authOptions } from "~/server/auth";

const WorkspacePage = ({
	session,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	return (
		<Dashboard session={session}>
			<>
				<Head>
					<title>AI & Learning - AI tutor for learning and teaching!</title>
					<meta name="description" content="Find a partner to do anything!" />
					<link rel="icon" href="/favicon.ico" />
				</Head>
				<Workspace />
			</>
		</Dashboard>
	);
};

type ServerSideProps = {
	session: Session | null;
};

export const getServerSideProps = (async ({ req, res }) => {
	const session = await getServerSession(req, res, authOptions);

	return { props: { session } };
}) satisfies GetServerSideProps<ServerSideProps>;

export default WorkspacePage;
