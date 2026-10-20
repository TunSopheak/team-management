import { Router } from 'express';
import { getDb } from '../db';
import type { BootstrapData, DailyLogReaction } from '../../shared/types';
import { isSuperAdmin } from '../services/access';
import {
  toActivityEvent,
  toDailyLog,
  toGroup,
  toTask,
  toUser,
  USER_COLUMNS,
} from '../services/mappers';

export const bootstrapRouter = Router();

const ACTIVITY_LIMIT_PER_GROUP = 200;

/** Returns every group, member, task, standup and activity entry the signed-in user may see. */
bootstrapRouter.get('/bootstrap', async (req, res) => {
  const user = req.user!;
  const db = await getDb();

  const { rows: groupRows } = isSuperAdmin(user)
    ? await db.query('SELECT * FROM groups ORDER BY created_at DESC')
    : await db.query(
        `SELECT g.* FROM groups g
           JOIN group_members m ON m.group_id = g.id AND m.user_id = $1
          ORDER BY g.created_at DESC`,
        [user.id]
      );
  const groupIds: string[] = groupRows.map(g => g.id);

  const empty: BootstrapData = {
    currentUser: user,
    users: [user],
    groups: [],
    tasks: [],
    dailyLogs: [],
    activityEvents: [],
  };
  if (groupIds.length === 0 && !isSuperAdmin(user)) {
    res.json(empty);
    return;
  }

  const [members, users, tasks, logs, reactions, events] = await Promise.all([
    db.query('SELECT group_id, user_id FROM group_members WHERE group_id = ANY($1::uuid[]) ORDER BY joined_at', [groupIds]),
    isSuperAdmin(user)
      ? db.query(`SELECT ${USER_COLUMNS} FROM users ORDER BY created_at`)
      : // Current members of my groups, plus past authors/assignees so old posts still show names.
        db.query(
          `SELECT ${USER_COLUMNS} FROM users
            WHERE id = $2
               OR id IN (SELECT user_id FROM group_members WHERE group_id = ANY($1::uuid[]))
               OR id IN (SELECT user_id FROM daily_logs WHERE group_id = ANY($1::uuid[]))
               OR id IN (SELECT assigned_to FROM tasks WHERE group_id = ANY($1::uuid[]))
            ORDER BY created_at`,
          [groupIds, user.id]
        ),
    db.query('SELECT * FROM tasks WHERE group_id = ANY($1::uuid[]) ORDER BY created_at DESC', [groupIds]),
    db.query('SELECT * FROM daily_logs WHERE group_id = ANY($1::uuid[]) ORDER BY created_at DESC', [groupIds]),
    db.query(
      `SELECT r.log_id, r.emoji, r.user_id FROM daily_log_reactions r
         JOIN daily_logs l ON l.id = r.log_id
        WHERE l.group_id = ANY($1::uuid[]) ORDER BY r.created_at`,
      [groupIds]
    ),
    db.query(
      `SELECT * FROM (
         SELECT e.*, row_number() OVER (PARTITION BY group_id ORDER BY created_at DESC) AS rn
           FROM activity_events e WHERE group_id = ANY($1::uuid[])
       ) ranked WHERE rn <= ${ACTIVITY_LIMIT_PER_GROUP} ORDER BY created_at DESC`,
      [groupIds]
    ),
  ]);

  const membersByGroup = new Map<string, string[]>();
  for (const m of members.rows) {
    if (!membersByGroup.has(m.group_id)) membersByGroup.set(m.group_id, []);
    membersByGroup.get(m.group_id)!.push(m.user_id);
  }

  const reactionsByLog = new Map<string, DailyLogReaction[]>();
  for (const r of reactions.rows) {
    const list = reactionsByLog.get(r.log_id) ?? [];
    let entry = list.find(x => x.emoji === r.emoji);
    if (!entry) {
      entry = { emoji: r.emoji, count: 0, userIds: [] };
      list.push(entry);
    }
    entry.count += 1;
    entry.userIds.push(r.user_id);
    reactionsByLog.set(r.log_id, list);
  }

  const data: BootstrapData = {
    currentUser: user,
    users: users.rows.map(toUser),
    groups: groupRows.map(g => toGroup(g, membersByGroup.get(g.id) ?? [])),
    tasks: tasks.rows.map(toTask),
    dailyLogs: logs.rows.map(l => toDailyLog(l, reactionsByLog.get(l.id) ?? [])),
    activityEvents: events.rows.map(toActivityEvent),
  };
  res.json(data);
});
