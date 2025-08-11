import type { Block } from "@blocknote/core";
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
	jsonb,
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

export const subscriptionEnum = pgEnum("subscription_type", [
	"PRO",
	"PREMIUM",
	"FREE",
]);

export const messageRoleEnum = pgEnum("message_type", [
	"SYSTEM",
	"USER",
	"AGENT",
]);

export const formFieldTypeEnum = pgEnum("form_field_type", [
	"text",
	"textarea",
	"checkbox",
	"radio",
	"select",
	"switch",
	"slider",
	"email",
	"number",
	"date",
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
	subscription: subscriptionEnum().notNull().default("FREE"),
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

export const payments = createTable("payment", {
	id: customId.notNull().primaryKey(),
	userId: uuid()
		.notNull()
		.references(() => users.id),
	checkoutSessionId: text().notNull(),
	paymentIntentId: text().notNull(),
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

export const subscriptions = createTable("subscription", {
	id: customId.notNull().primaryKey(),
	userId: uuid()
		.notNull()
		.references(() => users.id),
	status: text().notNull(),
	subscriptionId: text().notNull(),
	currentPeriodEnd: text().notNull(),
	currentPeriodStart: text().notNull(),
	cancelAtPeriodEnd: boolean().notNull(),
	customerId: text().notNull(),
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

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
	user: one(users, {
		fields: [subscriptions.userId],
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
	quote: text(),
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
	content: json().$type<Block[]>(),
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

export const customers = createTable("customer", {
	id: customId.notNull().primaryKey(),
	customerId: text().notNull(),
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

export const customersRelations = relations(customers, ({ one }) => ({
	user: one(users, {
		fields: [customers.userId],
		references: [users.id],
	}),
}));

export const statics = createTable("statics", {
	id: customId.notNull().primaryKey(),
	userId: uuid()
		.notNull()
		.references(() => users.id)
		.unique(),
	workspaces: integer().notNull().default(0),
	files: integer().notNull().default(0),
	messages: integer().notNull().default(0),
	workspacesResetedAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	filesResetedAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
	messagesResetedAt: timestamp({
		mode: "date",
	})
		.notNull()
		.defaultNow(),
});

export const staticsRelations = relations(statics, ({ one }) => ({
	user: one(users, {
		fields: [statics.userId],
		references: [users.id],
	}),
}));

export const feedbacks = createTable("feedback", {
	id: customId,
	userId: uuid()
		.notNull()
		.references(() => users.id),
	content: text().notNull(),
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

export const feedbackRelations = relations(feedbacks, ({ one }) => ({
	user: one(users, {
		fields: [feedbacks.userId],
		references: [users.id],
	}),
}));

export const forms = createTable("form", {
	id: customId,
	title: text().notNull(),
	description: text(),
	userId: uuid()
		.notNull()
		.references(() => users.id),
});

export const formsRelations = relations(forms, ({ one, many }) => ({
	user: one(users, {
		fields: [forms.userId],
		references: [users.id],
	}),
	questionsToForms: many(questionsToForms),
	shareLinksToForms: many(shareLinksToForms),
}));

export const questionsToForms = createTable(
	"questions_to_forms",
	{
		questionId: uuid()
			.notNull()
			.references(() => questions.id),
		formId: uuid()
			.notNull()
			.references(() => forms.id),
	},
	(t) => [primaryKey({ columns: [t.questionId, t.formId] })],
);

export const questionsToFormsRelations = relations(
	questionsToForms,
	({ one }) => ({
		question: one(questions, {
			fields: [questionsToForms.questionId],
			references: [questions.id],
		}),
		form: one(forms, {
			fields: [questionsToForms.formId],
			references: [forms.id],
		}),
	}),
);

export const questions = createTable("question", {
	id: customId,
	type: formFieldTypeEnum().notNull(),
	description: text(),
	label: text().notNull(),
	placeholder: text(),
	required: boolean().notNull().default(false),
	min: integer(),
	max: integer(),
	step: integer(),
});

export const questionRelations = relations(questions, ({ many }) => ({
	questionsToForms: many(questionsToForms),
	questionsToExams: many(questionsToExams),
}));

export const questionOptions = createTable("question_option", {
	id: customId,
	questionId: uuid()
		.notNull()
		.references(() => questions.id),
	label: text().notNull(),
	value: text().notNull(),
});

export const questionOptionRelations = relations(
	questionOptions,
	({ one }) => ({
		question: one(questions, {
			fields: [questionOptions.questionId],
			references: [questions.id],
		}),
	}),
);

export const formResponses = createTable("form_response", {
	id: customId,
	email: text().notNull(),
	userId: uuid().references(() => users.id),
	formId: uuid()
		.references(() => forms.id)
		.notNull(),
	answers: jsonb().notNull(),
	shareLinkId: uuid()
		.references(() => shareLinks.id)
		.notNull(),
});

export const formResponseRelations = relations(formResponses, ({ one }) => ({
	user: one(users, {
		fields: [formResponses.userId],
		references: [users.id],
	}),
	form: one(forms, {
		fields: [formResponses.formId],
		references: [forms.id],
	}),
	shareLink: one(shareLinks, {
		fields: [formResponses.shareLinkId],
		references: [shareLinks.id],
	}),
}));

export const exams = createTable("exam", {
	id: customId,
	title: text().notNull(),
	instructions: text(),
	userId: uuid()
		.notNull()
		.references(() => users.id),
	answers: jsonb().notNull(),
});

export const examRelations = relations(exams, ({ one, many }) => ({
	user: one(users, {
		fields: [exams.userId],
		references: [users.id],
	}),
	questionsToExams: many(questionsToExams),
	shareLinksToExams: many(shareLinksToExams),
}));

export const examResponses = createTable("exam_response", {
	id: customId,
	email: text().notNull(),
	userId: uuid().references(() => users.id),
	examId: uuid()
		.references(() => exams.id)
		.notNull(),
	answers: jsonb().notNull(),
	shareLinkId: uuid()
		.references(() => shareLinks.id)
		.notNull(),
});

export const examResponsesRelations = relations(examResponses, ({ one }) => ({
	user: one(users, {
		fields: [examResponses.userId],
		references: [users.id],
	}),
	exam: one(exams, {
		fields: [examResponses.examId],
		references: [exams.id],
	}),
	shareLink: one(shareLinks, {
		fields: [examResponses.shareLinkId],
		references: [shareLinks.id],
	}),
}));

export const questionsToExams = createTable(
	"questions_to_exams",
	{
		questionId: uuid()
			.notNull()
			.references(() => questions.id),
		examId: uuid()
			.notNull()
			.references(() => exams.id),
	},
	(t) => [primaryKey({ columns: [t.questionId, t.examId] })],
);

export const questionsToExamsRelations = relations(
	questionsToExams,
	({ one }) => ({
		question: one(questions, {
			fields: [questionsToExams.questionId],
			references: [questions.id],
		}),
		exam: one(exams, {
			fields: [questionsToExams.examId],
			references: [exams.id],
		}),
	}),
);

export const shareLinks = createTable("share_link", {
	id: customId,
	key: text().notNull(),
});

export const shareLinksToForms = createTable(
	"share_links_to_forms",
	{
		shareLinkId: uuid()
			.notNull()
			.references(() => shareLinks.id),
		formId: uuid()
			.notNull()
			.references(() => forms.id),
	},
	(t) => [primaryKey({ columns: [t.shareLinkId, t.formId] })],
);

export const shareLinksToFormsRelations = relations(
	shareLinksToForms,
	({ one }) => ({
		shareLink: one(shareLinks, {
			fields: [shareLinksToForms.shareLinkId],
			references: [shareLinks.id],
		}),
		form: one(forms, {
			fields: [shareLinksToForms.formId],
			references: [forms.id],
		}),
	}),
);

export const shareLinksToExams = createTable(
	"share_links_to_exams",
	{
		shareLinkId: uuid()
			.notNull()
			.references(() => shareLinks.id),
		examId: uuid()
			.notNull()
			.references(() => exams.id),
	},
	(t) => [primaryKey({ columns: [t.shareLinkId, t.examId] })],
);

export const shareLinksToExamsRelations = relations(
	shareLinksToExams,
	({ one }) => ({
		shareLink: one(shareLinks, {
			fields: [shareLinksToExams.shareLinkId],
			references: [shareLinks.id],
		}),
		exam: one(exams, {
			fields: [shareLinksToExams.examId],
			references: [exams.id],
		}),
	}),
);
