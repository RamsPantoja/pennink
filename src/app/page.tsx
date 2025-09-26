import { redirect } from "next/navigation";
import { HomeComponent } from "~/components/Home";
import { getServerAuthSession } from "~/server/auth";

export default async function Home() {
	return <HomeComponent />;
}
