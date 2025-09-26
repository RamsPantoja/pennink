import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { type Session, getServerSession } from "next-auth";
import Head from "next/head";
import { authOptions } from "~/server/auth";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/common/Button";
import {
	ArrowLongLeftIcon,
	AtSymbolIcon,
	DocumentTextIcon,
	ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import SubscriptionPlansModal from "~/components/SubscriptionPlanSelector";
import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { DateTime } from "luxon";
import { Fragment } from "react";
import { toast } from "sonner";
import { Separator } from "~/components/ui/separator";
import Link from "next/link";
import { UsageService } from "~/components/UsageService";

const supportOptions = [
	{
		title: "Email Support",
		description: "Get help via email",
		icon: AtSymbolIcon,
		link: "mailto:hola@pennink.xyz",
	},
	{
		title: "Privacy Policy",
		description: "Read our privacy policy",
		icon: ShieldExclamationIcon,
		link: "https://www.pennink.xyz/privacy-policy",
	},
	{
		title: "Terms of Service",
		description: "Read our terms of service",
		icon: DocumentTextIcon,
		link: "https://www.pennink.xyz/terms",
	},
];

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
		<div className="flex w-full justify-center p-4 bg-mocha-base h-screen">
			<Head>
				<title>Pennink - Settings</title>
				<meta
					name="description"
					content="Manage your account settings and subscription."
				/>
				<link rel="icon" href="/icon.png" />
			</Head>
			<div className="flex flex-col max-w-(--breakpoint-xl) w-full gap-10">
				<div className="w-full flex justify-between">
					<Button
						onClick={() => {
							const { callbackUrl } = router.query;
							if (typeof callbackUrl === "string") {
								router.push(callbackUrl);
							} else {
								router.push("/");
							}
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
				<Card className="flex gap-4 w-full justify-between flex-wrap">
					<div className="flex flex-row items-center gap-4 flex-wrap">
						<Avatar className="h-20 w-20">
							<AvatarImage src={session.user.image as string} />
							<AvatarFallback>You</AvatarFallback>
						</Avatar>
						<div className="flex flex-col overflow-hidden gap-1">
							<p className="truncate font-bold text-mocha-text">
								{session.user.name}
							</p>
							<p className="truncate text-xs text-mocha-text">
								{session.user.email}
							</p>
							<Badge variant="secondary">
								{session.user.subscription} plan
							</Badge>
						</div>
						{session.user.subscription === "FREE" && <UsageService />}
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
												<Badge>{subscription.status}</Badge>
											</div>
											<div className="text-right">
												{session.user.subscription === "PRO" && (
													<p className="font-medium">$12/month</p>
												)}
												{subscription.cancelAtPeriodEnd &&
													subscription.status === "active" && (
														<p className="font-semibold text-xs text-orange-400">
															Ends on{" "}
															{DateTime.fromSeconds(
																Number.parseInt(subscription.currentPeriodEnd),
															).toLocaleString(DateTime.DATE_FULL)}
														</p>
													)}
												{subscription.status === "active" &&
													!subscription.cancelAtPeriodEnd && (
														<p className="font-semibold text-muted-foreground text-xs">
															Renews on{" "}
															{DateTime.fromSeconds(
																Number.parseInt(subscription.currentPeriodEnd),
															).toLocaleString(DateTime.DATE_FULL)}
														</p>
													)}
												{subscription.status === "past_due" &&
													!subscription.cancelAtPeriodEnd && (
														<p className="font-semibold text-muted-foreground text-xs">
															Update payment method
														</p>
													)}
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
											Manage Billing
										</Button>
									</Card>
								)}
						</Fragment>
					)}
				</Card>
				<Separator />
				<Card className="flex flex-col gap-4">
					<h2 className="font-semibold">Support and Resources</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{supportOptions.map((option, index) => (
							<Link
								key={index}
								href={option.link}
								target="_blank"
								className="group"
							>
								<Card className="shadow-none transition-colors border">
									<CardHeader className="pb-2">
										<div className="flex items-center gap-3 mb-2">
											<option.icon className="h-5 w-5 text-mocha-text" />
											<CardTitle className="text-base font-medium text-mocha-text">
												{option.title}
											</CardTitle>
										</div>
										<CardDescription className="text-sm text-mocha-sub-text">
											{option.description}
										</CardDescription>
									</CardHeader>
								</Card>
							</Link>
						))}
					</div>
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
