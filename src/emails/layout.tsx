import {
	Body,
	Container,
	Head,
	Html,
	Img,
	Link,
	Section,
	Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import type { Locale } from "~/lib/utils";
import { getEmailTranslator } from "./i18n";

export const colors = {
	border: "#f9dcf8",
	accent: "#f9dcf8",
	text: "#4c4f69",
	black: "#000000",
	white: "#ffffff",
};

const fontFamily = "Nunito, sans-serif";

const cardStyle = {
	border: `2px solid ${colors.border}`,
	borderRadius: "10px",
	maxWidth: "624px",
	minWidth: "624px",
	margin: "0 auto",
	position: "relative" as const,
};

const headerStyle = {
	padding: "30px",
	borderRadius: "8px 8px 0 0",
	backgroundColor: colors.white,
};

const contentStyle = {
	borderRadius: "0 0 8px 8px",
	backgroundColor: colors.white,
	padding: "30px",
};

const paragraphStyle = {
	color: colors.text,
	fontSize: "14px",
};

type EmailLayoutProps = {
	locale: Locale;
	title: string;
	children: ReactNode;
};

export const EmailLayout = ({ locale, title, children }: EmailLayoutProps) => {
	const t = getEmailTranslator(locale);

	return (
		<Html lang={locale}>
			<Head>
				<title>{title}</title>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap"
				/>
			</Head>
			<Body style={{ margin: 0, padding: "40px", fontFamily }}>
				<Container style={cardStyle}>
					<Section style={headerStyle}>
						<Img
							src="https://storage.pennink.xyz/icon.png"
							width="28"
							alt="isotipo r3d"
							style={{ display: "inline-block", verticalAlign: "middle" }}
						/>
						<Text
							style={{
								display: "inline-block",
								verticalAlign: "middle",
								margin: "0 0 0 8px",
								color: colors.black,
								fontWeight: 700,
								fontSize: "24px",
							}}
						>
							Pennink
						</Text>
					</Section>
					<Section style={contentStyle}>
						{children}
						<Text style={paragraphStyle}>{t("layout.contact")}</Text>
						<Link style={paragraphStyle} href="mailto:hola@pennink.xyz">
							hola@pennink.xyz
						</Link>
						<Text style={paragraphStyle}>{t("layout.thanks")}</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
};
