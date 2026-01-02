import type {
  DatabaseAdapter,
  MongoDatabase,
  User,
  Session,
} from "../types.ts";
import { generateUserId } from "../crypto.ts";

/**
 * MongoDB adapter for fine-auth
 * Expects a MongoDB Db object that matches our MongoDatabase interface
 */
export function createMongoAdapter(db: MongoDatabase): DatabaseAdapter {
  const users = db.collection("users");
  const sessions = db.collection("sessions");

  return {
    async createUser(data) {
      const id = generateUserId();
      const user = {
        _id: id,
        email: data.email.toLowerCase(),
        hashedPassword: data.hashedPassword,
        createdAt: new Date(),
      };

      await users.insertOne(user);

      return {
        id: user._id,
        email: user.email,
        hashedPassword: user.hashedPassword,
        createdAt: user.createdAt,
      };
    },

    async getUserByEmail(email) {
      const user = await users.findOne({ email: email.toLowerCase() });
      if (!user) return null;

      return {
        id: user._id,
        email: user.email,
        hashedPassword: user.hashedPassword,
        createdAt: user.createdAt,
      };
    },

    async getUserById(id) {
      const user = await users.findOne({ _id: id });
      if (!user) return null;

      return {
        id: user._id,
        email: user.email,
        hashedPassword: user.hashedPassword,
        createdAt: user.createdAt,
      };
    },

    async createSession(data) {
      const session = {
        _id: data.id,
        userId: data.userId,
        expiresAt: data.expiresAt,
        createdAt: new Date(),
      };

      await sessions.insertOne(session);

      return {
        id: session._id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
      };
    },

    async getSession(id) {
      const session = await sessions.findOne({ _id: id });
      if (!session) return null;

      return {
        id: session._id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
      };
    },

    async deleteSession(id) {
      await sessions.deleteOne({ _id: id });
    },

    async deleteUserSessions(userId) {
      await sessions.deleteMany({ userId });
    },

    async migrate() {
      // Create unique index for email
      await users.createIndex({ email: 1 }, { unique: true });

      // Create TTL index for session expiry
      await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    },
  };
}
