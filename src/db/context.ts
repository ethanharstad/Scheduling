import { getContext } from 'vinxi/http';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import * as schema from './schema';

let devDb: ReturnType<typeof drizzle> | null = null;

/**
 * Get the database instance from the Cloudflare environment.
 * In production: Uses D1 from getContext
 * In development: Uses local SQLite via better-sqlite3
 */
export async function getDatabase() {
  // Try to get context in production/Cloudflare Workers environment
  try {
    const cf = getContext('cloudflare');
    if (cf?.env?.db) {
      const env = cf.env as Env;
      return drizzleD1(env.db, { schema });
    }
  } catch (e) {
    // Context not available in development, use local SQLite
  }

  // Development mode: use local SQLite database
  if (!devDb) {
    // Dynamically import better-sqlite3 only in development
    const Database = (await import('better-sqlite3')).default;
    const sqlite = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/db.sqlite');
    devDb = drizzle(sqlite, { schema });
    console.log('Using local SQLite database for development');
  }

  return devDb;
}

