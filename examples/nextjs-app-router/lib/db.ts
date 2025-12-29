/**
 * fine-auth Database Setup for Next.js
 *
 * This file sets up the database connection and exports the Database instance.
 *
 * Prerequisites:
 *   - npm install pg
 *   - npm install -D @types/pg
 *
 * Environment variables:
 *   - DATABASE_URL: PostgreSQL connection string
 */

import { Pool } from "pg";
import { Database } from "fine-auth";

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the fine-auth Database instance
export const db = new Database({
  type: "postgresql",
  client: pool,
});
