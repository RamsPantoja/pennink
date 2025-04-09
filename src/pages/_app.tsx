import { Nunito } from "next/font/google";
import type { Session } from "next-auth";
import type { AppType } from "next/app";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import "~/styles/nprogress.css";
import { TooltipProvider } from "~/components/ui/tooltip";
import { Toaster } from "sonner";
import { useRouter } from "next/router";
import { useEffect } from "react";
import nProgress from "nprogress";
import { SessionProvider } from "next-auth/react";

const MyApp: AppType<{ session: Session | null }> = ({
	Component,
	pageProps,
}) => {
	const router = useRouter();

	useEffect(() => {
		const handleStart = () => {
			nProgress.start();
		};

		const handleStop = () => {
			nProgress.done();
		};

		router.events.on("routeChangeStart", handleStart);
		router.events.on("routeChangeComplete", handleStop);
		router.events.on("routeChangeError", handleStop);

		return () => {
			router.events.off("routeChangeStart", handleStart);
			router.events.off("routeChangeComplete", handleStop);
			router.events.off("routeChangeError", handleStop);
		};
	}, [router]);

	return (
		<SessionProvider session={pageProps.session}>
			<main>
				<TooltipProvider>
					<Toaster richColors />
					<Component {...pageProps} />
				</TooltipProvider>
			</main>
		</SessionProvider>
	);
};

export default api.withTRPC(MyApp);
