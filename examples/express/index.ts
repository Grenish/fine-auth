/**
 * fine-auth Express Example
 *
 * This example shows how to use fine-auth with Express.js
 *
 * Prerequisites:
 *   - npm install express pg
 *   - npm install -D @types/express @types/pg
 *
 * Environment variables:
 *   - DATABASE_URL: PostgreSQL connection string
 *   - SECRET: Secret key for session signing
 */

import express, { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import {
  FineAuth,
  Database,
  InvalidCredentialsError,
  UserAlreadyExistsError,
} from "fine-auth";

// ============================================
// Database Setup
// ============================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = new Database({
  type: "postgresql",
  client: pool,
});

// ============================================
// Auth Setup
// ============================================

const auth = new FineAuth({
  secret: process.env.SECRET || "your-secret-key",
  method: {
    email: true,
  },
  db: db,
  session: {
    expiresIn: "7d",
  },
});

// ============================================
// Express App
// ============================================

const app = express();
app.use(express.json());

// ============================================
// Middleware: Authenticate Request
// ============================================

interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; createdAt: Date };
  session?: { id: string; userId: string; expiresAt: Date; createdAt: Date };
}

async function authenticateRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // Get session ID from Authorization header or cookie
  const authHeader = req.headers.authorization;
  const sessionId = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.headers.cookie
        ?.split("; ")
        .find((c) => c.startsWith("session="))
        ?.split("=")[1];

  if (!sessionId) {
    return next();
  }

  const result = await auth.validateSession(sessionId);
  if (result) {
    req.user = result.user;
    req.session = result.session;
  }

  next();
}

// Middleware: Require Authentication
function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Apply authentication middleware to all routes
app.use(authenticateRequest);

// ============================================
// Routes
// ============================================

/**
 * POST /auth/signup
 * Create a new user account
 */
app.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { user, session } = await auth.signUp({ email, password });

    // Set session cookie
    res.cookie("session", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: session.expiresAt,
    });

    return res.status(201).json({
      message: "Account created successfully",
      user,
      sessionId: session.id,
    });
  } catch (error) {
    if (error instanceof UserAlreadyExistsError) {
      return res.status(409).json({ error: error.message });
    }
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /auth/signin
 * Sign in with email and password
 */
app.post("/auth/signin", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { user, session } = await auth.signIn({ email, password });

    // Set session cookie
    res.cookie("session", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: session.expiresAt,
    });

    return res.json({
      message: "Signed in successfully",
      user,
      sessionId: session.id,
    });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return res.status(401).json({ error: error.message });
    }
    console.error("Signin error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /auth/signout
 * Sign out and invalidate session
 */
app.post(
  "/auth/signout",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await auth.signOut(req.session!.id);

      // Clear session cookie
      res.clearCookie("session");

      return res.json({ message: "Signed out successfully" });
    } catch (error) {
      console.error("Signout error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /auth/me
 * Get current user info
 */
app.get("/auth/me", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

/**
 * GET /protected
 * Example protected route
 */
app.get(
  "/protected",
  requireAuth,
  (req: AuthenticatedRequest, res: Response) => {
    return res.json({
      message: "You have access to this protected resource!",
      user: req.user,
    });
  }
);

/**
 * GET /
 * Public route
 */
app.get("/", (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    return res.json({ message: `Hello, ${req.user.email}!` });
  }
  return res.json({ message: "Hello, guest! Please sign in." });
});

// ============================================
// Start Server
// ============================================

async function main() {
  // Run migrations
  await db.migrate();
  console.log("Database migrations complete");

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("\nAvailable routes:");
    console.log("  POST /auth/signup  - Create account");
    console.log("  POST /auth/signin  - Sign in");
    console.log("  POST /auth/signout - Sign out");
    console.log("  GET  /auth/me      - Get current user");
    console.log("  GET  /protected    - Protected route example");
    console.log("  GET  /            - Public route");
  });
}

main().catch(console.error);
