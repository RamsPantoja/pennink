import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		DATABASE_URL: z.string().url(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		NEXTAUTH_SECRET:
			process.env.NODE_ENV === "production"
				? z.string()
				: z.string().optional(),
		NEXTAUTH_URL: z.preprocess(
			// This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
			// Since NextAuth.js automatically uses the VERCEL_URL if present.
			(str) => process.env.VERCEL_URL ?? str,
			// VERCEL_URL doesn't include `https` so it cant be validated as a URL
			process.env.VERCEL ? z.string() : z.string().url(),
		),
		GOOGLE_CLIENT_ID: z.string(),
		GOOGLE_CLIENT_SECRET: z.string(),
		RESEND_API_KEY: z.string(),
		STRIPE_SECRET_KEY: z.string(),
		CF_ACCOUNT_ID: z.string(),
		CF_PUBLIC_R2_KEY: z.string(),
		CF_SECRET_R2_KEY: z.string(),
		BUCKET: z.string(),
		TURSO_TOKEN: z.string(),
		TURSO_URL: z.string(),
		BUCKET_PUBLIC_DOMAIN: z.string(),
		STRIPE_ENDPOINT_SECRET: z.string(),
		AWS_ACCESS_KEY_ID: z.string(),
		AWS_SECRET_ACCESS_KEY: z.string(),
		AWS_REGION: z.string(),
		ELEVENLABS_API_KEY: z.string(),
		ELEVENLABS_VOICE_ID: z.string(),
		ELEVENLABS_MODEL_ID: z.string().default("eleven_flash_v2_5"),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_BASE_URL: z.string(),
		NEXT_PUBLIC_BUCKET_PUBLIC_DOMAIN: z.string(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
		NEXTAUTH_URL: process.env.NEXTAUTH_URL,
		NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
		CF_ACCOUNT_ID: process.env.CF_ACCOUNT_ID,
		CF_PUBLIC_R2_KEY: process.env.CF_PUBLIC_R2_KEY,
		CF_SECRET_R2_KEY: process.env.CF_SECRET_R2_KEY,
		BUCKET: process.env.BUCKET,
		TURSO_TOKEN: process.env.TURSO_TOKEN,
		TURSO_URL: process.env.TURSO_URL,
		BUCKET_PUBLIC_DOMAIN: process.env.BUCKET_PUBLIC_DOMAIN,
		NEXT_PUBLIC_BUCKET_PUBLIC_DOMAIN:
			process.env.NEXT_PUBLIC_BUCKET_PUBLIC_DOMAIN,
		STRIPE_ENDPOINT_SECRET: process.env.STRIPE_ENDPOINT_SECRET,
		AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
		AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
		AWS_REGION: process.env.AWS_REGION,
		ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
		ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID,
		ELEVENLABS_MODEL_ID: process.env.ELEVENLABS_MODEL_ID,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});
