import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import markdownit from "markdown-it";
import digitalMarkdownPlugin from "@digitalocean/do-markdownit";
import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { sileo } from "sileo";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const mapSkeletons = ({
	numberOfSkeletons,
	skeleton,
}: {
	numberOfSkeletons: number;
	skeleton: ReactNode;
}) => Array.from({ length: numberOfSkeletons }, () => skeleton);

export const markdownToHtml = (markdown: string) =>
	markdownit().use(digitalMarkdownPlugin).render(markdown);

type FileSizeRuleParams = {
	session: Session;
	file: File;
};

export const fileSizeRule = ({ session, file }: FileSizeRuleParams) => {
	const maxSizeMB = session.user.subscription === "PRO" ? 50 : 6;
	const isValid = !file || file.size <= maxSizeMB * 1024 * 1024;

	if (!isValid) {
		sileo.show({
			title:
				session.user.subscription === "PRO"
					? "You can not upload files up to 50MB of size"
					: "You need to upgrade to Pennink Pro to upload files up to 6MB of size",
		});
	}

	return {
		isValid,
		message: isValid ? "File size is valid" : `File size exceeds ${maxSizeMB}MB limit`,
	};
};

export type Locale = "en" | "es";

export const LOCALE_COOKIE_NAME = "locale";

export const isLocale = (value: unknown): value is Locale =>
	value === "en" || value === "es";

// An explicit choice saved in the locale cookie wins over the browser language.
export const getRequestLocale = (
	cookieLocale: string | undefined,
	acceptLanguageHeader: string | undefined,
): Locale =>
	isLocale(cookieLocale)
		? cookieLocale
		: getPreferredLocale(acceptLanguageHeader);

export const getPreferredLocale = (
	acceptLanguageHeader: string | undefined,
): Locale => {
	if (!acceptLanguageHeader) return "en";

	const languages = acceptLanguageHeader
		.split(",")
		.map((language) => {
			const [locale, weight = "q=1.0"] = language.trim().split(";");
			return {
				locale: locale?.split("-")[0],
				q: Number(weight.split("=")[1]),
			};
		})
		.sort((a, b) => b.q - a.q);

	return (
		languages.find((language) => language.locale === "en" || language.locale === "es")
			?.locale as Locale
	) ?? "en";
};
