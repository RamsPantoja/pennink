import Head from "next/head";
import Dashboard from "~/layout/Dashboard";

const Balance = () => {
    return (
        <Dashboard>
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

export default Balance;