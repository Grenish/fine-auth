/**
 * Base error class for all fine-auth errors
 */
export class FineAuthError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "FineAuthError";
    this.code = code;
  }
}

/**
 * Thrown when email/password credentials are invalid
 */
export class InvalidCredentialsError extends FineAuthError {
  constructor(message = "Invalid email or password") {
    super(message, "INVALID_CREDENTIALS");
    this.name = "InvalidCredentialsError";
  }
}

/**
 * Thrown when attempting to create a user that already exists
 */
export class UserAlreadyExistsError extends FineAuthError {
  constructor(message = "A user with this email already exists") {
    super(message, "USER_ALREADY_EXISTS");
    this.name = "UserAlreadyExistsError";
  }
}

/**
 * Thrown when a session is invalid or expired
 */
export class InvalidSessionError extends FineAuthError {
  constructor(message = "Invalid or expired session") {
    super(message, "INVALID_SESSION");
    this.name = "InvalidSessionError";
  }
}

/**
 * Thrown when database operations fail
 */
export class DatabaseError extends FineAuthError {
  constructor(message = "Database operation failed") {
    super(message, "DATABASE_ERROR");
    this.name = "DatabaseError";
  }
}

/**
 * Thrown when configuration is invalid
 */
export class ConfigurationError extends FineAuthError {
  constructor(message = "Invalid configuration") {
    super(message, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
  }
}
