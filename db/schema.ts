import { pgTable, text, serial, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const queries = pgTable("queries", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sources: json("sources").notNull().$type<{
    link: string;
    title: string;
    section?: string;
  }[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuerySchema = createInsertSchema(queries);
export const selectQuerySchema = createSelectSchema(queries);
