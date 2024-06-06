import Head from "next/head";
import Dashboard from "~/layout/Dashboard";

const Profile = () => {
    return (
        <Dashboard>
            <>
                <Head>
                    <title>Perfil</title>
                    <meta name="description" content="Find a partner to do anything!" />
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <main>
                    <p>Perfil</p>
                </main>
            </>
        </Dashboard>
    )
}

export default Profile;