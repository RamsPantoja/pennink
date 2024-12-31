import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env";
import * as schema from "./schema";

const connectionString = env.DATABASE_URL;

export type DrizzleSchema = typeof schema;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle<DrizzleSchema>(client, { schema });
