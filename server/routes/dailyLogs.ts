import { Router } from 'express';
import { z } from 'zod';
import { getDb, type Queryable } from '../db';
import type { DailyTodoItem, User } from '../../shared/types';
import { parseRawLogContent } from '../../shared/dailyLogParser';
import { assert, getGroupAccess } from '../services/access';
import { logActivity } from '../services/activity';
import { notFound } from '../middleware/errors';

export const dailyLogsRouter = Router();

const ALLOWED_EMOJIS = ['👏', '🔥', '👍', '🚀', '💡'];

async function loadLog(db: Queryable, user: User, logId: string) {
  const { rows } = await db.query('SELECT * FROM daily_logs WHERE id = $1', [logId]);
  const log = rows[0];
  if (!log) throw notFound('Daily update not found.');
  const access = await getGroupAccess(db, user, log.group_id);
  const items: DailyTodoItem[] = typeof log.items === 'string' ? JSON.parse(log.items) : log.items;
  return { log, items, access, isAuthor: log.user_id === user.id };
}

const createSchema = z.object({
  rawContent: z.string().trim().min(1).max(10000),
  /** The author's local calendar date, so "today" matches their time zone. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

dailyLogsRouter.post('/groups/:groupId/daily-logs', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  assert(access.canContribute, 'Viewers cannot post daily updates.');
  const input = createSchema.parse(req.body);
  const { title, items } = parseRawLogContent(input.rawContent);
  const allDone = items.length > 0 && items.every(i => i.done);

  const id = await db.transaction(async tx => {
    const { rows } = await tx.query(
      `INSERT INTO daily_logs (group_id, user_id, log_date, title, raw_content, items, status, completed_at)
       VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE), $4, $5, $6::jsonb, $7, $8) RETURNING id`,
      [
        access.groupId,
        user.id,
        input.date ?? null,
        title,
        input.rawContent,
        JSON.stringify(items),
        allDone ? 'completed' : 'in_progress',
        allDone ? new Date().toISOString() : null,
      ]
    );
    await logActivity(tx, user, {
      groupId: access.groupId,
      type: 'daily_todo_posted',
      targetId: rows[0].id,
      targetTitle: title,
      description: `posted daily ToDo update: "${title}"`,
      descriptionKm: `បានផ្សព្វផ្សាយ ToDo ប្រចាំថ្ងៃ៖ "${title}"`,
    });
    return rows[0].id;
  });

  res.status(201).json({ id });
});

dailyLogsRouter.post('/daily-logs/:logId/items/:itemId/toggle', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { log, items, access, isAuthor } = await loadLog(db, user, req.params.logId);
  assert((isAuthor && access.canContribute) || access.canLead, 'Only the author can update this checklist.');

  const item = items.find(i => i.id === req.params.itemId);
  if (!item) throw notFound('Checklist item not found.');
  item.done = !item.done;

  const allDone = items.length > 0 && items.every(i => i.done);
  // Approved logs stay approved; otherwise status follows the checklist.
  const status = log.status === 'approved' ? 'approved' : allDone ? 'completed' : 'in_progress';

  await db.transaction(async tx => {
    await tx.query(
      `UPDATE daily_logs SET items = $2::jsonb, status = $3,
              completed_at = CASE WHEN $4::boolean THEN COALESCE(completed_at, now()) ELSE NULL END
        WHERE id = $1`,
      [log.id, JSON.stringify(items), status, allDone]
    );
    if (item.done) {
      await logActivity(tx, user, {
        groupId: log.group_id,
        type: 'task_completed',
        targetId: log.id,
        targetTitle: item.text,
        description: `completed ToDo item: "${item.text}" in ${log.title}`,
        descriptionKm: `បានសម្រេចកិច្ចការ៖ "${item.text}" ក្នុង ${log.title}`,
      });
    }
  });

  res.status(204).end();
});

dailyLogsRouter.post('/daily-logs/:logId/complete', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { log, items, access, isAuthor } = await loadLog(db, user, req.params.logId);
  assert((isAuthor && access.canContribute) || access.canLead, 'Only the author can complete this update.');

  const doneItems = items.map(i => ({ ...i, done: true }));
  await db.transaction(async tx => {
    await tx.query(
      `UPDATE daily_logs SET items = $2::jsonb,
              status = CASE WHEN status = 'approved' THEN status ELSE 'completed' END,
              completed_at = COALESCE(completed_at, now())
        WHERE id = $1`,
      [log.id, JSON.stringify(doneItems)]
    );
    await logActivity(tx, user, {
      groupId: log.group_id,
      type: 'daily_todo_completed',
      targetId: log.id,
      targetTitle: log.title,
      description: `marked entire daily ToDo as completed: "${log.title}"`,
      descriptionKm: `បានចុចបញ្ជាក់ការសម្រេច ToDo ទាំងស្រុង៖ "${log.title}"`,
    });
  });

  res.status(204).end();
});

const approveSchema = z.object({ feedback: z.string().trim().max(2000).optional() });

dailyLogsRouter.post('/daily-logs/:logId/approve', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { log, access } = await loadLog(db, user, req.params.logId);
  assert(access.canLead, 'Only team leads can approve daily updates.');
  const input = approveSchema.parse(req.body ?? {});

  await db.transaction(async tx => {
    await tx.query(
      `UPDATE daily_logs SET status = 'approved', leader_checked = true, leader_note = $2, approved_by = $3
        WHERE id = $1`,
      [log.id, input.feedback || 'Approved and verified by Leader.', user.id]
    );
    const { rows } = await tx.query('SELECT name FROM users WHERE id = $1', [log.user_id]);
    await logActivity(tx, user, {
      groupId: log.group_id,
      type: 'daily_todo_approved',
      targetId: log.id,
      targetTitle: log.title,
      description: `approved and verified daily ToDo for ${rows[0]?.name || 'Member'}`,
      descriptionKm: `បានអនុម័ត និងទទួលស្គាល់ ToDo ប្រចាំថ្ងៃរបស់ ${rows[0]?.name || 'សមាជិក'}`,
      metadata: input.feedback ? { feedback: input.feedback } : undefined,
    });
  });

  res.status(204).end();
});

dailyLogsRouter.delete('/daily-logs/:logId', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { log, access, isAuthor } = await loadLog(db, user, req.params.logId);
  assert(isAuthor || access.canLead, 'Only the author or a team lead can delete this update.');
  await db.query('DELETE FROM daily_logs WHERE id = $1', [log.id]);
  res.status(204).end();
});

const reactionSchema = z.object({ emoji: z.string().refine(e => ALLOWED_EMOJIS.includes(e), 'unsupported emoji') });

/** Toggle the current user's reaction on a daily update. */
dailyLogsRouter.post('/daily-logs/:logId/reactions', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { log } = await loadLog(db, user, req.params.logId);
  const { emoji } = reactionSchema.parse(req.body);

  const { rows } = await db.query(
    'DELETE FROM daily_log_reactions WHERE log_id = $1 AND user_id = $2 AND emoji = $3 RETURNING emoji',
    [log.id, user.id, emoji]
  );
  if (!rows[0]) {
    await db.query(
      'INSERT INTO daily_log_reactions (log_id, user_id, emoji) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [log.id, user.id, emoji]
    );
  }
  res.status(204).end();
});
