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
import { api } from "~/utils/api";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { env } from "~/env";

type SubscriptionPlansModalProps = {
	currentSubscription: Subscription;
};

export default function SubscriptionPlansModal({
	currentSubscription,
}: SubscriptionPlansModalProps) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" className="px-6">
					Upgrade plan
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[700px]">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold text-center">
						Choose Your Plan
					</DialogTitle>
					<DialogDescription className="text-center mx-auto max-w-md">
						Select the perfect subscription plan for your needs. Upgrade or
						downgrade at any time.
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue={currentSubscription} className="w-full mt-4">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="FREE">Free</TabsTrigger>
						<TabsTrigger value="PRO">Pro</TabsTrigger>
						{/* <TabsTrigger value="PREMIUM">Premium</TabsTrigger> */}
					</TabsList>

					<TabsContent value="FREE" className="space-y-4">
						<PricingCard
							title="Free"
							price="$0"
							description="Perfect for individuals just getting started"
							features={[
								"Up to 25 workspaces (Includes deleted)",
								"5 upload files / day",
								"Upload files, each up to 50 pages / 6 MB in size",
								"AI writing suggestions",
								"Ask questions to your PDFs",
								"20 chat messages / day",
							]}
							buttonText="Cancel current subscription"
							subscriptionType="FREE"
							currentSubscription={currentSubscription}
							lookupKey="pennink_free"
							period="forever"
						/>
					</TabsContent>

					<TabsContent value="PRO" className="space-y-4">
						<PricingCard
							title="Pro"
							price="$12"
							description="Ideal for professionals"
							features={[
								"Everything in Free",
								"Unlimited workspaces",
								"10-20x more messages than Free",
								"Unlimited upload files",
								"Upload files, each up to 50 MB in size",
							]}
							buttonText="Upgrade to Pennink Pro"
							subscriptionType="PRO"
							currentSubscription={currentSubscription}
							lookupKey="pennink_pro_12"
						/>
					</TabsContent>

					{/* <TabsContent value="PREMIUM">
						<PricingCard
							title="Premium"
							price="$20"
							description="For professionals with advanced needs and extended resources"
							features={[
								"Unlimited users",
								"Unlimited projects",
								"100GB storage",
								"24/7 dedicated support",
								"Custom integrations",
								"Advanced security",
							]}
							buttonText="Upgrade to Pennink Premium"
							subscriptionType="PREMIUM"
							currentSubscription={currentSubscription}
						/>
					</TabsContent> */}
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
	period = "per month",
	description,
	features,
	buttonText,
	currentSubscription,
	subscriptionType,
	lookupKey,
}: PricingCardProps) {
	const router = useRouter();

	const {
		mutate: paymentSubscriptionLink,
		isPending: paymentSubscriptionLinkIsPending,
	} = api.payment.getPaymentSubscriptionLink.useMutation({
		onSuccess: (data) => {
			router.push(data.paymentUrl);
		},
		onError: (error) => {
			console.error("Mutation failed:", error.message);
			toast.error("An error occurred");
		},
	});

	const generatePaymentLink = () => {
		paymentSubscriptionLink({
			lookupKeys: [lookupKey],
			successUrl: `${env.NEXT_PUBLIC_BASE_URL}/api/subscription/success`,
			cancelUrl: `${env.NEXT_PUBLIC_BASE_URL}${router.asPath}`,
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
			<CardContent className="flex-grow">
				<ul className="space-y-2">
					{features.map((feature, index) => (
						<li key={index} className="flex items-center">
							<Check className="h-4 min-w-4 mr-2 text-mochaText" />
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
						? "Current Plan"
						: buttonText}
				</Button>
			</CardFooter>
		</Card>
	);
}
