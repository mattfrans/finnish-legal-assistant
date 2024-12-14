import { pgTable, text, serial, timestamp, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Chat sessions table to group related queries
export const chatSessions = pgTable('chat_sessions', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Individual queries within a chat session
export const queries = pgTable('queries', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => chatSessions.id, { onDelete: 'cascade' }).notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  sources: json('sources').$type<Array<{
    link: string;
    title: string;
    section?: string;
  }>>().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Define relationships between tables
export const chatSessionsRelations = relations(chatSessions, ({ many }) => ({
  queries: many(queries)
}));

export const queriesRelations = relations(queries, ({ one }) => ({
  session: one(chatSessions, {
    fields: [queries.sessionId],
    references: [chatSessions.id]
  })
}));

// Zod schemas for validation
export const insertChatSessionSchema = createInsertSchema(chatSessions);
export const selectChatSessionSchema = createSelectSchema(chatSessions);
export const insertQuerySchema = createInsertSchema(queries);
export const selectQuerySchema = createSelectSchema(queries);
