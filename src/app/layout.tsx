import type { Metadata } from "next";
import "../styles/globals.css";
import Dashboard from "~/layout/Dashboard";
import { redirect } from "next/navigation";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "sonner";
import { ThemeProvider } from "~/components/ThemeProvider";
import { getServerAuthSession } from "~/server/auth";
import ClientSessionProvider from "~/components/ClientSessionProvider";
import { NextIntlClientProvider } from "next-intl";
import { Inter } from "next/font/google";
import { cn } from "~/lib/utils";
import { GeistSans } from "geist/font/sans";

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
              <Toaster richColors className={GeistSans.className} />
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
