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
					<title>Pennink - Workspace</title>
					<meta name="description" content="Find a partner to do anything!" />
					<link rel="icon" href="/icon.ico" />
				</Head>
				<Workspace session={session} />
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

	return { props: { session } };
}) satisfies GetServerSideProps<ServerSideProps>;

export default WorkspacePage;
