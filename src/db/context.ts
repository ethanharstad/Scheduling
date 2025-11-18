import { getContext } from 'vinxi/http';
import { getDb } from './index';

/**
 * Get the database instance from the Cloudflare environment.
 * Works in both development (using getPlatformProxy) and production (using getContext).
 */
export async function getDatabase() {
  try {
    // Try to get context in production/Cloudflare Workers environment
    const cf = getContext('cloudflare');
    if (cf?.env?.db) {
      const env = cf.env as Env;
      return getDb(env.db);
    }
  } catch (e) {
    // Context not available, likely in development
  }

  // In development, use getPlatformProxy from wrangler
  try {
    const { getPlatformProxy } = await import('wrangler');
    const { env } = await getPlatformProxy();
    const typedEnv = env as unknown as Env;
    if (typedEnv.db) {
      return getDb(typedEnv.db);
    }
  } catch (e) {
    console.error('Failed to get platform proxy:', e);
  }

  throw new Error('Database binding not available. Make sure D1 is configured in wrangler.jsonc');
}
