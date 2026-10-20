import type { Database } from './index';
import { migrations } from './migrations';

/** Apply any pending migrations. Safe to run on every boot. */
export async function runMigrations(db: Database) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await db.query<{ id: string }>('SELECT id FROM schema_migrations');
  const applied = new Set(rows.map(r => r.id));

  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;
    await db.transaction(async tx => {
      for (const statement of splitStatements(migration.sql)) {
        await tx.query(statement);
      }
      await tx.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migration.id]);
    });
    console.log(`[db] applied migration ${migration.id}`);
  }
}

// Extended-protocol queries (used by both drivers) accept one statement at a time.
function splitStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\n|$)/)
    .map(s => s.trim())
    .filter(Boolean);
}
