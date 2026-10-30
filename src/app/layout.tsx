import type { Metadata } from "next";
import "../styles/globals.css";
import "sileo/styles.css";
import Dashboard from "~/layout/Dashboard";
import { redirect } from "next/navigation";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "sileo";
import { ThemeProvider } from "~/components/ThemeProvider";
import { getServerAuthSession } from "~/server/auth";
import { NextIntlClientProvider } from "next-intl";
import { Inter } from "next/font/google";
import { cn } from "~/lib/utils";
import { GeistSans } from "geist/font/sans";
import ClientSessionProvider from "~/components/Workspace/ClientSessionProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const getUserSession = async () => {
  const session = await getServerAuthSession();

  if (session === null) {
    redirect("/sign-in");
  }

  return session;
};

export const metadata: Metadata = {
  title: "Pennink",
  description: "Work Smarter, Not Harder",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getUserSession();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(GeistSans.className, "font-sans", inter.variable)}
    >
      <body className="flex w-full h-screen">
        <NextIntlClientProvider>
          <ThemeProvider attribute="data-theme" enableSystem>
            <TRPCReactProvider>
              <Toaster position="bottom-right" theme="dark" />
              <ClientSessionProvider session={session}>
                <Dashboard session={session}>{children}</Dashboard>
              </ClientSessionProvider>
            </TRPCReactProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
