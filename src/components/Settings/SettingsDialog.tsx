"use client";
import {
	ArrowRightStartOnRectangleIcon,
	AtSymbolIcon,
	CreditCardIcon,
	DocumentTextIcon,
	LanguageIcon,
	LifebuoyIcon,
	ShieldExclamationIcon,
	UserCircleIcon,
} from "@heroicons/react/24/outline";
import { DateTime } from "luxon";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sileo } from "sileo";
import SubscriptionPlansModal from "~/components/SubscriptionPlanSelector";
import { UsageService } from "~/components/UsageService";
import { Button } from "~/components/common/Button";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { LOCALE_COOKIE_NAME, cn, isLocale } from "~/lib/utils";
import { api } from "~/trpc/react";

type SettingsDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	session: Session;
};

type SectionId = "account" | "billing" | "language" | "support";

export function SettingsDialog({
	open,
	onOpenChange,
	session,
}: SettingsDialogProps) {
	const t = useTranslations("Settings");
	const locale = useLocale();
	const router = useRouter();
	const [section, setSection] = useState<SectionId>("account");

	const navGroups: {
		label: string;
		items: { id: SectionId; label: string; icon: typeof UserCircleIcon }[];
	}[] = [
		{
			label: t("nav.preferences"),
			items: [
				{ id: "account", label: t("nav.account"), icon: UserCircleIcon },
				{ id: "billing", label: t("nav.billing"), icon: CreditCardIcon },
				{ id: "language", label: t("nav.language"), icon: LanguageIcon },
			],
		},
		{
			label: t("nav.help"),
			items: [{ id: "support", label: t("nav.support"), icon: LifebuoyIcon }],
		},
	];

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
		enabled: open && session.user.subscription !== "FREE",
	});

	const { mutate: updateLocale } = api.user.updateLocale.useMutation();

	const {
		mutate: getCustomerPortalLink,
		isPending: isCustomerPortalLinkPending,
	} = api.payment.getCustomerPortalLink.useMutation({
		onSuccess: (data) => {
			router.push(data);
		},
		onError: (error) => {
			console.error("[CUSTOMER PORTAL LINK] Error:", error.message);
			sileo.error({ title: t("toast.customerPortalError") });
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-4xl h-[80vh] max-h-160 p-0 gap-0 grid-cols-[11rem_1fr] overflow-hidden">
				<DialogHeader className="sr-only">
					<DialogTitle>{t("dialogTitle")}</DialogTitle>
					<DialogDescription>{t("head.description")}</DialogDescription>
				</DialogHeader>

				<aside className="flex flex-col gap-1 border-r p-3 overflow-y-auto">
					<div className="flex items-center gap-2 px-2 pb-3 text-sm font-semibold">
						{t("dialogTitle")}
					</div>
					{navGroups.map((group) => (
						<div key={group.label} className="flex flex-col gap-1">
							<p className="px-2 pt-3 pb-1 text-xs text-muted-foreground">
								{group.label}
							</p>
							{group.items.map((item) => (
								<button
									key={item.id}
									type="button"
									onClick={() => setSection(item.id)}
									className={cn(
										"flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted",
										section === item.id && "bg-muted font-medium",
									)}
								>
									<item.icon className="h-4 w-4 shrink-0" />
									{item.label}
								</button>
							))}
						</div>
					))}
					<div className="mt-auto pt-3">
						<button
							type="button"
							onClick={() => signOut()}
							className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
						>
							<ArrowRightStartOnRectangleIcon className="h-4 w-4 shrink-0" />
							{t("buttons.signOut")}
						</button>
					</div>
				</aside>

				<main className="flex flex-col gap-6 p-6 overflow-y-auto">
					{section === "account" && (
						<section className="flex flex-col gap-6">
							<h2 className="text-lg font-semibold">{t("nav.account")}</h2>
							<div className="flex flex-row items-center gap-4">
								<Avatar className="h-16 w-16">
									<AvatarImage src={session.user.image as string} />
									<AvatarFallback>{t("avatar.fallback")}</AvatarFallback>
								</Avatar>
								<div className="flex min-w-0 flex-col gap-1">
									<p className="truncate font-bold text-foreground">
										{session.user.name}
									</p>
									<p className="truncate text-xs text-muted-foreground">
										{session.user.email}
									</p>
									<Badge variant="secondary" className="w-fit">
										{session.user.subscription} {t("planLabel")}
									</Badge>
								</div>
							</div>
						</section>
					)}

					{section === "billing" && (
						<section className="flex flex-col gap-6">
							<h2 className="text-lg font-semibold">{t("nav.billing")}</h2>
							{session.user.subscription === "FREE" && (
								<div className="flex flex-col gap-4">
									<UsageService />
									<SubscriptionPlansModal
										currentSubscription={session.user.subscription}
									/>
								</div>
							)}
							{session.user.subscription !== "FREE" && (
								<>
									{isSubscriptionLoading && (
										<div className="flex flex-col gap-2 animate-pulse">
											<Skeleton className="h-6 w-32" />
											<Skeleton className="h-5 w-24" />
											<Skeleton className="h-9" />
										</div>
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
											<div className="flex flex-col gap-4">
												<div className="flex justify-between items-center gap-4 flex-wrap">
													<div className="flex flex-col gap-1">
														<h3 className="font-semibold">
															{t("subscription.currentPlan")}
														</h3>
														<p className="text-sm text-muted-foreground">
															{session.user.subscription} {t("planLabel")}
														</p>
														<Badge className="w-fit">
															{subscription.status}
														</Badge>
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
																		Number.parseInt(
																			subscription.currentPeriodEnd,
																		),
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
																		Number.parseInt(
																			subscription.currentPeriodEnd,
																		),
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
											</div>
										)}
								</>
							)}
						</section>
					)}

					{section === "language" && (
						<section className="flex flex-col gap-6">
							<h2 className="text-lg font-semibold">{t("nav.language")}</h2>
							<div className="flex flex-col gap-3">
								<p className="text-sm text-muted-foreground">
									{t("language.description")}
								</p>
								<ToggleGroup
									type="single"
									value={locale}
									onValueChange={(value) => {
										if (!isLocale(value) || value === locale) return;
										// Saved on the user so emails sent without a request (e.g. Stripe webhooks) use it too.
										updateLocale(
											{ locale: value },
											{
												onSettled: () => {
													document.cookie = `${LOCALE_COOKIE_NAME}=${value}; path=/; max-age=31536000; samesite=lax`;
													window.location.reload();
												},
											},
										);
									}}
									className="w-fit"
								>
									<ToggleGroupItem value="en">English</ToggleGroupItem>
									<ToggleGroupItem value="es">Español</ToggleGroupItem>
								</ToggleGroup>
							</div>
						</section>
					)}

					{section === "support" && (
						<section className="flex flex-col gap-6">
							<h2 className="text-lg font-semibold">{t("support.title")}</h2>
							<div className="flex flex-col">
								{supportOptions.map((option, index) => (
									<div key={option.link}>
										{index > 0 && <Separator className="my-1" />}
										<Link
											href={option.link}
											target="_blank"
											className="flex items-center justify-between gap-4 rounded-md px-2 py-3 transition-colors hover:bg-muted"
										>
											<div className="flex items-center gap-3">
												<option.icon className="h-5 w-5 shrink-0 text-foreground" />
												<div className="flex flex-col">
													<span className="text-sm font-medium text-foreground">
														{option.title}
													</span>
													<span className="text-xs text-muted-foreground">
														{option.description}
													</span>
												</div>
											</div>
										</Link>
									</div>
								))}
							</div>
						</section>
					)}
				</main>
			</DialogContent>
		</Dialog>
	);
}
