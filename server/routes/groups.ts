import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db';
import { GROUP_CATEGORIES, GROUP_STATUSES, ROLES } from '../../shared/types';
import { assert, getGroupAccess, isSuperAdmin, requireSuperAdmin } from '../services/access';
import { logActivity } from '../services/activity';
import { badRequest, conflict, notFound } from '../middleware/errors';
import { USER_COLUMNS } from '../services/mappers';

export const groupsRouter = Router();

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date (YYYY-MM-DD)');
const optionalText = (max: number) => z.string().trim().max(max).optional();

const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(160),
  nameKm: optionalText(160),
  code: z.string().trim().max(40).optional(),
  courseOrProject: z.string().trim().min(1).max(200),
  description: optionalText(2000),
  deadline: isoDate.optional(),
  category: z.enum(GROUP_CATEGORIES).default('assignment'),
});

groupsRouter.post('/groups', async (req, res) => {
  const user = req.user!;
  requireSuperAdmin(user);
  const input = createGroupSchema.parse(req.body);
  const code = (input.code || `GRP-${Math.floor(100 + Math.random() * 900)}`).toUpperCase();

  const db = await getDb();
  const group = await db.transaction(async tx => {
    const { rows: dup } = await tx.query('SELECT 1 FROM groups WHERE upper(code) = $1', [code]);
    if (dup[0]) throw conflict(`Group code "${code}" is already in use.`);

    const { rows } = await tx.query(
      `INSERT INTO groups (name, name_km, code, course_or_project, description, deadline, category, leader_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, code`,
      [
        input.name,
        input.nameKm || null,
        code,
        input.courseOrProject,
        input.description || 'Collaborative team workspace.',
        input.deadline || null,
        input.category,
        user.id,
      ]
    );
    const g = rows[0];
    await tx.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [g.id, user.id]);
    await logActivity(tx, user, {
      groupId: g.id,
      type: 'group_created',
      targetId: g.id,
      targetTitle: g.name,
      description: `created new group "${g.name}" (${g.code})`,
      descriptionKm: `បានបង្កើតក្រុមថ្មី "${g.name}" (${g.code})`,
    });
    return g;
  });

  res.status(201).json({ id: group.id });
});

const updateGroupSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  nameKm: optionalText(160),
  courseOrProject: z.string().trim().min(1).max(200).optional(),
  description: optionalText(2000),
  deadline: isoDate.nullable().optional(),
  status: z.enum(GROUP_STATUSES).optional(),
  category: z.enum(GROUP_CATEGORIES).optional(),
});

groupsRouter.patch('/groups/:groupId', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  assert(isSuperAdmin(user) || access.leaderId === user.id, 'Only a Super Admin or the group leader can edit the group.');
  const input = updateGroupSchema.parse(req.body);

  await db.transaction(async tx => {
    const { rows } = await tx.query('SELECT * FROM groups WHERE id = $1', [access.groupId]);
    const before = rows[0];

    const fields: Record<string, unknown> = {
      name: input.name,
      name_km: input.nameKm,
      course_or_project: input.courseOrProject,
      description: input.description,
      deadline: input.deadline,
      status: input.status,
      category: input.category,
    };
    const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
    if (entries.length === 0) throw badRequest('Nothing to update.');

    const sets = entries.map(([col], i) => `${col} = $${i + 2}`).join(', ');
    await tx.query(`UPDATE groups SET ${sets} WHERE id = $1`, [access.groupId, ...entries.map(([, v]) => v)]);

    if (input.deadline !== undefined && input.deadline !== before.deadline) {
      const oldValue = before.deadline ?? undefined;
      const newValue = input.deadline ?? undefined;
      await logActivity(tx, user, {
        groupId: access.groupId,
        type: 'group_deadline_changed',
        targetId: access.groupId,
        targetTitle: before.name,
        description: `changed group deadline from ${oldValue || 'none'} to ${newValue || 'none'}`,
        descriptionKm: `បានកែប្រែកាលបរិច្ឆេទកំណត់របស់ក្រុមពី ${oldValue || 'គ្មាន'} ទៅ ${newValue || 'គ្មាន'}`,
        metadata: { oldValue, newValue },
      });
    }
  });

  res.status(204).end();
});

groupsRouter.delete('/groups/:groupId', async (req, res) => {
  const user = req.user!;
  requireSuperAdmin(user);
  const db = await getDb();
  const { rows } = await db.query('DELETE FROM groups WHERE id = $1 RETURNING id', [req.params.groupId]);
  if (!rows[0]) throw notFound('Group not found.');
  res.status(204).end();
});

const addMemberSchema = z.object({
  name: z.string().trim().min(1).max(120),
  nameKm: optionalText(120),
  email: z.string().trim().toLowerCase().email().max(200),
  studentId: z.string().trim().min(1).max(60),
  role: z.enum(ROLES).default('member'),
  specialty: optionalText(200),
  department: optionalText(120),
});

groupsRouter.post('/groups/:groupId/members', async (req, res) => {
  const user = req.user!;
  requireSuperAdmin(user);
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  const input = addMemberSchema.parse(req.body);

  const member = await db.transaction(async tx => {
    const { rows: matches } = await tx.query(
      `SELECT ${USER_COLUMNS} FROM users WHERE lower(email) = $1 OR lower(student_id) = lower($2)`,
      [input.email, input.studentId]
    );
    if (matches.length > 1) {
      throw conflict('That email and student ID belong to two different existing users.');
    }

    let target = matches[0];
    if (target) {
      if (target.id === user.id && input.role !== target.role) {
        throw badRequest('You cannot change your own role.');
      }
      const { rows } = await tx.query(
        `UPDATE users SET role = $2, specialty = COALESCE($3, specialty) WHERE id = $1 RETURNING ${USER_COLUMNS}`,
        [target.id, input.role, input.specialty || null]
      );
      target = rows[0];
    } else {
      // Pre-create the account without a password; the person claims it by registering
      // with this email and student ID.
      const { rows } = await tx.query(
        `INSERT INTO users (name, name_km, email, student_id, role, specialty, department)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${USER_COLUMNS}`,
        [
          input.name,
          input.nameKm || null,
          input.email,
          input.studentId,
          input.role,
          input.specialty || null,
          input.department || 'Member',
        ]
      );
      target = rows[0];
    }

    const { rows: inserted } = await tx.query(
      `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING RETURNING user_id`,
      [access.groupId, target.id]
    );
    if (inserted[0]) {
      await logActivity(tx, user, {
        groupId: access.groupId,
        type: 'member_added',
        targetId: target.id,
        targetTitle: `${target.name} (${target.student_id})`,
        description: `added ${target.name} as ${input.role.replace('_', ' ')}`,
        descriptionKm: `បានបញ្ចូល ${target.name} ក្នុងក្រុម (តួនាទី៖ ${input.role})`,
        metadata: { role: input.role },
      });
    }
    return target;
  });

  res.status(201).json({ id: member.id });
});

/** Remove a member (Super Admin) or leave the group (any member removing themselves). */
groupsRouter.delete('/groups/:groupId/members/:userId', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  const targetId = req.params.userId;
  const isSelf = targetId === user.id;
  assert(isSelf || isSuperAdmin(user), 'Only a Super Admin can remove other members.');

  await db.transaction(async tx => {
    const { rows } = await tx.query(
      `DELETE FROM group_members m USING users u
        WHERE m.group_id = $1 AND m.user_id = $2 AND u.id = m.user_id
        RETURNING u.name`,
      [access.groupId, targetId]
    );
    if (!rows[0]) throw notFound('That user is not a member of this group.');
    await logActivity(tx, user, {
      groupId: access.groupId,
      type: 'member_removed',
      targetId,
      targetTitle: rows[0].name,
      description: isSelf ? 'left the group' : `removed ${rows[0].name} from the group`,
      descriptionKm: isSelf ? 'បានចាកចេញពីក្រុម' : `បានដក ${rows[0].name} ចេញពីក្រុម`,
    });
  });

  res.status(204).end();
});

groupsRouter.delete('/groups/:groupId/activity', async (req, res) => {
  const user = req.user!;
  requireSuperAdmin(user);
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  await db.query('DELETE FROM activity_events WHERE group_id = $1', [access.groupId]);
  res.status(204).end();
});
