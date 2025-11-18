import { getContext } from 'vinxi/http';
import { getDb } from './index';

/**
 * Get the database instance from the Cloudflare environment.
 * Works in both development (using process.env injected by @cloudflare/vite-plugin)
 * and production (using getContext from vinxi/http).
 */
export async function getDatabase() {
  // Try to get context in production/Cloudflare Workers environment
  try {
    const cf = getContext('cloudflare');
    if (cf?.env?.db) {
      const env = cf.env as Env;
      return getDb(env.db);
    }
  } catch (e) {
    // Context not available in development, continue to fallback
    console.log('getContext failed (expected in dev):', e instanceof Error ? e.message : e);
  }

  // In development with @cloudflare/vite-plugin, bindings are in process.env
  const env = process.env as unknown as Env;

  console.log('Checking process.env for db binding...');
  console.log('env.db exists:', !!env?.db);
  console.log('env keys:', env ? Object.keys(env).filter(k => !k.startsWith('npm_') && !k.startsWith('NODE_')).slice(0, 10) : 'no env');

  if (env?.db) {
    console.log('Found db binding in process.env');
    return getDb(env.db);
  }

  throw new Error('Database binding not available. Make sure D1 is configured in wrangler.jsonc and the dev server is running with @cloudflare/vite-plugin enabled.');
}

