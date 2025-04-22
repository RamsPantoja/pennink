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

export default function SubscriptionPlansModal() {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="lg" className="px-6">
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

				<Tabs defaultValue="monthly" className="w-full mt-4">
					<TabsList className="grid w-full grid-cols-2 mb-6">
						<TabsTrigger value="monthly">Monthly</TabsTrigger>
						<TabsTrigger value="yearly">Yearly (Save 20%)</TabsTrigger>
					</TabsList>

					<TabsContent value="monthly" className="space-y-4">
						<div className="grid gap-4 md:grid-cols-3">
							<PricingCard
								title="Basic"
								price="$9"
								description="Perfect for individuals just getting started"
								features={[
									"1 user",
									"10 projects",
									"5GB storage",
									"Basic support",
								]}
								buttonText="Get Started"
								popular={false}
							/>

							<PricingCard
								title="Pro"
								price="$19"
								description="Ideal for professionals and small teams"
								features={[
									"5 users",
									"50 projects",
									"25GB storage",
									"Priority support",
									"Advanced analytics",
								]}
								buttonText="Get Started"
								popular={true}
							/>

							<PricingCard
								title="Enterprise"
								price="$49"
								description="For large teams with advanced needs"
								features={[
									"Unlimited users",
									"Unlimited projects",
									"100GB storage",
									"24/7 dedicated support",
									"Custom integrations",
									"Advanced security",
								]}
								buttonText="Contact Sales"
								popular={false}
							/>
						</div>
					</TabsContent>

					<TabsContent value="yearly" className="space-y-4">
						<div className="grid gap-4 md:grid-cols-3">
							<PricingCard
								title="Basic"
								price="$86"
								period="per year"
								description="Perfect for individuals just getting started"
								features={[
									"1 user",
									"10 projects",
									"5GB storage",
									"Basic support",
								]}
								buttonText="Get Started"
								popular={false}
							/>

							<PricingCard
								title="Pro"
								price="$182"
								period="per year"
								description="Ideal for professionals and small teams"
								features={[
									"5 users",
									"50 projects",
									"25GB storage",
									"Priority support",
									"Advanced analytics",
								]}
								buttonText="Get Started"
								popular={true}
							/>

							<PricingCard
								title="Enterprise"
								price="$470"
								period="per year"
								description="For large teams with advanced needs"
								features={[
									"Unlimited users",
									"Unlimited projects",
									"100GB storage",
									"24/7 dedicated support",
									"Custom integrations",
									"Advanced security",
								]}
								buttonText="Contact Sales"
								popular={false}
							/>
						</div>
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
	popular?: boolean;
}

function PricingCard({
	title,
	price,
	period = "per month",
	description,
	features,
	buttonText,
	popular = false,
}: PricingCardProps) {
	return (
		<Card
			className={`flex flex-col ${popular ? "border-primary shadow-lg relative" : ""}`}
		>
			{popular && (
				<div className="absolute -top-3 left-0 right-0 mx-auto w-fit px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
					Most Popular
				</div>
			)}
			<CardHeader>
				<CardTitle className="text-xl">{title}</CardTitle>
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
							<Check className="h-4 w-4 mr-2 text-green-500" />
							<span className="text-sm">{feature}</span>
						</li>
					))}
				</ul>
			</CardContent>
			<CardFooter>
				<Button
					className={`w-full ${popular ? "" : "bg-muted hover:bg-muted/80 text-foreground"}`}
					variant={popular ? "default" : "outline"}
				>
					{buttonText}
				</Button>
			</CardFooter>
		</Card>
	);
}
