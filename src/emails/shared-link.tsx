import { Button, Heading, Text } from "@react-email/components";
import { render } from "@react-email/render";
import type { Locale } from "~/lib/utils";
import { getEmailTranslator } from "./i18n";
import { EmailLayout, colors } from "./layout";

export type SharedLinkKind = "form" | "exam";

type SharedLinkEmailProps = {
	locale: Locale;
	classroomName: string;
	kind: SharedLinkKind;
	linkTo: string;
};

export const getSharedLinkSubject = ({
	locale,
	classroomName,
	kind,
}: Omit<SharedLinkEmailProps, "linkTo">) => {
	const t = getEmailTranslator(locale);

	return t("sharedLink.subject", {
		classroomName,
		kind: t(`kinds.${kind}`),
	});
};

export const SharedLinkEmail = ({
	locale,
	classroomName,
	kind,
	linkTo,
}: SharedLinkEmailProps) => {
	const t = getEmailTranslator(locale);
	const kindLabel = t(`kinds.${kind}`);

	return (
		<EmailLayout
			locale={locale}
			title={t("sharedLink.title", { kind: kindLabel })}
		>
			<Heading style={{ color: colors.text, fontSize: "24px" }}>
				{t("sharedLink.title", { kind: kindLabel })}
			</Heading>
			<Text style={{ color: colors.text, fontSize: "14px" }}>
				{t.rich("sharedLink.description", {
					kind: kindLabel,
					classroomName,
					strong: (chunks) => <strong>{chunks}</strong>,
				})}
			</Text>
			<Button
				href={linkTo}
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
				{t("sharedLink.cta", { kind: kindLabel })}
			</Button>
			<Text style={{ color: colors.text, fontSize: "14px" }}>
				{t("sharedLink.expiry")}
			</Text>
		</EmailLayout>
	);
};

SharedLinkEmail.PreviewProps = {
	locale: "es",
	classroomName: "Biología 3B",
	kind: "exam",
	linkTo: "https://pennink.xyz/exam/link/preview?t=token",
} satisfies SharedLinkEmailProps;

export const renderSharedLinkEmail = (props: SharedLinkEmailProps) =>
	render(<SharedLinkEmail {...props} />);

export default SharedLinkEmail;
