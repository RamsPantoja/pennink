"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { Button } from "./common/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./ui/card";
import type { Subscription } from "~/lib/enum";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { env } from "~/env";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type SubscriptionPlansModalProps = {
	currentSubscription: Subscription;
};

export default function SubscriptionPlansModal({
	currentSubscription,
}: SubscriptionPlansModalProps) {
	const t = useTranslations("SubscriptionPlans");
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="teal"
					size="sm"
					className="px-6 w-full font-bold tracking-wider"
				>
					{t("upgradeButton")}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[700px]">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold text-center">
						{t("dialog.title")}
					</DialogTitle>
					<DialogDescription className="text-center mx-auto max-w-md">
						{t("dialog.description")}
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue={currentSubscription} className="w-full mt-4">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="FREE">{t("plans.free.title")}</TabsTrigger>
						<TabsTrigger value="PRO">{t("plans.pro.title")}</TabsTrigger>
					</TabsList>
					<TabsContent value="FREE" className="space-y-4">
						<PricingCard
							title={t("plans.free.title")}
							price={t("plans.free.price")}
							description={t("plans.free.description")}
							features={[
								t("plans.free.features.workspaces"),
								t("plans.free.features.uploads"),
								t("plans.free.features.fileSize"),
								t("plans.free.features.aiSuggestions"),
								t("plans.free.features.pdfQuestions"),
								t("plans.free.features.chatMessages"),
								t("plans.free.features.forms"),
							]}
							buttonText={t("plans.free.buttonText")}
							subscriptionType="FREE"
							currentSubscription={currentSubscription}
							lookupKey="pennink_free"
							period={t("plans.free.period")}
						/>
					</TabsContent>

					<TabsContent value="PRO" className="space-y-4">
						<PricingCard
							title={t("plans.pro.title")}
							price={t("plans.pro.price")}
							description={t("plans.pro.description")}
							features={[
								t("plans.pro.features.freeIncluded"),
								t("plans.pro.features.unlimitedWorkspaces"),
								t("plans.pro.features.moreMessages"),
								t("plans.pro.features.unlimitedUploads"),
								t("plans.pro.features.largeFiles"),
							]}
							buttonText={t("plans.pro.buttonText")}
							subscriptionType="PRO"
							currentSubscription={currentSubscription}
							lookupKey="pennink_pro_12"
							period={t("plans.pro.period")}
						/>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}

interface PricingCardProps {
	title: string;
	price: string;
	period?: string;
	description: string;
	features: string[];
	buttonText: string;
	subscriptionType: Subscription;
	currentSubscription: Subscription;
	lookupKey: string;
}

function PricingCard({
	title,
	price,
	period = "",
	description,
	features,
	buttonText,
	currentSubscription,
	subscriptionType,
	lookupKey,
}: PricingCardProps) {
	const t = useTranslations("SubscriptionPlans");
	const router = useRouter();
	const pathname = usePathname();
	const {
		mutate: paymentSubscriptionLink,
		isPending: paymentSubscriptionLinkIsPending,
	} = api.payment.getPaymentSubscriptionLink.useMutation({
		onSuccess: (data) => {
			router.push(data.paymentUrl);
		},
		onError: (error) => {
			console.error("Mutation failed:", error.message);
			toast.error(t("toast.error"));
		},
	});

	const generatePaymentLink = () => {
		paymentSubscriptionLink({
			lookupKeys: [lookupKey],
			successUrl: `${env.NEXT_PUBLIC_BASE_URL}/api/subscription/success`,
			cancelUrl: `${env.NEXT_PUBLIC_BASE_URL}${pathname}`,
		});
	};

	return (
		<Card className="flex flex-col border-2">
			<CardHeader>
				<CardTitle className="text-xs uppercase tracking-wider">
					{title}
				</CardTitle>
				<div className="flex items-baseline mt-2">
					<span className="text-3xl font-bold">{price}</span>
					<span className="ml-1 text-sm text-muted-foreground">{period}</span>
				</div>
				<CardDescription className="mt-2">{description}</CardDescription>
			</CardHeader>
			<CardContent className="grow">
				<ul className="space-y-2">
					{features.map((feature, index) => (
						<li key={index} className="flex items-center">
							<Check className="h-4 min-w-4 mr-2 text-foreground" />
							<span className="text-sm">{feature}</span>
						</li>
					))}
				</ul>
			</CardContent>
			<CardFooter>
				<Button
					onClick={generatePaymentLink}
					isPending={paymentSubscriptionLinkIsPending}
					disabled={subscriptionType === currentSubscription}
				>
					{subscriptionType === currentSubscription
						? t("currentPlan")
						: buttonText}
				</Button>
			</CardFooter>
		</Card>
	);
}
