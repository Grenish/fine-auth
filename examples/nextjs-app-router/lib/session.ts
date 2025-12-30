import { cookies } from "next/headers";
import { auth } from "./auth";

/**
 * Get the current session from cookies
 * Use this in Server Components and Route Handlers
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  return auth.validateSession(token);
}

/**
 * Get the current user from session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getSession();
  return session !== null;
}
