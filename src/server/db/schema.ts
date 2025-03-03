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

export const messageRoleEnum = pgEnum("messageType", [
	"SYSTEM",
	"USER",
	"AGENT",
]);

export const users = createTable("user", {
	id: customId.notNull().primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull(),
	emailVerified: timestamp("emailVerified", {
		mode: "date",
		withTimezone: true,
	}).default(sql`CURRENT_TIMESTAMP`),
	image: text("image").notNull(),
	verified: boolean("verified").notNull().default(false),
	suscription: suscriptionEnum("suscription").notNull().default("FREE"),
	onBoardingCompleted: boolean("onBoardingCompleted").notNull().default(false),
	createdAt: timestamp("createdAt", {
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updatedAt", {
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
		userId: uuid("userId")
			.notNull()
			.references(() => users.id),
		type: text("type").$type<AdapterAccount["type"]>().notNull(),
		provider: text("provider").notNull(),
		providerAccountId: text("providerAccountId").notNull(),
		refresh_token: text("refresh_token"),
		access_token: text("access_token"),
		expires_at: integer("expires_at"),
		token_type: text("token_type"),
		scope: text("scope"),
		id_token: text("id_token"),
		session_state: text("session_state"),
		createdAt: timestamp("createdAt", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updatedAt", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),
	},
	(account) => ({
		compoundKey: primaryKey({
			columns: [account.provider, account.providerAccountId],
		}),
		userIdIdx: index("account_userId_idx").on(account.userId),
	}),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
	"session",
	{
		sessionToken: text("sessionToken").notNull().primaryKey(),
		userId: uuid("userId")
			.notNull()
			.references(() => users.id),
		expires: timestamp("expires", {
			mode: "date",
			withTimezone: true,
		}).notNull(),
		createdAt: timestamp("createdAt", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updatedAt", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),
	},
	(session) => ({
		userIdIdx: index("session_userId_idx").on(session.userId),
	}),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
	"verificationToken",
	{
		identifier: text("identifier").notNull(),
		token: text("token").notNull(),
		expires: timestamp("expires", {
			mode: "date",
			withTimezone: true,
		}).notNull(),
	},
	(vt) => ({
		compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
	}),
);

export const notifications = createTable("notification", {
	id: customId.notNull().primaryKey(),
	content: text("content").notNull(),
	iconUrl: text("iconUrl").notNull(),
	link: text("link").notNull(),
	seen: boolean("seen").notNull().default(false),
	receiverId: uuid("receiverId")
		.notNull()
		.references(() => users.id),
	createdAt: timestamp("createdAt", {
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updatedAt", {
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
	userId: uuid("userId")
		.notNull()
		.references(() => users.id),
	checkoutSessionId: text("checkoutSessionId").notNull(),
	paymentIntentId: text("paymentIntentId").notNull(),
	paymentType: paymentTypeEnum("paymentType").notNull(),
	createdAt: timestamp("createdAt", {
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updatedAt", {
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

export const notebooks = createTable("notebook", {
	id: customId.notNull().primaryKey(),
	name: text("name").notNull(),
	userId: uuid("userId")
		.notNull()
		.references(() => users.id),
	chatId: uuid("chatId")
		.notNull()
		.references(() => chats.id),
	noteId: uuid("noteId")
		.notNull()
		.references(() => notes.id),
	summaryId: uuid("summaryId")
		.notNull()
		.references(() => summaries.id),
	createdAt: timestamp("createdAt", {
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updatedAt", {
		mode: "date",
	})
		.notNull()
		.defaultNow(),
});

export const notebooksRelations = relations(notebooks, ({ one }) => ({
	user: one(users, {
		fields: [notebooks.userId],
		references: [users.id],
	}),
	chat: one(chats, {
		fields: [notebooks.chatId],
		references: [chats.id],
	}),
	summary: one(summaries, {
		fields: [notebooks.summaryId],
		references: [summaries.id],
	}),
	note: one(notes, {
		fields: [notebooks.noteId],
		references: [notes.id],
	}),
}));

export const chats = createTable("chat", {
	id: customId.notNull().primaryKey(),
	userId: uuid("userId")
		.notNull()
		.references(() => users.id),
	createdAt: timestamp("createdAt", {
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updatedAt", {
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
	chatId: uuid("chatId")
		.notNull()
		.references(() => chats.id),
	content: text("content").notNull(),
	role: messageRoleEnum("role").notNull().default("SYSTEM"),
	userId: uuid("userId")
		.notNull()
		.references(() => users.id),
	createdAt: timestamp("createdAt", {
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updatedAt", {
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
	content: text("content").notNull(),
	userId: uuid("userId")
		.notNull()
		.references(() => users.id),
	createdAt: timestamp("createdAt", {
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updatedAt", {
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

type Block = {
	id: string;
	type: string;
	data: any;
};

type NoteContent = {
	time: number;
	blocks: Block[];
	version: string;
};

export const notes = createTable("note", {
	id: customId.notNull().primaryKey(),
	content: json("content")
		.default(defaultJsonContent)
		.$type<NoteContent>()
		.notNull(),
	userId: uuid("userId")
		.notNull()
		.references(() => users.id),
	createdAt: timestamp("createdAt", {
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updatedAt", {
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
