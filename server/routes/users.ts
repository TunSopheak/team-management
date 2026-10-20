import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db';
import { ROLES } from '../../shared/types';
import { requireSuperAdmin } from '../services/access';
import { logActivity } from '../services/activity';
import { badRequest, notFound } from '../middleware/errors';

export const usersRouter = Router();

const roleSchema = z.object({
  role: z.enum(ROLES),
  /** Group whose activity log should record the change. */
  groupId: z.string().uuid().optional(),
});

usersRouter.patch('/users/:userId/role', async (req, res) => {
  const user = req.user!;
  requireSuperAdmin(user);
  const input = roleSchema.parse(req.body);
  const targetId = req.params.userId;
  if (targetId === user.id) throw badRequest('You cannot change your own role.');

  const db = await getDb();
  await db.transaction(async tx => {
    const { rows } = await tx.query('UPDATE users SET role = $2 WHERE id = $1 RETURNING name', [
      targetId,
      input.role,
    ]);
    if (!rows[0]) throw notFound('User not found.');

    if (input.groupId) {
      const { rows: g } = await tx.query('SELECT 1 FROM groups WHERE id = $1', [input.groupId]);
      if (g[0]) {
        await logActivity(tx, user, {
          groupId: input.groupId,
          type: 'member_role_changed',
          targetId,
          targetTitle: rows[0].name,
          description: `updated ${rows[0].name}'s role to ${input.role.replace('_', ' ')}`,
          descriptionKm: `បានប្តូរសិទ្ធិ ${rows[0].name} ទៅជា ${input.role}`,
          metadata: { role: input.role },
        });
      }
    }
  });

  res.status(204).end();
});
