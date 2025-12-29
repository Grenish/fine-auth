import type { DatabaseConfig, DatabaseAdapter, DatabaseInstance, PgPool } from "./types.ts";
import { createMemoryAdapter } from "./adapters/memory.ts";
import { createPostgresqlAdapter } from "./adapters/postgresql.ts";
import { ConfigurationError } from "./errors.ts";

/**
 * Unified Database class for fine-auth
 * Wraps different database clients with a common interface
 */
export class Database implements DatabaseInstance {
  adapter: DatabaseAdapter;

  constructor(config: DatabaseConfig) {
    this.adapter = this.createAdapter(config);
  }

  private createAdapter(config: DatabaseConfig): DatabaseAdapter {
    switch (config.type) {
      case "memory":
        return createMemoryAdapter();

      case "postgresql":
        if (!config.client) {
          throw new ConfigurationError(
            "PostgreSQL requires a client (pg.Pool) to be provided"
          );
        }
        return createPostgresqlAdapter(config.client as PgPool);

      case "mongodb":
      case "mongoose":
      case "prisma":
      case "drizzle-pg":
      case "drizzle-mysql":
      case "better-sqlite3":
        throw new ConfigurationError(
          `Database type "${config.type}" is not yet supported. Coming soon!`
        );

      default:
        throw new ConfigurationError(
          `Unknown database type: "${config.type}"`
        );
    }
  }

  /**
   * Run migrations to create necessary tables
   * Safe to call multiple times (uses CREATE TABLE IF NOT EXISTS)
   */
  async migrate(): Promise<void> {
    await this.adapter.migrate();
  }
}
