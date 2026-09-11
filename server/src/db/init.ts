import { requireDatabaseUrl } from '../config/env.js';
import { pool } from './pool.js';
import { schemaSql } from './schema.js';

async function main() {
  requireDatabaseUrl();
  await pool.query(schemaSql);
  console.log('Database schema is ready.');
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown database initialization error.';
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
