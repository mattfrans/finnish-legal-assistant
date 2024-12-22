import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import ws from "ws";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Initializing database connection...');

export const db = drizzle({
  connection: process.env.DATABASE_URL,
  schema,
  ws: ws,
});

// Test the connection
const testConnection = async () => {
  try {
    const result = await db.execute(sql`SELECT 1`);
    console.log('Database connection test successful');
  } catch (error) {
    console.error('Database connection test failed:', error);
    throw error;
  }
};

// Run the test immediately
testConnection().catch(error => {
  console.error('Failed to initialize database:', error);
  throw error;
});

console.log('Database connection initialized');