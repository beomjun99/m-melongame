import 'dotenv/config';

function optionalNumber(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Expected numeric environment value, received "${value}"`);
  }

  return parsed;
}

function optionalBoolean(value: string | undefined) {
  if (!value) {
    return null;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export const env = {
  port: optionalNumber(process.env.PORT, 4000),
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: optionalBoolean(process.env.DATABASE_SSL),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
};

export function requireDatabaseUrl() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required for PostgreSQL operations.');
  }

  return env.databaseUrl;
}
