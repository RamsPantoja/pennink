import type { OutputData } from "@editorjs/editorjs";
import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTableCreator,
	primaryKey,
	text,
	timestamp,
	uuid,
	json,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";
import { typeid } from "typeid-js";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => name);

const customId = uuid("id").$defaultFn(() => {
	return typeid().toUUID();
});

export const suscriptionEnum = pgEnum("suscription", [
	"BASIC",
	"PREMIUM",
	"FREE",
]);

export const messageRoleEnum = pgEnum("message_type", [
	"SYSTEM",
	"USER",
	"AGENT",
]);

export const users = createTable("user", {
	id: customId.notNull().primaryKey(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: timestamp({
		mode: "date",
		withTimezone: true,
	}).default(sql`CURRENT_TIMESTAMP`),
	image: text().notNull(),
	verified: boolean().notNull().default(false),
	suscription: suscriptionEnum().notNull().default("FREE"),
	onBoardingCompleted: boolean().notNull().default(false),
	createdAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
	accounts: many(accounts),
	notifications: many(notifications),
}));

export const accounts = createTable(
	"account",
	{
		userId: uuid()
			.notNull()
			.references(() => users.id),
		type: text().$type<AdapterAccount["type"]>().notNull(),
		provider: text().notNull(),
		providerAccountId: text().notNull(),
		refresh_token: text(),
		access_token: text(),
		expires_at: integer(),
		token_type: text(),
		scope: text(),
		id_token: text(),
		session_state: text(),
		createdAt: timestamp({
			mode: "date",
		})
			.notNull()
			.defaultNow(),
		updatedAt: timestamp({
			mode: "date",
		})
			.notNull()
			.defaultNow(),
	},
	(account) => [
		primaryKey({
			columns: [account.provider, account.providerAccountId],
		}),
		index("account_user_id_idx").on(account.userId),
	],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
	"session",
	{
		sessionToken: text().notNull().primaryKey(),
		userId: uuid()
			.notNull()
			.references(() => users.id),
		expires: timestamp({
			mode: "date",
			withTimezone: true,
		}).notNull(),
		createdAt: timestamp({
			mode: "date",
		})
			.notNull()
			.defaultNow(),
		updatedAt: timestamp({
			mode: "date",
		})
			.notNull()
			.defaultNow(),
	},
	(session) => [index("session_user_id_idx").on(session.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
	"verification_token",
	{
		identifier: text().notNull(),
		token: text().notNull(),
		expires: timestamp({
			mode: "date",
			withTimezone: true,
		}).notNull(),
	},
	(vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

export const notifications = createTable("notification", {
	id: customId.notNull().primaryKey(),
	content: text().notNull(),
	iconUrl: text().notNull(),
	link: text().notNull(),
	seen: boolean().notNull().default(false),
	receiverId: uuid()
		.notNull()
		.references(() => users.id),
	createdAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
	receiver: one(users, {
		fields: [notifications.receiverId],
		references: [users.id],
	}),
}));

export const paymentTypeEnum = pgEnum("payment_type", ["SUSCRIPTION"]);

export const payments = createTable("payment", {
	id: customId.notNull().primaryKey(),
	userId: uuid()
		.notNull()
		.references(() => users.id),
	checkoutSessionId: text().notNull(),
	paymentIntentId: text().notNull(),
	paymentType: paymentTypeEnum().notNull(),
	createdAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
	user: one(users, {
		fields: [payments.userId],
		references: [users.id],
	}),
}));

export const workspaces = createTable("workspace", {
	id: customId.notNull().primaryKey(),
	name: text().notNull(),
	userId: uuid()
		.notNull()
		.references(() => users.id),
	chatId: uuid()
		.notNull()
		.references(() => chats.id),
	noteId: uuid()
		.notNull()
		.references(() => notes.id),
	summaryId: uuid()
		.notNull()
		.references(() => summaries.id),
	createdAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	deletedAt: timestamp({
		mode: "date",
	}),
});

export const workspacesRelations = relations(workspaces, ({ one }) => ({
	user: one(users, {
		fields: [workspaces.userId],
		references: [users.id],
	}),
	chat: one(chats, {
		fields: [workspaces.chatId],
		references: [chats.id],
	}),
	summary: one(summaries, {
		fields: [workspaces.summaryId],
		references: [summaries.id],
	}),
	note: one(notes, {
		fields: [workspaces.noteId],
		references: [notes.id],
	}),
}));

export const chats = createTable("chat", {
	id: customId.notNull().primaryKey(),
	userId: uuid()
		.notNull()
		.references(() => users.id),
	createdAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
});

export const chatsRelations = relations(chats, ({ one }) => ({
	user: one(users, {
		fields: [chats.userId],
		references: [users.id],
	}),
}));

export const messages = createTable("message", {
	id: customId.notNull().primaryKey(),
	chatId: uuid()
		.notNull()
		.references(() => chats.id),
	content: text().notNull(),
	role: messageRoleEnum().notNull().default("SYSTEM"),
	userId: uuid()
		.notNull()
		.references(() => users.id),
	createdAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
	chat: one(chats, {
		fields: [messages.chatId],
		references: [chats.id],
	}),
	user: one(users, {
		fields: [messages.userId],
		references: [users.id],
	}),
}));

export const summaries = createTable("summary", {
	id: customId.notNull().primaryKey(),
	content: text().notNull(),
	userId: uuid()
		.notNull()
		.references(() => users.id),
	createdAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
});

export const summariesRelations = relations(summaries, ({ one }) => ({
	user: one(users, {
		fields: [summaries.userId],
		references: [users.id],
	}),
}));

//#Notes
const defaultJsonContent = {
	time: new Date().getTime(),
	blocks: [],
	version: "2.30.8",
};

export const notes = createTable("note", {
	id: customId.notNull().primaryKey(),
	content: json().default(defaultJsonContent).$type<OutputData>().notNull(),
	userId: uuid()
		.notNull()
		.references(() => users.id),
	createdAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
});

export const notesRelations = relations(notes, ({ one }) => ({
	user: one(users, {
		fields: [notes.userId],
		references: [users.id],
	}),
}));

export const files = createTable("file", {
	id: customId.notNull().primaryKey(),
	filename: text().notNull(),
	type: text().notNull(),
	key: text().notNull(),
	bucket: text().notNull(),
	userId: uuid()
		.notNull()
		.references(() => users.id),
	createdAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
});

export const filesRelations = relations(files, ({ one }) => ({
	user: one(users, {
		fields: [files.userId],
		references: [users.id],
	}),
}));

export const filesToWorkspaces = createTable(
	"file_to_workspace",
	{
		fileId: uuid()
			.notNull()
			.references(() => files.id),
		workspaceId: uuid()
			.notNull()
			.references(() => workspaces.id),
	},
	(t) => [primaryKey({ columns: [t.fileId, t.workspaceId] })],
);

export const filesToWorkspacesRelations = relations(
	filesToWorkspaces,
	({ one }) => ({
		file: one(files, {
			fields: [filesToWorkspaces.fileId],
			references: [files.id],
		}),
		workspace: one(workspaces, {
			fields: [filesToWorkspaces.workspaceId],
			references: [workspaces.id],
		}),
	}),
);
