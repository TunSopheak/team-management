import { Router } from 'express';
import { z } from 'zod';
import { getDb, type Queryable } from '../db';
import { TASK_PRIORITIES } from '../../shared/types';
import type { User } from '../../shared/types';
import { assert, getGroupAccess } from '../services/access';
import { logActivity } from '../services/activity';
import { badRequest, notFound } from '../middleware/errors';

export const tasksRouter = Router();

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date (YYYY-MM-DD)');
const time = z.string().regex(/^\d{2}:\d{2}$/, 'must be a time (HH:mm)');

async function loadTask(db: Queryable, user: User, taskId: string) {
  const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
  const task = rows[0];
  if (!task) throw notFound('Task not found.');
  const access = await getGroupAccess(db, user, task.group_id);
  return { task, access };
}

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  module: z.string().trim().max(120).optional(),
  description: z.string().trim().max(5000).optional(),
  assignedTo: z.string().uuid(),
  priority: z.enum(TASK_PRIORITIES).default('medium'),
  dueDate: isoDate,
  dueTime: time.optional(),
});

tasksRouter.post('/groups/:groupId/tasks', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const access = await getGroupAccess(db, user, req.params.groupId);
  assert(access.canLead, 'Only team leads can assign tasks.');
  const input = createTaskSchema.parse(req.body);

  const id = await db.transaction(async tx => {
    const { rows: assignee } = await tx.query(
      `SELECT u.name FROM group_members m JOIN users u ON u.id = m.user_id
        WHERE m.group_id = $1 AND m.user_id = $2`,
      [access.groupId, input.assignedTo]
    );
    if (!assignee[0]) throw badRequest('The assignee must be a member of this group.');

    const { rows } = await tx.query(
      `INSERT INTO tasks (group_id, title, module, description, assigned_to, assigned_by, priority, due_date, due_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        access.groupId,
        input.title,
        input.module || 'General',
        input.description || 'Deliver specified module requirements.',
        input.assignedTo,
        user.id,
        input.priority,
        input.dueDate,
        input.dueTime || '23:59',
      ]
    );
    const name = assignee[0].name;
    await logActivity(tx, user, {
      groupId: access.groupId,
      type: 'task_assigned',
      targetId: rows[0].id,
      targetTitle: input.title,
      description: `assigned task "${input.title}" to ${name} (Due: ${input.dueDate})`,
      descriptionKm: `បានចាត់តាំងកិច្ចការ "${input.title}" ជូន ${name} (Deadline: ${input.dueDate})`,
      metadata: { newValue: input.dueDate },
    });
    return rows[0].id;
  });

  res.status(201).json({ id });
});

const statusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'ready_for_review']),
  memberNotes: z.string().trim().max(5000).optional(),
});

tasksRouter.patch('/tasks/:taskId/status', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { task, access } = await loadTask(db, user, req.params.taskId);
  const isAssignee = task.assigned_to === user.id && access.canContribute;
  assert(isAssignee || access.canLead, 'Only the assignee or a team lead can update this task.');
  if (task.status === 'approved' && !access.canLead) {
    throw badRequest('This task has already been approved.');
  }
  const input = statusSchema.parse(req.body);

  await db.transaction(async tx => {
    const isDone = input.status === 'ready_for_review';
    await tx.query(
      `UPDATE tasks SET status = $2,
              member_notes = COALESCE($3, member_notes),
              completed_at = CASE WHEN $4::boolean THEN COALESCE(completed_at, now()) ELSE NULL END,
              approved_at = NULL, approved_by = NULL
        WHERE id = $1`,
      [task.id, input.status, input.memberNotes ?? null, isDone]
    );
    if (isDone) {
      await logActivity(tx, user, {
        groupId: task.group_id,
        type: 'task_completed',
        targetId: task.id,
        targetTitle: task.title,
        description: `submitted task "${task.title}" as completed / ready for leader review`,
        descriptionKm: `បានបញ្ជាក់ការសម្រេចកិច្ចការ "${task.title}" រង់ចាំប្រធានត្រួតពិនិត្យ`,
      });
    }
  });

  res.status(204).end();
});

const deadlineSchema = z.object({ dueDate: isoDate, dueTime: time.optional() });

tasksRouter.patch('/tasks/:taskId/deadline', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { task, access } = await loadTask(db, user, req.params.taskId);
  assert(access.canLead, 'Only team leads can change task deadlines.');
  const input = deadlineSchema.parse(req.body);

  await db.transaction(async tx => {
    await tx.query('UPDATE tasks SET due_date = $2, due_time = COALESCE($3, due_time) WHERE id = $1', [
      task.id,
      input.dueDate,
      input.dueTime ?? null,
    ]);
    await logActivity(tx, user, {
      groupId: task.group_id,
      type: 'task_deadline_changed',
      targetId: task.id,
      targetTitle: task.title,
      description: `changed task deadline from ${task.due_date} to ${input.dueDate}`,
      descriptionKm: `បានប្តូរកាលបរិច្ឆេទកំណត់នៃកិច្ចការពី ${task.due_date} ទៅ ${input.dueDate}`,
      metadata: { oldValue: task.due_date, newValue: input.dueDate },
    });
  });

  res.status(204).end();
});

const approveSchema = z.object({ feedback: z.string().trim().max(2000).optional() });

tasksRouter.post('/tasks/:taskId/approve', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { task, access } = await loadTask(db, user, req.params.taskId);
  assert(access.canLead, 'Only team leads can approve tasks.');
  const input = approveSchema.parse(req.body ?? {});

  await db.transaction(async tx => {
    await tx.query(
      `UPDATE tasks SET status = 'approved', approved_at = now(), approved_by = $2,
              completed_at = COALESCE(completed_at, now()), leader_feedback = $3
        WHERE id = $1`,
      [task.id, user.id, input.feedback || 'Approved by Leader.']
    );
    await logActivity(tx, user, {
      groupId: task.group_id,
      type: 'task_approved',
      targetId: task.id,
      targetTitle: task.title,
      description: `approved and signed off on task "${task.title}"`,
      descriptionKm: `បានអនុម័ត និងចុះហត្ថលេខាទទួលស្គាល់កិច្ចការ "${task.title}"`,
      metadata: input.feedback ? { feedback: input.feedback } : undefined,
    });
  });

  res.status(204).end();
});

tasksRouter.delete('/tasks/:taskId', async (req, res) => {
  const user = req.user!;
  const db = await getDb();
  const { task, access } = await loadTask(db, user, req.params.taskId);
  assert(access.canLead, 'Only team leads can delete tasks.');
  await db.query('DELETE FROM tasks WHERE id = $1', [task.id]);
  res.status(204).end();
});
