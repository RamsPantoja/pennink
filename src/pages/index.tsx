import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getServerSession, type Session } from "next-auth";
import Head from "next/head";
import { HomeComponent } from "~/components/Home";
import Dashboard from "~/layout/Dashboard";
import { authOptions } from "~/server/auth";

export default function Home({
	session,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
	return (
		<Dashboard session={session}>
			<>
				<Head>
					<title>Pennink - The writing editor for what's next</title>
					<meta name="description" content="Find a partner to do anything!" />
					<link rel="icon" href="/icon.ico" />
				</Head>
				<HomeComponent session={session} />
			</>
		</Dashboard>
	);
}

type ServerSideProps = {
	session: Session;
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
