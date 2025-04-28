import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { type Session, getServerSession } from "next-auth";
import Head from "next/head";
import { authOptions } from "~/server/auth";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/common/Button";
import { ArrowLongLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import SubscriptionPlansModal from "~/components/SubscriptionPlanSelector";
import { api } from "~/utils/api";
import { Skeleton } from "~/components/ui/skeleton";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { DateTime } from "luxon";
import { Fragment } from "react";
import { toast } from "sonner";

const Settings = ({
	session,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const router = useRouter();

	const {
		data: subscription,
		isLoading: isSubscriptionLoading,
		isError: isSubscriptionError,
	} = api.subscription.getSubscription.useQuery(undefined, {
		enabled: session.user.subscription !== "FREE",
	});

	const {
		mutate: getCustomerPortalLink,
		isPending: isCustomerPortalLinkPending,
	} = api.payment.getCustomerPortalLink.useMutation({
		onSuccess: (data) => {
			router.push(data);
		},
		onError: (error) => {
			console.error("[CUSTOMER PORTAL LINK] Error:", error.message);
			toast.error("Failed to open customer portal");
		},
	});

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
				<Card className="flex gap-4 w-full justify-between flex-wrap">
					<div className="flex flex-row items-center gap-4">
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
					{session.user.subscription === "FREE" && (
						<SubscriptionPlansModal
							currentSubscription={session.user.subscription}
						/>
					)}
					{session.user.subscription !== "FREE" && (
						<Fragment>
							{isSubscriptionLoading && (
								<Card className="flex flex-col p-0">
									<div className="flex justify-between items-center mb-4 gap-4 flex-wrap animate-pulse">
										<div>
											<Skeleton className="h-6 w-32 mb-2" />
											<Skeleton className="h-5 w-24 mb-2" />
											<Skeleton className="h-5 w-20 rounded-full" />
										</div>
										<div className="flex items-end flex-col">
											<Skeleton className="h-5 w-20 mb-2" />
											<Skeleton className="h-5 w-32" />
										</div>
									</div>
									<Skeleton className="h-9 mb-2" />
								</Card>
							)}
							{!isSubscriptionLoading && isSubscriptionError && (
								<FeedbackMessage
									status="ERROR"
									message="Failed to load subscription details."
								/>
							)}
							{!isSubscriptionLoading &&
								!isSubscriptionError &&
								subscription && (
									<Card className="flex flex-col p-0">
										<div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
											<div>
												<h3 className="font-semibold">Current Plan</h3>
												<p className="text-sm text-muted-foreground">
													{session.user.subscription} Plan
												</p>
												<Badge variant="outline">{subscription.status}</Badge>
											</div>
											<div className="text-right">
												{session.user.subscription === "PRO" && (
													<p className="font-medium">$8/month</p>
												)}
												<p className="text-sm text-muted-foreground">
													Renews on{" "}
													{DateTime.fromSeconds(
														Number.parseInt(subscription.currentPeriodEnd),
													).toLocaleString(DateTime.DATE_FULL)}
												</p>
											</div>
										</div>
										<Button
											isPending={isCustomerPortalLinkPending}
											variant="outline"
											className="w-full sm:w-auto"
											onClick={() => {
												getCustomerPortalLink();
											}}
										>
											Manage your subscription
										</Button>
									</Card>
								)}
						</Fragment>
					)}
				</Card>
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
