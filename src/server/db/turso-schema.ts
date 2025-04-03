import * as s from "drizzle-orm/sqlite-core";
import { typeid } from "typeid-js";
import { sql } from "drizzle-orm";

const customId = s.text().$defaultFn(() => {
	return typeid().toUUID();
});

const float32Array = s.customType<{
	data: number[];
	config: { dimensions: number };
	configRequired: true;
	driverData: Buffer;
}>({
	dataType(config) {
		return `F32_BLOB(${config.dimensions})`;
	},
	fromDriver(value: Buffer) {
		return Array.from(new Float32Array(value.buffer));
	},
	toDriver(value: number[]) {
		return sql`vector32(${JSON.stringify(value)})`;
	},
});

export const documents = s.sqliteTable("documents", {
	id: customId,
	name: s.text("name").notNull(),
	embedding: float32Array("embedding", { dimensions: 1536 }).notNull(),
});
