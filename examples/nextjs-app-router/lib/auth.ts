/**
 * fine-auth setup for Next.js App Router
 *
 * This file initializes FineAuth with PostgreSQL database
 */

import { FineAuth } from "fine-auth";
import { db } from "./db";

export const auth = new FineAuth({
  secret: process.env.SECRET!,
  method: {
    email: true,
  },
  db: db,
  session: {
    expiresIn: "7d",
  },
});

/**
 * Cookie configuration for sessions
 */
export const sessionCookieConfig = {
  name: "session",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
