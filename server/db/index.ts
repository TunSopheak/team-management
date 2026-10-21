import fs from 'node:fs';
import { config } from '../config';

/** Minimal query interface implemented by both node-postgres and PGlite. */
export interface Queryable {
  query<T = any>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

export interface Database extends Queryable {
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
  kind: 'postgres' | 'pglite';
}

// Return DATE columns as plain 'YYYY-MM-DD' strings instead of JS Dates (avoids time zone shifts).
const DATE_OID = 1082;

async function createPostgres(): Promise<Database> {
  const pg = await import('pg');
  const { Pool, types } = pg.default ?? pg;
  types.setTypeParser(DATE_OID, (v: string) => v);

  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });

  return {
    kind: 'postgres',
    query: (sql, params) => pool.query(sql, params as any[]) as any,
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn({ query: (sql, params) => client.query(sql, params as any[]) as any });
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

async function createPglite(): Promise<Database> {
  const { PGlite } = await import('@electric-sql/pglite');
  fs.mkdirSync(config.pgliteDir, { recursive: true });
  const db = new PGlite(config.pgliteDir, { parsers: { [DATE_OID]: (v: string) => v } });
  await db.waitReady;

  // PGlite runs on a single connection, so serialize transactions to keep them isolated.
  let queue: Promise<unknown> = Promise.resolve();

  return {
    kind: 'pglite',
    query: (sql, params) => db.query(sql, params as any[]) as any,
    transaction(fn) {
      const run = queue.then(() =>
        db.transaction(tx => fn({ query: (sql, params) => tx.query(sql, params as any[]) as any }))
      );
      queue = run.catch(() => undefined);
      return run;
    },
    close: () => db.close(),
  };
}

let instance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!instance) {
    if (config.databaseUrl) {
      try {
        const db = await createPostgres();
        await Promise.race([
          db.query('SELECT 1'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('PostgreSQL connection timeout (3s)')), 3000)),
        ]);
        instance = db;
      } catch (err) {
        console.warn('[db] PostgreSQL connection failed, falling back to embedded PGlite:', (err as Error).message);
        instance = await createPglite();
      }
    } else {
      instance = await createPglite();
    }
  }
  return instance;
}

export async function closeDb() {
  if (instance) {
    await instance.close();
    instance = null;
  }
}
