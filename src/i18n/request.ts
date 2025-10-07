import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { getPreferredLocale } from "~/lib/utils";

export default getRequestConfig(async () => {
	const values = await headers();
	const acceptLanguage = values.get("accept-language");
	const locale = getPreferredLocale(
		acceptLanguage ? acceptLanguage : undefined,
	);

	return {
		locale,
		messages: (await import(`../i18n/messages/${locale}.json`)).default,
	};
});
