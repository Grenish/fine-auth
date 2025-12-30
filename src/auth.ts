import type {
  FineAuthConfig,
  DatabaseInstance,
  AuthResult,
  SessionValidationResult,
  SignUpCredentials,
  SignInCredentials,
  SafeUser,
} from "./types.ts";
import { hashPassword, verifyPassword, generateSessionId } from "./crypto.ts";
import {
  InvalidCredentialsError,
  UserAlreadyExistsError,
  ConfigurationError,
} from "./errors.ts";

/**
 * Parse duration string to milliseconds
 * Supports: '1d', '7d', '30d', '1h', '30m', etc.
 */
function parseDuration(duration: string | number): number {
  if (typeof duration === "number") {
    return duration;
  }

  const match = duration.match(/^(\d+)(ms|s|m|h|d)$/);
  if (!match) {
    throw new ConfigurationError(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1]!, 10);
  const unit = match[2];

  switch (unit) {
    case "ms":
      return value;
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new ConfigurationError(`Unknown duration unit: ${unit}`);
  }
}

/**
 * Remove sensitive fields from user object
 */
function toSafeUser(user: {
  id: string;
  email: string;
  hashedPassword: string;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}

/**
 * Main authentication class
 */
export class FineAuth {
  private config: FineAuthConfig;
  private db: DatabaseInstance;
  private sessionExpiresIn: number;

  constructor(config: FineAuthConfig) {
    // Validate required config
    if (!config.secret) {
      throw new ConfigurationError("secret is required");
    }

    if (!config.db) {
      throw new ConfigurationError("db is required");
    }

    if (!config.method || !config.method.email) {
      throw new ConfigurationError("At least one auth method must be enabled");
    }

    this.config = config;
    this.db = config.db;

    // Default session expiry: 7 days
    this.sessionExpiresIn = config.session?.expiresIn
      ? parseDuration(config.session.expiresIn)
      : parseDuration("7d");
  }

  /**
   * Sign up a new user with email and password
   * Creates user and session, returns both
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthResult> {
    const { email, password } = credentials;

    // Normalize email to lowercase for case-insensitive matching
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await this.db.adapter.getUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await this.db.adapter.createUser({
      email: normalizedEmail,
      hashedPassword,
    });

    // Create session
    const session = await this.db.adapter.createSession({
      id: generateSessionId(),
      userId: user.id,
      expiresAt: new Date(Date.now() + this.sessionExpiresIn),
    });

    return {
      user: toSafeUser(user),
      session,
    };
  }

  /**
   * Sign in with email and password
   * Validates credentials and creates a new session
   */
  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    const { email, password } = credentials;

    // Normalize email to lowercase for case-insensitive matching
    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await this.db.adapter.getUserByEmail(normalizedEmail);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.hashedPassword);
    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    // Create new session
    const session = await this.db.adapter.createSession({
      id: generateSessionId(),
      userId: user.id,
      expiresAt: new Date(Date.now() + this.sessionExpiresIn),
    });

    return {
      user: toSafeUser(user),
      session,
    };
  }

  /**
   * Validate a session by ID
   * Returns user and session if valid, null if invalid or expired
   */
  async validateSession(sessionId: string): Promise<SessionValidationResult> {
    // Get session
    const session = await this.db.adapter.getSession(sessionId);
    if (!session) {
      return null;
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
      // Clean up expired session
      await this.db.adapter.deleteSession(sessionId);
      return null;
    }

    // Get user
    const user = await this.db.adapter.getUserById(session.userId);
    if (!user) {
      // User was deleted, clean up session
      await this.db.adapter.deleteSession(sessionId);
      return null;
    }

    return {
      user: toSafeUser(user),
      session,
    };
  }

  /**
   * Sign out by invalidating a session
   */
  async signOut(sessionId: string): Promise<void> {
    await this.db.adapter.deleteSession(sessionId);
  }

  /**
   * Sign out from all sessions for a user
   */
  async signOutAll(userId: string): Promise<void> {
    await this.db.adapter.deleteUserSessions(userId);
  }
}
