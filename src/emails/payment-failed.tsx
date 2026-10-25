import { Button, Heading, Text } from "@react-email/components";
import { render } from "@react-email/render";
import type { Locale } from "~/lib/utils";
import { getEmailTranslator } from "./i18n";
import { EmailLayout, colors } from "./layout";

type PaymentFailedEmailProps = {
	locale: Locale;
	settingsUrl: string;
};

export const getPaymentFailedSubject = (locale: Locale) =>
	getEmailTranslator(locale)("paymentFailed.subject");

export const PaymentFailedEmail = ({
	locale,
	settingsUrl,
}: PaymentFailedEmailProps) => {
	const t = getEmailTranslator(locale);

	return (
		<EmailLayout locale={locale} title={t("paymentFailed.title")}>
			<Heading style={{ color: colors.text, fontSize: "24px" }}>
				{t("paymentFailed.title")}
			</Heading>
			<Text style={{ color: colors.text, fontSize: "14px" }}>
				{t("paymentFailed.description")}
			</Text>
			<Text style={{ color: colors.text, fontSize: "14px" }}>
				{t("paymentFailed.recommendation")}
			</Text>
			<Button
				href={settingsUrl}
				style={{
					display: "inline-block",
					color: colors.black,
					backgroundColor: colors.accent,
					padding: "14px",
					borderRadius: "5px",
					fontWeight: 600,
					margin: "20px 0",
				}}
			>
				{t("paymentFailed.cta")}
			</Button>
		</EmailLayout>
	);
};

PaymentFailedEmail.PreviewProps = {
	locale: "es",
	settingsUrl: "https://pennink.xyz/settings",
} satisfies PaymentFailedEmailProps;

export const renderPaymentFailedEmail = (props: PaymentFailedEmailProps) =>
	render(<PaymentFailedEmail {...props} />);

export default PaymentFailedEmail;
