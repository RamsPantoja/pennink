import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { type Session, getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { authOptions } from "~/server/auth";
import {
	LOCALE_COOKIE_NAME,
	getRequestLocale,
	type Locale,
} from "~/lib/utils";
import { useTranslations } from "next-intl";
import { SettingsDialog } from "~/components/Settings/SettingsDialog";

// Kept as a route so links from outside the app (billing portal return,
// payment failed email) still land on the settings. The content itself
// lives in SettingsDialog, opened here on top of an empty screen.
const Settings = ({
	session,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const t = useTranslations("Settings");
	const router = useRouter();

	return (
		<div className="flex w-full justify-center p-4 bg-background h-screen">
			<Head>
				<title>{t("head.title")}</title>
				<meta name="description" content={t("head.description")} />
				<link rel="icon" href="/favicon.svg" />
			</Head>
			<SettingsDialog
				open
				session={session}
				onOpenChange={(open) => {
					if (open) return;
					const { callbackUrl } = router.query;
					router.push(typeof callbackUrl === "string" ? callbackUrl : "/");
				}}
			/>
		</div>
	);
};

type ServerSideProps = {
	locale: Locale;
	session: Session | null;
	messages: any;
};

export const getServerSideProps = (async ({ req, res }) => {
	const session = await getServerSession(req, res, authOptions);
	const locale = getRequestLocale(
		req.cookies[LOCALE_COOKIE_NAME],
		req.headers["accept-language"],
	);
	const messages = (await import(`../i18n/messages/${locale}.json`)).default;

	if (!session) {
		return {
			redirect: {
				destination: "/sign-in",
				permanent: false,
			},
		};
	}

	return { props: { session, locale, messages } };
}) satisfies GetServerSideProps<ServerSideProps>;

export default Settings;
