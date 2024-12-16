import { pgTable, text, serial, timestamp, json, integer, varchar, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Chat sessions table to group related queries
export const chatSessions = pgTable('chat_sessions', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
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
    type?: 'finlex' | 'kkv' | 'other';
    identifier?: string;
    relevance: number;
  }>>().default([]).notNull(),
  attachments: json('attachments').$type<Array<{
    type: 'image' | 'document';
    filename: string;
    url: string;
    contentType: string;
    size: number;
  }>>().default([]),
  legalContext: text('legal_context'),
  confidence: json('confidence').$type<{
    score: number;
    reasoning: string;
  }>(),
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

// Enum for document types
export const documentTypeEnum = pgEnum('document_type', ['statute', 'case_law', 'guideline']);

// Table for storing legal documents from Finlex
export const legalDocuments = pgTable('legal_documents', {
  id: serial('id').primaryKey(),
  type: documentTypeEnum('type').notNull(),
  identifier: varchar('identifier', { length: 50 }).notNull().unique(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  url: text('url').notNull(),
  publishedAt: timestamp('published_at').notNull(),
  effectiveFrom: timestamp('effective_from'),
  effectiveTo: timestamp('effective_to'),
  metadata: json('metadata').$type<{
    category?: string;
    ministry?: string;
    amendments?: string[];
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Table for storing document sections with embeddings
export const documentSections = pgTable('document_sections', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => legalDocuments.id, { onDelete: 'cascade' }).notNull(),
  sectionNumber: varchar('section_number', { length: 50 }),
  title: text('title'),
  content: text('content').notNull(),
  embedding: text('embedding').notNull(), // Base64 encoded embedding
  embedding_vector: text('embedding_vector').notNull(), // Will be converted to vector in migration
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const legalDocumentsRelations = relations(legalDocuments, ({ many }) => ({
  sections: many(documentSections)
}));

export const documentSectionsRelations = relations(documentSections, ({ one }) => ({
  document: one(legalDocuments, {
    fields: [documentSections.documentId],
    references: [legalDocuments.id]
  })
}));

// Zod schemas
export const insertLegalDocumentSchema = createInsertSchema(legalDocuments);
export const selectLegalDocumentSchema = createSelectSchema(legalDocuments);
// Feedback and ratings for chat responses
export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  queryId: integer('query_id').references(() => queries.id, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  helpful: boolean('helpful').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Relations for feedback
export const feedbackRelations = relations(feedback, ({ one }) => ({
  query: one(queries, {
    fields: [feedback.queryId],
    references: [queries.id]
  })
}));

// Schema exports
export const insertFeedbackSchema = createInsertSchema(feedback);
export const selectFeedbackSchema = createSelectSchema(feedback);
export const insertDocumentSectionSchema = createInsertSchema(documentSections);
export const selectDocumentSectionSchema = createSelectSchema(documentSections);
