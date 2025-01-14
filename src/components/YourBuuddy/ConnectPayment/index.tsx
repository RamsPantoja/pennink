import { useRouter } from "next/router";
import { toast } from "sonner";
import { BuuddyButton } from "~/components/common/BuuddyButton";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/utils/api";

const ConnectPayment = () => {
	const router = useRouter();

	const { mutate: connectStripeMutation, isPending: connectStripeIsPending } =
		api.payment.connectStripe.useMutation({
			onSuccess: async (data) => {
				if (data.generateOnboardingLink) {
					await router.push(data.generateOnboardingLink.url);
				}
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const {
		data: connectedAccountData,
		isError: connectedAccountIsError,
		isLoading: connectedAccountIsLoading,
	} = api.payment.stripeAccountByUserId.useQuery();

	const handleConnectStripe = async () => {
		connectStripeMutation();
	};

	console.log(connectedAccountData);

	return (
		<Card className="flex w-full flex-col gap-2">
			<h1 className="text-xl text-mochaText font-bold">Payout</h1>
			{connectedAccountData?.accountId &&
				!connectedAccountData?.onboarding &&
				!connectedAccountIsLoading &&
				!connectedAccountIsError && (
					<Card className="flex flex-col gap-4 bg-mochaMantle w-fit">
						<p className="text-mochaSubText text-lg font-semibold">
							Your payout information has been saved!
						</p>
						<p className="text-mochaSubText text-sm">
							Fill out the remaining information to start receiving payments.
						</p>
						<BuuddyButton
							className="w-fit"
							isPending={connectStripeIsPending}
							onClick={handleConnectStripe}
						>
							Complete payouts information
						</BuuddyButton>
					</Card>
				)}
			{!connectedAccountData &&
				!connectedAccountIsLoading &&
				!connectedAccountIsError && (
					<Card className="flex flex-col gap-4 bg-mochaMantle w-fit">
						<p className="text-mochaSubText text-lg font-semibold">
							Enter your payout information to start receiving payments!
						</p>
						<p className="text-mochaSubText text-sm">
							To enable payouts, you will need to provide your bank account
							details to our payment partner, Stripe.
						</p>
						<BuuddyButton
							className="w-fit"
							isPending={connectStripeIsPending}
							onClick={handleConnectStripe}
						>
							Set up payouts
						</BuuddyButton>
					</Card>
				)}
			{connectedAccountIsLoading && (
				<Card className="w-full gap-2 flex flex-col">
					<Skeleton className="h-16 w-full max-w-screen-md" />
					<Skeleton className="h-12 w-full max-w-screen-sm" />
					<Skeleton className="h-12 w-40" />
					<Card className="w-full gap-2 flex flex-col">
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
					</Card>
				</Card>
			)}
			{connectedAccountIsError && (
				<FeedbackMessage
					status="ERROR"
					message="An error occurred while fetching your payout information."
				/>
			)}
		</Card>
	);
};

export default ConnectPayment;
