// ============================================
// fine-auth - Auth that is just fine by default
// ============================================

// Main classes
export { FineAuth } from "./auth.ts";
export { Database } from "./database.ts";

// Error classes
export {
  FineAuthError,
  InvalidCredentialsError,
  UserAlreadyExistsError,
  InvalidSessionError,
  DatabaseError,
  ConfigurationError,
} from "./errors.ts";

// Types
export type {
  // User types
  User,
  SafeUser,
  // Session types
  Session,
  // Auth result types
  AuthResult,
  SessionValidationResult,
  // Config types
  FineAuthConfig,
  DatabaseConfig,
  DatabaseType,
  DatabaseAdapter,
  DatabaseInstance,
  // Credentials types
  SignUpCredentials,
  SignInCredentials,
  // PostgreSQL types (for users implementing custom adapters)
  PgPool,
} from "./types.ts";
