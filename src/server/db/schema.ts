import { relations, sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";
import { typeid } from 'typeid-js';

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `buuddy_${name}`);

export const genderEnum = pgEnum('gender', ["MALE", "FEMALE"]);
export const suscriptionEnum = pgEnum('suscription', ["BASIC", "PREMIUM"]);
export const educationLevelEnum = pgEnum('educationLevel', ["HIGH_SCHOOL", "TECH_SCHOOL", "IN_COLLEGE", "GRADUATE_DEGREE"]);
export const exerciseEnum = pgEnum('exercise', ["ACTIVE", "SOMETIMES", "ALMOST_NEVER"]);
export const drinkingEnum = pgEnum('drinking', ["SOCIALLY", "NEVER", "FREQUENTLY", "SOBER"]);
export const smokingEnum = pgEnum('smoking', ["SOCIALLY", "NEVER", "REGULARLY"]);
export const weekDaysEnum = pgEnum('weekDays', ["MON", "TUE", "WED", "THU", "FRI", "SUN", "SAT"]);

export const users = createTable("user", {
  id: uuid("id").notNull().primaryKey().$defaultFn(() => {
    return typeid().toUUID()
  }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  phoneNumber: text("phoneNumber"),
  phoneNumberVerified: timestamp("phoneNumberVerified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: text("image").notNull(),
  verified: boolean("verified").notNull().default(false),
  suscription: suscriptionEnum("suscription").notNull().default("BASIC"),
  buuddyMode: boolean("buuddyMode").notNull().default(false),
  location: text("location"),
  createdAt: timestamp('createdAt', {
    mode: 'date'
  }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', {
    mode: 'date'
  }).notNull().defaultNow()
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  userRoles: many(userRoles)
}));

export const userAnalytics = createTable(
  "user_analytic",
  {
    id: uuid("id").notNull().primaryKey().$defaultFn(() => {
      return typeid().toUUID()
    }),
    likes: bigserial('likes', { mode: "number" }).notNull(),
    rating: integer("rating").notNull().default(0),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id),
  }
);

export const profiles = createTable(
  "profile",
  {
    id: uuid("id").notNull().primaryKey().$defaultFn(() => {
      return typeid().toUUID()
    }),
    about: text("about"),
    gender: genderEnum("gender"),
    work: text("work"),
    birthday: text("birthday"),
    whatLoves: text("whatLoves"),
    nickname: text("nickname"),
    pets: text("pets"),
    educationLevel: educationLevelEnum("educationLevel"),
    exercise: exerciseEnum("exercise"),
    drinking: drinkingEnum("drinking"),
    smoking: smokingEnum("smoking"),
    completed: boolean("completed").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id),
  }
);

export const accounts = createTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id),
    type: text("type")
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
    createdAt: timestamp('createdAt', {
      mode: 'date'
    }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', {
      mode: 'date'
    }).notNull().defaultNow()
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_userId_idx").on(account.userId),
  })
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: text("sessionToken")
      .notNull()
      .primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp('createdAt', {
      mode: 'date'
    }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', {
      mode: 'date'
    }).notNull().defaultNow()
  },
  (session) => ({
    userIdIdx: index("session_userId_idx").on(session.userId),
  })
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
  })
);

export const languages = createTable(
  "language",
  {
    id: uuid("id").notNull().primaryKey().$defaultFn(() => {
      return typeid().toUUID()
    }),
    name: text("name").notNull().unique()
  }
);

export const usersToLanguages = createTable(
  "user_to_language",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id),
    languageId: uuid("languageId")
      .notNull()
      .references(() => languages.id),
  },
  (t) => ({
    pk: primaryKey({
      name: "userId_languageId",
      columns: [t.userId, t.languageId]
    }),
  })
)

export const interests = createTable(
  "interest",
  {
    id: uuid("id").notNull().primaryKey().$defaultFn(() => {
      return typeid().toUUID()
    }),
    name: text("name").notNull().unique()
  }
);

export const usersToInterests = createTable(
  "user_to_interest",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id),
    interestId: uuid("interestId")
      .notNull()
      .references(() => interests.id),
  },
  (t) => ({
    pk: primaryKey({
      name: "userId_interestId",
      columns: [t.userId, t.interestId]
    }),
  })
);

export const reviews = createTable(
  "review",
  {
    id: uuid("id").notNull().primaryKey().$defaultFn(() => {
      return typeid().toUUID()
    }),
    comment: text("comment").notNull(),
    rating: integer("rate").notNull(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id),
    reviewerId: uuid("userId")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('createdAt', {
      mode: 'date'
    }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', {
      mode: 'date'
    }).notNull().defaultNow()
  }
);

export const roles = createTable(
  "role",
  {
    id: uuid("id").notNull().primaryKey().$defaultFn(() => {
      return typeid().toUUID()
    }),
    name: text("name").notNull().unique(),
    description: text("description").notNull()
  }
);

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles)
}));

export const userRoles = createTable(
  "user_role",
  {
    id: uuid("id").notNull().primaryKey().$defaultFn(() => {
      return typeid().toUUID()
    }),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id),
    roleId: uuid("roleId")
      .notNull()
      .references(() => roles.id),
    hourPrice: numeric('hourPrice').notNull(),
    description: text("description").notNull(),
    createdAt: timestamp('createdAt', {
      mode: 'date'
    }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', {
      mode: 'date'
    }).notNull().defaultNow(),
    deletedAt: timestamp('deletedAt', {
      mode: 'date'
    })
  }
);

export const userRolesRelations = relations(userRoles, ({ one, many }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id]
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id]
  }),
  userRoleDetails: many(userRoleDetails)
}));

export const userRoleDetails = createTable(
  "user_role_detail",
  {
    id: uuid("id").notNull().primaryKey().$defaultFn(() => {
      return typeid().toUUID()
    }),
    userRoleId: uuid("userRoleId")
      .notNull()
      .references(() => userRoles.id),
    description: text("description").notNull(),
    allowed: boolean("allowed").notNull().default(true),
  }
);

export const userRoleDetailsRelations = relations(userRoleDetails, ({ one }) => ({
  userRole: one(userRoles, {
    fields: [userRoleDetails.userRoleId],
    references: [userRoles.id]
  }),
}));

export const weeklyDays = createTable(
  "weekly_day",
  {
    id: uuid("id").notNull().primaryKey().$defaultFn(() => {
      return typeid().toUUID()
    }),
    name: weekDaysEnum("name").notNull().unique(),
    order: integer("order")
  }
);

export const usersToWeeklydays = createTable(
  "user_to_weekly_day",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id),
    weeklyDayId: uuid("weeklyDayId")
      .notNull()
      .references(() => weeklyDays.id),
  },
  (t) => ({
    pk: primaryKey({
      name: "userId_weeklydayId",
      columns: [t.userId, t.weeklyDayId]
    }),
  })
);

export const userTimes = createTable(
  "userTime",
  {
    id: uuid("id").notNull().primaryKey().$defaultFn(() => {
      return typeid().toUUID()
    }),
    userRoleId: uuid("userRoleId")
      .notNull()
      .references(() => userRoles.id),
    startTime: text("startTime").notNull(),
    endTime: text("endTime").notNull(),
    weeklyDayId: uuid("weeklyDayId")
      .notNull()
      .references(() => weeklyDays.id),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('createdAt', {
      mode: 'date'
    }).notNull().defaultNow(),
  }
);