import type { DatabaseAdapter, User, Session } from "../types.ts";
import { generateUserId } from "../crypto.ts";

/**
 * In-memory database adapter for development and testing
 * Data is stored in Maps and will be lost when the process exits
 */
export function createMemoryAdapter(): DatabaseAdapter {
  const users = new Map<string, User>();
  const sessions = new Map<string, Session>();

  // Index for email lookups
  const emailIndex = new Map<string, string>(); // email -> userId

  return {
    async createUser(data: {
      email: string;
      hashedPassword: string;
    }): Promise<User> {
      const id = generateUserId();
      const user: User = {
        id,
        email: data.email,
        hashedPassword: data.hashedPassword,
        createdAt: new Date(),
      };

      users.set(id, user);
      emailIndex.set(data.email.toLowerCase(), id);

      return user;
    },

    async getUserByEmail(email: string): Promise<User | null> {
      const userId = emailIndex.get(email.toLowerCase());
      if (!userId) return null;
      return users.get(userId) || null;
    },

    async getUserById(id: string): Promise<User | null> {
      return users.get(id) || null;
    },

    async createSession(data: {
      id: string;
      userId: string;
      expiresAt: Date;
    }): Promise<Session> {
      const session: Session = {
        id: data.id,
        userId: data.userId,
        expiresAt: data.expiresAt,
        createdAt: new Date(),
      };

      sessions.set(data.id, session);
      return session;
    },

    async getSession(id: string): Promise<Session | null> {
      return sessions.get(id) || null;
    },

    async deleteSession(id: string): Promise<void> {
      sessions.delete(id);
    },

    async deleteUserSessions(userId: string): Promise<void> {
      for (const [sessionId, session] of sessions) {
        if (session.userId === userId) {
          sessions.delete(sessionId);
        }
      }
    },

    async migrate(): Promise<void> {
      // No-op for memory adapter - no tables to create
    },
  };
}
