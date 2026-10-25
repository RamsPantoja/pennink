import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE_NAME, getRequestLocale } from "~/lib/utils";

export default getRequestConfig(async () => {
	const cookieStore = await cookies();
	const values = await headers();
	const locale = getRequestLocale(
		cookieStore.get(LOCALE_COOKIE_NAME)?.value,
		values.get("accept-language") ?? undefined,
	);

	return {
		locale,
		messages: (await import(`../i18n/messages/${locale}.json`)).default,
	};
});
