import { pgTable, text, serial, integer, boolean, timestamp, varchar, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations, type InferSelectModel } from "drizzle-orm";

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', [
  'free',
  'premium',
  'admin'
]);

// Enum for subscription statuses
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'cancelled',
  'expired',
  'trial'
]);

// Table for users with profile information
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  email: text('email').unique().notNull(),
  role: userRoleEnum('role').default('free').notNull(),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('trial').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  companyName: text('company_name'),
  position: text('position'),
  phoneNumber: text('phone_number'),
  lastLoginAt: timestamp('last_login_at'),
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  preferences: json('preferences').$type<{
    language?: 'fi' | 'en';
    notifications?: boolean;
    theme?: 'light' | 'dark' | 'system';
  }>().default({}).notNull()
});

// Export the User type
export type User = InferSelectModel<typeof users>;

// Enum for document template categories
export const templateCategoryEnum = pgEnum('template_category', [
  'contract',
  'agreement',
  'notice',
  'complaint',
  'other'
]);

// Table for legal documents
export const legalDocuments = pgTable('legal_documents', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(),
  identifier: text('identifier').unique().notNull(),
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

// Table for document sections with embeddings
export const documentSections = pgTable('document_sections', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').references(() => legalDocuments.id, { onDelete: 'cascade' }).notNull(),
  sectionNumber: varchar('section_number', { length: 50 }),
  title: text('title'),
  content: text('content').notNull(),
  embedding: text('embedding').notNull(),
  embedding_vector: text('embedding_vector').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Chat sessions and queries
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  isPinned: boolean('is_pinned').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

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
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Feedback and ratings
export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  queryId: integer('query_id').references(() => queries.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  helpful: boolean('helpful').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
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

export const sessionsRelations = relations(sessions, ({ many, one }) => ({
  queries: many(queries),
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}));

export const queriesRelations = relations(queries, ({ one, many }) => ({
  session: one(sessions, {
    fields: [queries.sessionId],
    references: [sessions.id]
  }),
  user: one(users, {
    fields: [queries.userId],
    references: [users.id]
  }),
  feedbacks: many(feedback)
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  query: one(queries, {
    fields: [feedback.queryId],
    references: [queries.id]
  }),
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id]
  })
}));

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  queries: many(queries),
  feedbacks: many(feedback)
}));

// Table for legal document templates
export const documentTemplates = pgTable('document_templates', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: templateCategoryEnum('category').notNull(),
  content: text('content').notNull(),
  variables: json('variables').$type<string[]>().default([]).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Schema exports
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertLegalDocumentSchema = createInsertSchema(legalDocuments);
export const selectLegalDocumentSchema = createSelectSchema(legalDocuments);
export const insertDocumentSectionSchema = createInsertSchema(documentSections);
export const selectDocumentSectionSchema = createSelectSchema(documentSections);
export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);
export const insertQuerySchema = createInsertSchema(queries);
export const selectQuerySchema = createSelectSchema(queries);
export const insertFeedbackSchema = createInsertSchema(feedback);
export const selectFeedbackSchema = createSelectSchema(feedback);
export const insertDocumentTemplateSchema = createInsertSchema(documentTemplates);
export const selectDocumentTemplateSchema = createSelectSchema(documentTemplates);