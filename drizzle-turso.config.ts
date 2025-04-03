import { env } from "~/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./src/server/db/migrations/turso",
	schema: "./src/server/db/turso-schema.ts",
	dialect: "turso",
	dbCredentials: {
		url: env.TURSO_URL,
		authToken: env.TURSO_TOKEN,
	},
	casing: "snake_case",
});
