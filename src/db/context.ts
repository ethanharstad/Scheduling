import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * Get the database instance from the Cloudflare environment.
 * Uses the cloudflare:workers module to access bindings.
 */
export async function getDatabase() {
  try {
    // Import env from cloudflare:workers (available in both dev and production)
    const { env } = await import('cloudflare:workers');
    const typedEnv = env as unknown as Env;

    if (typedEnv.db) {
      return drizzle(typedEnv.db, { schema });
    }

    throw new Error('Database binding "db" not found in environment');
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found in environment')) {
      throw error;
    }
    // If cloudflare:workers is not available, throw a helpful error
    throw new Error('Unable to access Cloudflare bindings. Make sure you are running in a Cloudflare Workers environment.');
  }
}

