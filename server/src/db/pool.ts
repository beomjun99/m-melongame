import pg from 'pg';
import { env } from '../config/env.js';

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
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
