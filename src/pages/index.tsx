import Head from "next/head";
import Discover from "~/components/Discover";
import Dashboard from "~/layout/Dashboard";

export default function Home() {
  return (
    <Dashboard>
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