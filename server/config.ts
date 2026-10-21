import 'dotenv/config';
import path from 'node:path';

const env = process.env;
const isProduction = env.NODE_ENV === 'production';

const jwtSecret = env.JWT_SECRET || (isProduction ? '' : 'dev-only-insecure-secret-change-me');
if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set to a random string of at least 32 characters in production.');
}

const rawDbUrl = (env.DATABASE_URL || '').trim();
const isRealDbUrl = rawDbUrl.startsWith('postgres://') || rawDbUrl.startsWith('postgresql://');
const databaseUrl = isRealDbUrl ? rawDbUrl : '';

const rawPgliteDir = (env.PGLITE_DIR || '').trim();
const pgliteDir = (!rawPgliteDir || rawPgliteDir === '1')
  ? path.resolve('./data/pglite')
  : path.resolve(rawPgliteDir);

export const config = {
  isProduction,
  port: Number(env.PORT) || 3000,
  /** PostgreSQL connection string. When empty, an embedded PGlite database is used instead. */
  databaseUrl,
  /** Where the embedded PGlite database stores its files (only used without DATABASE_URL). */
  pgliteDir,
  /** Set DATABASE_SSL=false for Postgres servers without TLS (e.g. local Docker). */
  databaseSsl: env.DATABASE_SSL ? env.DATABASE_SSL !== 'false' : isProduction,
  jwtSecret,
  /** Secure (HTTPS-only) auth cookie. On by default in production; COOKIE_SECURE=false for plain-HTTP hosting. */
  cookieSecure: env.COOKIE_SECURE ? env.COOKIE_SECURE !== 'false' : isProduction,
  jwtExpiresInDays: Number(env.JWT_EXPIRES_IN_DAYS) || 7,
  /** Set ALLOW_REGISTRATION=false to only let admin-invited users claim their accounts. */
  allowRegistration: env.ALLOW_REGISTRATION !== 'false',
  /** Comma-separated origins allowed to call the API cross-origin (empty = same-origin only). */
  corsOrigins: (env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
  clientDistDir: path.resolve(env.CLIENT_DIST_DIR || './dist/client'),
};
