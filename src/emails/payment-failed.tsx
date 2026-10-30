import { Button, Heading, Link, Section, Text } from "@react-email/components";
import { render } from "@react-email/render";
import type { Locale } from "~/lib/utils";
import { getEmailTranslator } from "./i18n";
import {
	EmailLayout,
	buttonClassName,
	headingClassName,
	linkClassName,
	paragraphClassName,
} from "./layout";

type PaymentFailedEmailProps = {
	locale: Locale;
	settingsUrl: string;
	recipientEmail: string;
};

export const getPaymentFailedSubject = (locale: Locale) =>
	getEmailTranslator(locale)("paymentFailed.subject");

export const PaymentFailedEmail = ({
	locale,
	settingsUrl,
	recipientEmail,
}: PaymentFailedEmailProps) => {
	const t = getEmailTranslator(locale);
	const title = t("paymentFailed.title");

	return (
		<EmailLayout
			locale={locale}
			title={title}
			preview={t("paymentFailed.subject")}
			recipientEmail={recipientEmail}
		>
			<Heading className={headingClassName}>{title}</Heading>
			<Text className={paragraphClassName}>
				{t("paymentFailed.description")}
			</Text>
			<Text className={paragraphClassName}>
				{t("paymentFailed.recommendation")}
			</Text>
			<Section className="mt-[32px] mb-[32px] text-center">
				<Button href={settingsUrl} className={buttonClassName}>
					{t("paymentFailed.cta")}
				</Button>
			</Section>
			<Text className={paragraphClassName}>
				{t("layout.copyPaste")}{" "}
				<Link href={settingsUrl} className={linkClassName}>
					{settingsUrl}
				</Link>
			</Text>
		</EmailLayout>
	);
};

PaymentFailedEmail.PreviewProps = {
	locale: "es",
	settingsUrl: "https://pennink.xyz/settings",
	recipientEmail: "alumno@example.com",
} satisfies PaymentFailedEmailProps;

export const renderPaymentFailedEmail = (props: PaymentFailedEmailProps) =>
	render(<PaymentFailedEmail {...props} />);

export default PaymentFailedEmail;
