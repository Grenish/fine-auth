// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  email: string;
  hashedPassword: string;
  createdAt: Date;
}

// User without sensitive data (for returning to client)
export type SafeUser = Omit<User, "hashedPassword">;

// ============================================
// Session Types
// ============================================

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

// ============================================
// Auth Result Types
// ============================================

export interface AuthResult {
  user: SafeUser;
  session: Session;
}

export type SessionValidationResult = {
  user: SafeUser;
  session: Session;
} | null;

// ============================================
// Configuration Types
// ============================================

export interface FineAuthConfig {
  secret: string;
  method: {
    email?: boolean;
  };
  db: DatabaseInstance;
  session?: {
    expiresIn?: string | number; // e.g., '7d' or milliseconds
  };
}

// ============================================
// Database Types
// ============================================

export type DatabaseType =
  | "postgresql"
  | "mongodb"
  | "mongoose"
  | "prisma"
  | "drizzle-pg"
  | "drizzle-mysql"
  | "better-sqlite3"
  | "memory";

export interface DatabaseConfig {
  type: DatabaseType;
  client?: unknown;
}

// Internal database adapter interface
export interface DatabaseAdapter {
  // User operations
  createUser(data: { email: string; hashedPassword: string }): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;

  // Session operations
  createSession(data: {
    id: string;
    userId: string;
    expiresAt: Date;
  }): Promise<Session>;
  getSession(id: string): Promise<Session | null>;
  deleteSession(id: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;

  // Migration
  migrate(): Promise<void>;
}

// The Database class instance type
export interface DatabaseInstance {
  adapter: DatabaseAdapter;
  migrate(): Promise<void>;
}

// ============================================
// Credentials Types
// ============================================

export interface SignUpCredentials {
  email: string;
  password: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

// ============================================
// PostgreSQL Specific Types
// ============================================

// Minimal pg.Pool interface (what we need from the 'pg' package)
export interface PgPool {
  query<T = unknown>(
    text: string,
    values?: unknown[]
  ): Promise<{ rows: T[]; rowCount: number | null }>;
}

// PostgreSQL row types (snake_case as returned from DB)
export interface PgUserRow {
  id: string;
  email: string;
  hashed_password: string;
  created_at: Date;
}

export interface PgSessionRow {
  id: string;
  user_id: string;
  expires_at: Date;
  created_at: Date;
}
