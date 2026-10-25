import { createTranslator } from "next-intl";
import en from "~/i18n/messages/en.json";
import es from "~/i18n/messages/es.json";
import type { Locale } from "~/lib/utils";

const messages = { en, es } as const;

export const getEmailTranslator = (locale: Locale) =>
	createTranslator({
		locale,
		messages: messages[locale],
		namespace: "Emails",
	});
