import pg from 'pg';
import { env } from '../config/env.js';

function shouldUseSsl(connectionString: string | undefined) {
  if (env.databaseSsl !== null) {
    return env.databaseSsl;
  }

  if (!connectionString) {
    return false;
  }

  try {
    const databaseUrl = new URL(connectionString);
    const sslMode = databaseUrl.searchParams.get('sslmode');

    return sslMode === 'require' || databaseUrl.hostname.includes('supabase');
  } catch {
    return false;
  }
}

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: shouldUseSsl(env.databaseUrl)
    ? {
        rejectUnauthorized: false
      }
    : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000
});

export async function checkDatabaseConnection() {
  if (!env.databaseUrl) {
    return {
      connected: false,
      message: 'DATABASE_URL is not configured.'
    };
  }

  try {
    await pool.query('select 1');

    return {
      connected: true,
      message: 'PostgreSQL connection is healthy.'
    };
  } catch (error) {
    return {
      connected: false,
      message: error instanceof Error ? error.message : 'Unknown PostgreSQL connection error.'
    };
  }
}
