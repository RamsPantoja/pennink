import { Inconsolata } from "next/font/google";
import { type Session } from "next-auth";
import { type AppType } from "next/app";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { TooltipProvider } from "~/components/ui/tooltip";

const font = Inconsolata({ subsets: ["latin"] });

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps,
}) => {
  return (
    <main className={font.className}>
      <TooltipProvider delayDuration={200}>
        <Component {...pageProps} />
      </TooltipProvider>
    </main>
  );
};

export default api.withTRPC(MyApp);
