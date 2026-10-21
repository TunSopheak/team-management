// Loads demo data into an EMPTY database: `npm run db:seed`.
// Every demo account gets the password from SEED_PASSWORD (default: "password123").
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { closeDb, getDb, type Database, type Queryable } from './index';
import { runMigrations } from './migrate';
import {
  initialActivityEvents,
  initialDailyLogs,
  initialGroups,
  initialTasks,
  initialUsers,
} from './seedData';

function toTimestamp(date: string, time?: string) {
  const m = time?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  let hours = m ? Number(m[1]) : 9;
  const minutes = m ? Number(m[2]) : 0;
  if (m?.[3]) hours = (hours % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0);
  const [y, mo, d] = date.split('-').map(Number);
  return new Date(y, mo - 1, d, hours, minutes).toISOString();
}

export async function seedIfEmpty(db: Database): Promise<boolean> {
  if (initialUsers.length === 0) {
    return false;
  }
  const { rows } = await db.query<{ n: number }>('SELECT count(*)::int AS n FROM users');
  if (rows[0].n > 0) {
    return false;
  }

  const password = process.env.SEED_PASSWORD || 'password123';
  const passwordHash = await bcrypt.hash(password, 12);
  const ids = new Map<string, string>();
  const id = (oldId: string) => {
    if (!ids.has(oldId)) ids.set(oldId, randomUUID());
    return ids.get(oldId)!;
  };

  await db.transaction(async (tx: Queryable) => {
    for (const u of initialUsers) {
      await tx.query(
        `INSERT INTO users (id, name, name_km, email, student_id, password_hash, role, specialty, department)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id(u.id), u.name, u.nameKm ?? null, u.email, u.studentId, passwordHash, u.role, u.specialty ?? null, u.department ?? null]
      );
    }

    for (const g of initialGroups) {
      await tx.query(
        `INSERT INTO groups (id, name, name_km, code, description, course_or_project, leader_id, deadline, status, category, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [id(g.id), g.name, g.nameKm ?? null, g.code, g.description, g.courseOrProject, id(g.leaderId),
         g.deadline ?? null, g.status, g.category, toTimestamp(g.createdAt)]
      );
      for (const memberId of g.memberIds) {
        await tx.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [id(g.id), id(memberId)]);
      }
    }

    for (const t of initialTasks) {
      await tx.query(
        `INSERT INTO tasks (id, group_id, title, module, description, assigned_to, assigned_by, priority, status, due_date, due_time, created_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [id(t.id), id(t.groupId), t.title, t.module, t.description, id(t.assignedTo), id(t.assignedBy),
         t.priority, t.status, t.dueDate, t.dueTime ?? null, toTimestamp(t.createdAt),
         t.status === 'ready_for_review' ? new Date().toISOString() : null]
      );
    }

    for (const l of initialDailyLogs) {
      await tx.query(
        `INSERT INTO daily_logs (id, group_id, user_id, log_date, title, raw_content, items, status, completed_at, leader_checked, leader_note, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12)`,
        [id(l.id), id(l.groupId), id(l.userId), l.date, l.title, l.rawContent, JSON.stringify(l.items),
         l.status, l.completedAt ? toTimestamp(l.completedAt) : null, l.leaderChecked, l.leaderNote ?? null,
         toTimestamp(l.date, l.timestamp)]
      );
      for (const r of l.reactions) {
        for (const userId of r.userIds) {
          await tx.query('INSERT INTO daily_log_reactions (log_id, user_id, emoji) VALUES ($1, $2, $3)', [id(l.id), id(userId), r.emoji]);
        }
      }
    }

    for (const e of initialActivityEvents) {
      await tx.query(
        `INSERT INTO activity_events (id, group_id, type, actor_id, actor_name, target_title, description, description_km, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id(e.id), id(e.groupId), e.type, id(e.actorId), e.actorName, e.targetTitle, e.description,
         e.descriptionKm ?? null, e.metadata ? JSON.stringify(e.metadata) : null, toTimestamp(e.date, e.timestamp)]
      );
    }
  });

  console.log('[seed] Demo data loaded. Sign in with any of these accounts:');
  for (const u of initialUsers) console.log(`  ${u.email.padEnd(32)} ${u.role.padEnd(12)} password: ${password}`);
  return true;
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    const db = await getDb();
    await runMigrations(db);
    await seedIfEmpty(db);
  })()
    .catch(err => {
      console.error('[seed] failed:', err);
      process.exitCode = 1;
    })
    .finally(() => closeDb());
}
