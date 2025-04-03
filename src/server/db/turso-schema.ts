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

export const embeddingDocuments = s.sqliteTable("embedding_document", {
	id: s.integer().primaryKey(),
	uuid: customId.unique().notNull(),
	fileId: s.text().notNull(),
	name: s.text().notNull(),
	content: s.text().notNull(),
	embedding: float32Array({ dimensions: 4000 }).notNull(),
	userId: s.text().notNull(),
});
