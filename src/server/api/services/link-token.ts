import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "~/env";

const LINK_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 14;

type LinkTokenPayload = {
	linkId: string;
	email: string;
	expiresAt: number;
};

const sign = (data: string) => {
	if (!env.NEXTAUTH_SECRET) {
		throw new Error("NEXTAUTH_SECRET is not set");
	}

	return createHmac("sha256", env.NEXTAUTH_SECRET)
		.update(data)
		.digest("base64url");
};

export const createLinkToken = ({
	linkId,
	email,
}: {
	linkId: string;
	email: string;
}) => {
	const payload: LinkTokenPayload = {
		linkId,
		email: email.toLowerCase(),
		expiresAt: Math.floor(Date.now() / 1000) + LINK_TOKEN_TTL_SECONDS,
	};
	const data = Buffer.from(JSON.stringify(payload)).toString("base64url");

	return `${data}.${sign(data)}`;
};

export const verifyLinkToken = (
	token: string,
	linkId: string,
): LinkTokenPayload | null => {
	const [data, signature] = token.split(".");

	if (!data || !signature) {
		return null;
	}

	const expected = Buffer.from(sign(data));
	const given = Buffer.from(signature);

	if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
		return null;
	}

	try {
		const payload = JSON.parse(
			Buffer.from(data, "base64url").toString("utf8"),
		) as LinkTokenPayload;

		if (payload.linkId !== linkId) {
			return null;
		}

		if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
			return null;
		}

		return payload;
	} catch {
		return null;
	}
};
