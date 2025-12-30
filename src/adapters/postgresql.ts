import type {
  DatabaseAdapter,
  User,
  Session,
  PgPool,
  PgUserRow,
  PgSessionRow,
} from "../types.ts";
import { generateUserId } from "../crypto.ts";

/**
 * PostgreSQL adapter for fine-auth
 * Uses the 'pg' package interface
 */
export function createPostgresqlAdapter(pool: PgPool): DatabaseAdapter {
  return {
    async createUser(data) {
      const id = generateUserId();
      const result = await pool.query<PgUserRow>(
        `INSERT INTO users (id, email, hashed_password, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, email, hashed_password, created_at`,
        [id, data.email.toLowerCase(), data.hashedPassword]
      );

      const row = result.rows[0];
      if (!row) {
        throw new Error("Failed to create user");
      }

      return {
        id: row.id,
        email: row.email,
        hashedPassword: row.hashed_password,
        createdAt: row.created_at,
      };
    },

    async getUserByEmail(email) {
      const result = await pool.query<PgUserRow>(
        `SELECT id, email, hashed_password, created_at
         FROM users
         WHERE email = $1`,
        [email.toLowerCase()]
      );

      const row = result.rows[0];
      if (!row) {
        return null;
      }

      return {
        id: row.id,
        email: row.email,
        hashedPassword: row.hashed_password,
        createdAt: row.created_at,
      };
    },

    async getUserById(id) {
      const result = await pool.query<PgUserRow>(
        `SELECT id, email, hashed_password, created_at
         FROM users
         WHERE id = $1`,
        [id]
      );

      const row = result.rows[0];
      if (!row) {
        return null;
      }

      return {
        id: row.id,
        email: row.email,
        hashedPassword: row.hashed_password,
        createdAt: row.created_at,
      };
    },

    async createSession(data) {
      const result = await pool.query<PgSessionRow>(
        `INSERT INTO sessions (id, user_id, expires_at, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, user_id, expires_at, created_at`,
        [data.id, data.userId, data.expiresAt]
      );

      const row = result.rows[0];
      if (!row) {
        throw new Error("Failed to create session");
      }

      return {
        id: row.id,
        userId: row.user_id,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      };
    },

    async getSession(id) {
      const result = await pool.query<PgSessionRow>(
        `SELECT id, user_id, expires_at, created_at
         FROM sessions
         WHERE id = $1`,
        [id]
      );

      const row = result.rows[0];
      if (!row) {
        return null;
      }

      return {
        id: row.id,
        userId: row.user_id,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      };
    },

    async deleteSession(id) {
      await pool.query(`DELETE FROM sessions WHERE id = $1`, [id]);
    },

    async deleteUserSessions(userId) {
      await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
    },

    async migrate() {
      // Create users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          hashed_password TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Create index on email (lowercase) for faster lookups
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email))
      `);

      // Create sessions table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Create index on user_id for faster session lookups
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id)
      `);

      // Create index on expires_at for cleanup queries
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at)
      `);
    },
  };
}
