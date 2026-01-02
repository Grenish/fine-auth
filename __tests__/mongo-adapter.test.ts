import { describe, test, expect, beforeEach, mock } from "bun:test";
import { FineAuth, Database } from "../src/index";
import type { MongoDatabase, MongoCollection } from "../src/types";

// Mock MongoDB implementation
class MockCollection implements MongoCollection {
  private data: Map<string, any> = new Map();
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  async findOne(filter: any): Promise<any | null> {
    // Simple filter support for id and email
    for (const item of this.data.values()) {
      let match = true;
      for (const key in filter) {
        if (item[key] !== filter[key]) {
          match = false;
          break;
        }
      }
      if (match) return item;
    }
    return null;
  }

  async insertOne(doc: any): Promise<{ insertedId: any }> {
    // If _id is not provided, generate one (simple mock)
    const id = doc._id || Math.random().toString(36).substring(7);
    const newDoc = { ...doc, _id: id };
    this.data.set(id, newDoc);
    return { insertedId: id };
  }

  async deleteOne(filter: any): Promise<{ deletedCount: number }> {
    const item = await this.findOne(filter);
    if (item) {
      this.data.delete(item._id);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(filter: any): Promise<{ deletedCount: number }> {
    let count = 0;
    // Iterate and find matches first (to avoid concurrent modification issues)
    const toDelete: string[] = [];

    for (const item of this.data.values()) {
      let match = true;
      for (const key in filter) {
        if (item[key] !== filter[key]) {
          match = false;
          break;
        }
      }
      if (match) toDelete.push(item._id);
    }

    for (const id of toDelete) {
      this.data.delete(id);
      count++;
    }

    return { deletedCount: count };
  }

  async createIndex(indexSpec: any, options?: any): Promise<string> {
    return "index_created";
  }
}

class MockDb implements MongoDatabase {
  private collections: Map<string, MockCollection> = new Map();

  collection(name: string): MongoCollection {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockCollection(name));
    }
    return this.collections.get(name)!;
  }
}

describe("FineAuth - MongoDB Adapter (Mocked)", () => {
  let auth: FineAuth;
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = new MockDb();

    const db = new Database({
      type: "mongodb",
      client: mockDb,
    });

    auth = new FineAuth({
      secret: "test-secret-key-min-32-chars-length",
      method: {
        email: true,
      },
      db: db,
    });
  });

  test("should initialize successfully with mongodb type", () => {
    expect(auth).toBeDefined();
    expect(auth.db).toBeDefined();
  });

  test("should create user using mongo adapter interaction", async () => {
    const result = await auth.signUp({
      email: "mongo@example.com",
      password: "password123",
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe("mongo@example.com");

    // Verify it was actually stored in our mock DB
    const usersCollection = mockDb.collection("users");
    const storedUser = await usersCollection.findOne({
      email: "mongo@example.com",
    });
    expect(storedUser).toBeDefined();
    expect(storedUser.email).toBe("mongo@example.com");
  });

  test("should retrieve user by email", async () => {
    await auth.signUp({
      email: "finder@example.com",
      password: "password123",
    });

    // Test signIn which uses getUserByEmail internally
    const result = await auth.signIn({
      email: "finder@example.com",
      password: "password123",
    });

    expect(result.user.email).toBe("finder@example.com");
  });

  test("should create and validate session", async () => {
    const { token, session } = await auth.signUp({
      email: "session@example.com",
      password: "password123",
    });

    // Verify session stored in mock DB
    const sessionsCollection = mockDb.collection("sessions");
    const storedSession = await sessionsCollection.findOne({ _id: session.id });
    expect(storedSession).toBeDefined();
    expect(storedSession.userId).toBe(session.userId);

    // Validate using auth method
    const validation = await auth.validateSession(token);
    expect(validation).not.toBeNull();
    expect(validation?.user.email).toBe("session@example.com");
  });

  test("should delete session on signout", async () => {
    const { token, session } = await auth.signUp({
      email: "signout@example.com",
      password: "password123",
    });

    await auth.signOut(token);

    const sessionsCollection = mockDb.collection("sessions");
    const storedSession = await sessionsCollection.findOne({ _id: session.id });
    expect(storedSession).toBeNull();
  });
});
