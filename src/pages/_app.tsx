import { GeistMono } from "geist/font/mono";

import type { Session } from "next-auth";
import type { AppType } from "next/app";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import "~/styles/nprogress.css";
import { TooltipProvider } from "~/components/ui/tooltip";
import { Toaster } from "sonner";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import nProgress from "nprogress";
import { SessionProvider } from "next-auth/react";
import { create } from "zustand";

type Theme = "light" | "dark";

type AppStore = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

export const useAppStore = create<AppStore>()((set) => ({
	theme: "dark",
	setTheme: (theme: Theme) => set({ theme }),
}));

const MyApp: AppType<{ session: Session | null }> = ({
	Component,
	pageProps,
}) => {
	const router = useRouter();
	const { theme, setTheme } = useAppStore();

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

	useEffect(() => {
		const localStorageTheme = localStorage.getItem("theme");

		if (localStorageTheme) {
			// setTheme(localStorageTheme as Theme);
			return;
		}

		if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
			// setTheme("dark");
		} else {
			// setTheme("light");
		}
	}, [setTheme]);

	return (
		<SessionProvider session={pageProps.session}>
			<main data-theme={theme} className={GeistMono.className}>
				<TooltipProvider delayDuration={300}>
					<Toaster richColors />
					<Component {...pageProps} />
				</TooltipProvider>
			</main>
		</SessionProvider>
	);
};

export default api.withTRPC(MyApp);
