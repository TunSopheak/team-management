import type { Queryable } from '../db';
import type { User } from '../../shared/types';
import { forbidden, notFound } from '../middleware/errors';

// Permission model
// - super_admin: full control over every group, member, and role.
// - team_lead:   in groups they belong to, can assign/approve/reschedule tasks and approve standups.
// - group leader (groups.leader_id): same powers as a team_lead inside their own group.
// - member:      posts standups, updates their own tasks, reacts, leaves groups.
// - viewer:      read-only.

export const isSuperAdmin = (user: User) => user.role === 'super_admin';

export interface GroupAccess {
  groupId: string;
  leaderId: string | null;
  isMember: boolean;
  /** May assign/approve tasks and approve standups in this group. */
  canLead: boolean;
  /** May post standups and update own work in this group. */
  canContribute: boolean;
}

export async function getGroupAccess(db: Queryable, user: User, groupId: string): Promise<GroupAccess> {
  const { rows } = await db.query(
    `SELECT g.id, g.leader_id,
            EXISTS (SELECT 1 FROM group_members m WHERE m.group_id = g.id AND m.user_id = $2) AS is_member
       FROM groups g WHERE g.id = $1`,
    [groupId, user.id]
  );
  const row = rows[0];
  if (!row) throw notFound('Group not found.');

  const isMember: boolean = row.is_member;
  if (!isMember && !isSuperAdmin(user)) throw notFound('Group not found.');

  const canLead =
    isSuperAdmin(user) || (isMember && (user.role === 'team_lead' || row.leader_id === user.id));

  return {
    groupId,
    leaderId: row.leader_id,
    isMember,
    canLead,
    canContribute: isSuperAdmin(user) || (isMember && user.role !== 'viewer'),
  };
}

export function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) throw forbidden(message);
}

export function requireSuperAdmin(user: User) {
  assert(isSuperAdmin(user), 'Only a Super Admin can do that.');
}
