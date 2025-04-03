import { drizzle } from "drizzle-orm/libsql/node";
import { env } from "~/env";
import * as schema from "./turso-schema";
import { sql } from "drizzle-orm";

export type DrizzleTursoSchema = typeof schema;

export const db = drizzle<DrizzleTursoSchema>({
	connection: {
		url: env.TURSO_URL,
		authToken: env.TURSO_TOKEN,
	},
	schema,
	casing: "snake_case",
});
