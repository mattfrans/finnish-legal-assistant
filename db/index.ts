import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Initializing database connection...');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// Test the connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
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