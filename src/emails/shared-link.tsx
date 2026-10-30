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

export type SharedLinkKind = "form" | "exam";

type SharedLinkEmailProps = {
	locale: Locale;
	classroomName: string;
	kind: SharedLinkKind;
	linkTo: string;
	recipientEmail: string;
};

export const getSharedLinkSubject = ({
	locale,
	classroomName,
	kind,
}: Omit<SharedLinkEmailProps, "linkTo" | "recipientEmail">) => {
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
	recipientEmail,
}: SharedLinkEmailProps) => {
	const t = getEmailTranslator(locale);
	const kindLabel = t(`kinds.${kind}`);
	const title = t("sharedLink.title", { kind: kindLabel });

	return (
		<EmailLayout
			locale={locale}
			title={title}
			preview={t("sharedLink.subject", { classroomName, kind: kindLabel })}
			recipientEmail={recipientEmail}
		>
			<Heading className={headingClassName}>{title}</Heading>
			<Text className={paragraphClassName}>
				{t.rich("sharedLink.description", {
					kind: kindLabel,
					classroomName,
					strong: (chunks) => <strong>{chunks}</strong>,
				})}
			</Text>
			<Section className="mt-[32px] mb-[32px] text-center">
				<Button href={linkTo} className={buttonClassName}>
					{t("sharedLink.cta", { kind: kindLabel })}
				</Button>
			</Section>
			<Text className={paragraphClassName}>{t("sharedLink.expiry")}</Text>
			<Text className={paragraphClassName}>
				{t("layout.copyPaste")}{" "}
				<Link href={linkTo} className={linkClassName}>
					{linkTo}
				</Link>
			</Text>
		</EmailLayout>
	);
};

SharedLinkEmail.PreviewProps = {
	locale: "es",
	classroomName: "Biología 3B",
	kind: "exam",
	linkTo: "https://pennink.xyz/exam/link/preview?t=token",
	recipientEmail: "alumno@example.com",
} satisfies SharedLinkEmailProps;

export const renderSharedLinkEmail = (props: SharedLinkEmailProps) =>
	render(<SharedLinkEmail {...props} />);

export default SharedLinkEmail;
