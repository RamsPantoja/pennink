import type { Metadata } from "next";
import "../styles/globals.css";
import Dashboard from "~/layout/Dashboard";
import { redirect } from "next/navigation";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "sonner";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "~/components/ThemeProvider";
import { getServerAuthSession } from "~/server/auth";
import ClientSessionProvider from "~/components/ClientSessionProvider";

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
			data-theme="dark"
			lang="en"
			suppressHydrationWarning
			className={GeistMono.className}
		>
			<body className="flex w-full h-screen">
				<ThemeProvider
					attribute="data-theme"
					defaultTheme="system"
					enableSystem
				>
					<TRPCReactProvider>
						<Toaster richColors className={GeistMono.className} />
						<ClientSessionProvider session={session}>
							<Dashboard session={session}>{children}</Dashboard>
						</ClientSessionProvider>
					</TRPCReactProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
