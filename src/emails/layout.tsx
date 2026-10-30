import {
	Body,
	Container,
	Head,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import type { Locale } from "~/lib/utils";
import { getEmailTranslator } from "./i18n";

export const colors = {
	text: "#4c4f69",
	muted: "#666666",
	border: "#eaeaea",
	black: "#000000",
	white: "#ffffff",
};

export const headingClassName =
	"mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black";

export const paragraphClassName = "text-[14px] text-black leading-[24px]";

export const buttonClassName =
	"rounded bg-[#000000] px-5 py-3 text-center font-semibold text-[12px] text-white no-underline";

export const linkClassName = "text-blue-600 no-underline";

type EmailLayoutProps = {
	locale: Locale;
	title: string;
	preview: string;
	recipientEmail: string;
	children: ReactNode;
};

export const EmailLayout = ({
	locale,
	title,
	preview,
	recipientEmail,
	children,
}: EmailLayoutProps) => {
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
			<Tailwind>
				<Body className="mx-auto my-auto bg-white px-2 font-sans">
					<Preview>{preview}</Preview>
					<Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
						<Section className="mt-[32px]">
							<Img
								src="https://storage.pennink.xyz/icon.png"
								width="40"
								height="40"
								alt="Pennink"
								className="mx-auto my-0"
							/>
						</Section>
						{children}
						<Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
						<Text className="text-[#666666] text-[12px] leading-[24px]">
							{t("layout.intendedFor")}{" "}
							<span className="text-black">{recipientEmail}</span>.{" "}
							{t("layout.contact")}{" "}
							<Link href="mailto:hola@pennink.xyz" className={linkClassName}>
								hola@pennink.xyz
							</Link>{" "}
							{t("layout.thanks")}
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};
