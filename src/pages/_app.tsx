import type { Session } from "next-auth";
import type { AppType } from "next/app";
import "~/styles/globals.css";
import "sileo/styles.css";
import "~/styles/nprogress.css";
import { TooltipProvider } from "~/components/ui/tooltip";
import { Toaster } from "sileo";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import nProgress from "nprogress";
import { SessionProvider } from "next-auth/react";
import { create } from "zustand";
import { apiPageRouter } from "~/utils/api";
import { NextIntlClientProvider } from "next-intl";
import type { Locale } from "~/lib/utils";
import { GeistSans } from "geist/font/sans";

type Theme = "light" | "dark";

type AppStore = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export const useAppStore = create<AppStore>()((set) => ({
  theme: "dark",
  setTheme: (theme: Theme) => set({ theme }),
}));

type AppTypes = {
  session: Session | null;
  locale: Locale;
  messages: any;
};

const MyApp: AppType<AppTypes> = ({ Component, pageProps }) => {
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
      <NextIntlClientProvider
        locale={pageProps.locale ?? "en"}
        messages={pageProps.messages}
      >
        <main data-theme={theme} className={GeistSans.className}>
          <TooltipProvider delayDuration={300}>
            <Toaster position="bottom-right" />
            <Component {...pageProps} />
          </TooltipProvider>
        </main>
      </NextIntlClientProvider>
    </SessionProvider>
  );
};

export default apiPageRouter.withTRPC(MyApp);
