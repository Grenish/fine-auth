import { describe, test, expect, beforeAll, beforeEach } from "bun:test";
import { FineAuth, Database } from "../src/index";

describe("FineAuth - Email/Password Authentication", () => {
  let auth: FineAuth;
  let db: Database;

  // Create fresh instances before each test
  beforeEach(() => {
    db = new Database({
      type: "memory",
    });

    auth = new FineAuth({
      secret: "test-secret-key",
      method: {
        email: true,
      },
      db: db,
    });
  });

  describe("signUp", () => {
    test("should create a new user with lowercase email", async () => {
      const result = await auth.signUp({
        email: "TestUser@Example.com",
        password: "password123",
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe("testuser@example.com"); // Should be lowercase
      expect(result.user.id).toBeDefined();
      expect(result.user.createdAt).toBeInstanceOf(Date);
      expect(result.session).toBeDefined();
      expect(result.session.id).toBeDefined();
      expect(result.session.userId).toBe(result.user.id);
      expect(result.token).toBeDefined();
      expect(result.token).toContain(".");
    });

    test("should trim whitespace from email", async () => {
      const result = await auth.signUp({
        email: "  spaced@example.com  ",
        password: "password123",
      });

      expect(result.user.email).toBe("spaced@example.com");
    });

    test("should throw error if user already exists (case-insensitive)", async () => {
      await auth.signUp({
        email: "user@example.com",
        password: "password123",
      });

      // Try to sign up with same email but different case
      expect(async () => {
        await auth.signUp({
          email: "User@Example.COM",
          password: "differentpassword",
        });
      }).toThrow();
    });

    test("should create session with correct expiry", async () => {
      const result = await auth.signUp({
        email: "user@example.com",
        password: "password123",
      });

      const now = Date.now();
      const expiryTime = result.session.expiresAt.getTime();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      // Should expire in approximately 7 days (with 1 minute tolerance)
      expect(expiryTime).toBeGreaterThan(now + sevenDaysMs - 60000);
      expect(expiryTime).toBeLessThan(now + sevenDaysMs + 60000);
    });
  });

  describe("signIn", () => {
    beforeEach(async () => {
      // Create a test user
      await auth.signUp({
        email: "test@example.com",
        password: "password123",
      });
    });

    test("should sign in with correct credentials", async () => {
      const result = await auth.signIn({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe("test@example.com");
      expect(result.session).toBeDefined();
      expect(result.session.userId).toBe(result.user.id);
      expect(result.token).toBeDefined();
    });

    test("should sign in with case-insensitive email", async () => {
      const result = await auth.signIn({
        email: "TEST@EXAMPLE.COM",
        password: "password123",
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe("test@example.com");
    });

    test("should sign in with email that has whitespace", async () => {
      const result = await auth.signIn({
        email: "  test@example.com  ",
        password: "password123",
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe("test@example.com");
    });

    test("should throw error for non-existent user", async () => {
      expect(async () => {
        await auth.signIn({
          email: "nonexistent@example.com",
          password: "password123",
        });
      }).toThrow("Invalid email or password");
    });

    test("should throw error for wrong password", async () => {
      expect(async () => {
        await auth.signIn({
          email: "test@example.com",
          password: "wrongpassword",
        });
      }).toThrow("Invalid email or password");
    });

    test("should create a new session each time", async () => {
      const result1 = await auth.signIn({
        email: "test@example.com",
        password: "password123",
      });

      const result2 = await auth.signIn({
        email: "test@example.com",
        password: "password123",
      });

      expect(result1.session.id).not.toBe(result2.session.id);
      expect(result1.token).not.toBe(result2.token);
    });
  });

  describe("validateSession", () => {
    test("should validate a valid session token", async () => {
      const { session, token } = await auth.signUp({
        email: "user@example.com",
        password: "password123",
      });

      const result = await auth.validateSession(token);

      expect(result).not.toBeNull();
      expect(result?.user.email).toBe("user@example.com");
      expect(result?.session.id).toBe(session.id);
    });

    test("should return null for invalid token format", async () => {
      const result = await auth.validateSession("invalid-token-format");

      expect(result).toBeNull();
    });

    test("should return null for tampered token", async () => {
      const { token } = await auth.signUp({
        email: "user@example.com",
        password: "password123",
      });

      const tamperedToken = token + "modified";
      const result = await auth.validateSession(tamperedToken);

      expect(result).toBeNull();
    });

    test("should return null for expired session", async () => {
      // Create auth with very short session expiry
      const shortAuth = new FineAuth({
        secret: "test-secret",
        method: { email: true },
        db: db,
        session: { expiresIn: "1ms" }, // 1 millisecond
      });

      const { token } = await shortAuth.signUp({
        email: "shortlived@example.com",
        password: "password123",
      });

      // Wait for session to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await shortAuth.validateSession(token);

      expect(result).toBeNull();
    });
  });

  describe("signOut", () => {
    test("should invalidate a session by token", async () => {
      const { session, token } = await auth.signUp({
        email: "user@example.com",
        password: "password123",
      });

      await auth.signOut(token);

      // Verify db session is gone
      const dbSession = await db.adapter.getSession(session.id);
      expect(dbSession).toBeNull();

      // Verify validation fails
      const result = await auth.validateSession(token);
      expect(result).toBeNull();
    });

    test("should not throw error for non-existent session/token", async () => {
      await auth.signOut("non-existent-token");
      // If we get here without throwing, the test passes
      expect(true).toBe(true);
    });
  });

  describe("signOutAll", () => {
    test("should invalidate all user sessions", async () => {
      const { user } = await auth.signUp({
        email: "user@example.com",
        password: "password123",
      });

      // Create multiple sessions
      const session1 = await auth.signIn({
        email: "user@example.com",
        password: "password123",
      });

      const session2 = await auth.signIn({
        email: "user@example.com",
        password: "password123",
      });

      // Sign out from all sessions
      await auth.signOutAll(user.id);

      // All sessions should be invalid
      const result1 = await auth.validateSession(session1.token);
      const result2 = await auth.validateSession(session2.token);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe("Case Sensitivity Bug Fix", () => {
    test("should handle signup and signin with different email cases", async () => {
      // Sign up with mixed case
      const signupResult = await auth.signUp({
        email: "BugUser@Example.COM",
        password: "password123",
      });

      expect(signupResult.user.email).toBe("buguser@example.com");

      // Sign in with different case
      const signinResult = await auth.signIn({
        email: "buguser@example.com",
        password: "password123",
      });

      expect(signinResult.user.id).toBe(signupResult.user.id);
      expect(signinResult.user.email).toBe("buguser@example.com");
    });

    test("should handle all uppercase email", async () => {
      await auth.signUp({
        email: "UPPERCASE@EXAMPLE.COM",
        password: "password123",
      });

      const result = await auth.signIn({
        email: "UPPERCASE@EXAMPLE.COM",
        password: "password123",
      });

      expect(result.user.email).toBe("uppercase@example.com");
    });

    test("should handle random mixed case", async () => {
      await auth.signUp({
        email: "RaNdOm@ExAmPlE.cOm",
        password: "password123",
      });

      const result = await auth.signIn({
        email: "random@example.com",
        password: "password123",
      });

      expect(result.user.email).toBe("random@example.com");
    });
  });
});
