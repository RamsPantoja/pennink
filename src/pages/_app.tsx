import { Nunito } from "next/font/google";
import { type Session } from "next-auth";
import { type AppType } from "next/app";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { TooltipProvider } from "~/components/ui/tooltip";
import { Toaster } from "sonner";

const font = Nunito({ subsets: ["latin"] });

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps,
}) => {
  return (
    <main className={font.className}>
      <TooltipProvider delayDuration={500}>
        <Toaster richColors />
        <Component {...pageProps} />
      </TooltipProvider>
    </main>
  );
};

export default api.withTRPC(MyApp);
