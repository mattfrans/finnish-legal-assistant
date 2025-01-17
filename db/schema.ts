import { pgTable, text, serial, integer, boolean, timestamp, varchar, json, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations, type InferSelectModel } from "drizzle-orm";

// Enum for MFA methods
export const mfaMethodEnum = pgEnum('mfa_method', [
  'none',
  'totp',
  'email',
  'sms'
]);

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', [
  'free',
  'professional',
  'enterprise'
]);

// Enum for subscription status
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trial',
  'active',
  'cancelled',
  'expired'
]);

// Table for users with profile information
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  companyName: text('company_name'),
  position: text('position'),
  phoneNumber: text('phone_number'),
  role: userRoleEnum('role').default('free').notNull(),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('trial').notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  // Add MFA fields
  mfaEnabled: boolean('mfa_enabled').default(false).notNull(),
  mfaMethod: mfaMethodEnum('mfa_method').default('none').notNull(),
  mfaSecret: text('mfa_secret'),
  backupCodes: json('backup_codes').$type<string[]>().default([]),
  preferences: json('preferences').$type<{
    language?: 'fi' | 'en';
    notifications?: boolean;
    theme?: 'light' | 'dark' | 'system';
  }>().default({}).notNull()
});

// Chat sessions and queries
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  isPinned: boolean('is_pinned').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  createdAtIdx: index('sessions_created_at_idx').on(table.createdAt)
}));

export const queries = pgTable('queries', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  sources: json('sources').$type<Array<{
    title: string;
    link: string;
    section?: string;
    type: 'finlex' | 'kkv' | 'other';
    identifier?: string;
    relevance: number;
  }>>().default([]).notNull(),
  confidence: json('confidence').$type<{
    score: number;
    reasoning: string;
  }>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  attachments: json('attachments').$type<string[]>().default([])
}, (table) => ({
  sessionIdIdx: index('queries_session_id_idx').on(table.sessionId),
  userIdIdx: index('queries_user_id_idx').on(table.userId),
  createdAtIdx: index('queries_created_at_idx').on(table.createdAt)
}));

// Relations
export const sessionsRelations = relations(sessions, ({ many, one }) => ({
  queries: many(queries),
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}));

export const queriesRelations = relations(queries, ({ one }) => ({
  session: one(sessions, {
    fields: [queries.sessionId],
    references: [sessions.id]
  }),
  user: one(users, {
    fields: [queries.userId],
    references: [users.id]
  })
}));

// Schema exports
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);
export const insertQuerySchema = createInsertSchema(queries);
export const selectQuerySchema = createSelectSchema(queries);

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Query = typeof queries.$inferSelect;