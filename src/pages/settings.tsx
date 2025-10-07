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
import { getPreferredLocale, type Locale } from "~/lib/utils";
import { useTranslations } from "next-intl";

const Settings = ({
	session,
	locale,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const t = useTranslations("Settings");
	const router = useRouter();

	const supportOptions = [
		{
			title: t("supportOptions.email.title"),
			description: t("supportOptions.email.description"),
			icon: AtSymbolIcon,
			link: "mailto:hola@pennink.xyz",
		},
		{
			title: t("supportOptions.privacy.title"),
			description: t("supportOptions.privacy.description"),
			icon: ShieldExclamationIcon,
			link: "https://www.pennink.xyz/privacy-policy",
		},
		{
			title: t("supportOptions.terms.title"),
			description: t("supportOptions.terms.description"),
			icon: DocumentTextIcon,
			link: "https://www.pennink.xyz/terms",
		},
	];

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
			toast.error(t("toast.customerPortalError"));
		},
	});

	return (
		<div className="flex w-full justify-center p-4 bg-mocha-base h-screen">
			<Head>
				<title>{t("head.title")}</title>
				<meta name="description" content={t("head.description")} />
				<link rel="icon" href="/favicon.svg" />
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
						{t("buttons.back")}
					</Button>
					<Button
						onClick={() => {
							signOut();
						}}
						size="sm"
						variant="ghost"
					>
						{t("buttons.signOut")}
					</Button>
				</div>
				<Card className="flex gap-4 w-full justify-between flex-wrap">
					<div className="flex flex-row items-center gap-4 flex-wrap">
						<Avatar className="h-20 w-20">
							<AvatarImage src={session.user.image as string} />
							<AvatarFallback>{t("avatar.fallback")}</AvatarFallback>
						</Avatar>
						<div className="flex flex-col overflow-hidden gap-1">
							<p className="truncate font-bold text-mocha-text">
								{session.user.name}
							</p>
							<p className="truncate text-xs text-mocha-text">
								{session.user.email}
							</p>
							<Badge variant="secondary">
								{session.user.subscription} {t("planLabel")}
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
									message={t("errors.subscriptionLoad")}
								/>
							)}
							{!isSubscriptionLoading &&
								!isSubscriptionError &&
								subscription && (
									<Card className="flex flex-col p-0">
										<div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
											<div>
												<h3 className="font-semibold">
													{t("subscription.currentPlan")}
												</h3>
												<p className="text-sm text-muted-foreground">
													{session.user.subscription} {t("planLabel")}
												</p>
												<Badge>{subscription.status}</Badge>
											</div>
											<div className="text-right">
												{session.user.subscription === "PRO" && (
													<p className="font-medium">
														$12 USD/{t("subscription.period")}
													</p>
												)}
												{subscription.cancelAtPeriodEnd &&
													subscription.status === "active" && (
														<p className="font-semibold text-xs text-orange-400">
															{t("subscription.endsOn")}{" "}
															{DateTime.fromSeconds(
																Number.parseInt(subscription.currentPeriodEnd),
															)
																.setLocale(locale)
																.toLocaleString(DateTime.DATE_FULL)}
														</p>
													)}
												{subscription.status === "active" &&
													!subscription.cancelAtPeriodEnd && (
														<p className="font-semibold text-muted-foreground text-xs">
															{t("subscription.renewsOn")}{" "}
															{DateTime.fromSeconds(
																Number.parseInt(subscription.currentPeriodEnd),
															)
																.setLocale(locale)
																.toLocaleString(DateTime.DATE_FULL)}
														</p>
													)}
												{subscription.status === "past_due" &&
													!subscription.cancelAtPeriodEnd && (
														<p className="font-semibold text-muted-foreground text-xs">
															{t("subscription.updatePayment")}
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
											{t("buttons.manageBilling")}
										</Button>
									</Card>
								)}
						</Fragment>
					)}
				</Card>
				<Separator />
				<Card className="flex flex-col gap-4">
					<h2 className="font-semibold">{t("support.title")}</h2>
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
	locale: Locale;
	session: Session | null;
	messages: any;
};

export const getServerSideProps = (async ({ req, res }) => {
	const session = await getServerSession(req, res, authOptions);
	const locale = getPreferredLocale(req.headers["accept-language"]);
	if (!session) {
		return {
			redirect: {
				destination: "/sign-in",
				permanent: false,
			},
		};
	}
	const messages = (await import(`../i18n/messages/${locale}.json`)).default;
	return { props: { session, locale, messages } };
}) satisfies GetServerSideProps<ServerSideProps>;

export default Settings;
