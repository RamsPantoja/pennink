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
});

await db.run(sql`
  CREATE INDEX IF NOT EXISTS embedding_index
  ON documents(libsql_vector_idx(embedding))
`);
