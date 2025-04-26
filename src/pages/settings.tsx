import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { type Session, getServerSession } from "next-auth";
import Head from "next/head";
import Dashboard from "~/layout/Dashboard";
import { authOptions } from "~/server/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/common/Button";
import {
	ArrowLeftIcon,
	ArrowLongLeftIcon,
	AtSymbolIcon,
	CreditCardIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";

const Settings = ({
	session,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const router = useRouter();
	return (
		<div className="flex w-full justify-center p-4">
			<Head>
				<title>Settings</title>
				<meta name="description" content="Find a partner to do anything!" />
				<link rel="icon" href="/icon.ico" />
			</Head>
			<div className="flex flex-col max-w-screen-xl w-full gap-10">
				<div className="w-full flex justify-between">
					<Button
						onClick={() => {
							router.back();
						}}
						size="sm"
						variant="ghost"
						startIcon={<ArrowLongLeftIcon className="min-w-5 h-5" />}
					>
						Back
					</Button>
					<Button
						onClick={() => {
							signOut();
						}}
						size="sm"
						variant="ghost"
					>
						Sign out
					</Button>
				</div>

				<div>
					<h1 className="text-3xl font-bold">Settings</h1>
					<p className="text-muted-foreground">
						Manage your account settings and preferences.
					</p>
				</div>
				<div className="flex flex-row items-center gap-2">
					<Avatar className="h-20 w-20">
						<AvatarImage src={session.user.image as string} />
						<AvatarFallback>You</AvatarFallback>
					</Avatar>
					<div className="flex flex-col w-full overflow-hidden gap-1">
						<p className="truncate font-bold text-mochaText">
							{session.user.name}
						</p>
						<p className="truncate text-xs text-mochaText">
							{session.user.email}
						</p>
						<Badge>{session.user.subscription} plan</Badge>
					</div>
				</div>
				<div className="rounded-lg border p-4">
					<div className="flex justify-between items-center mb-4">
						<div>
							<h3 className="font-medium">Current Plan</h3>
							<p className="text-sm text-muted-foreground">Pro Plan</p>
						</div>
						<div className="text-right">
							<p className="font-medium">$19.99/month</p>
							<p className="text-sm text-muted-foreground">
								Renews on May 25, 2025
							</p>
						</div>
					</div>
					<Button variant="outline" className="w-full sm:w-auto">
						Change Plan
					</Button>
				</div>
			</div>
		</div>
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

export default Settings;
