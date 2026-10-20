import type { ActivityEvent, DailyLog, DailyLogReaction, Group, Task, User } from '../../shared/types';

// Convert snake_case database rows into the camelCase shapes the client uses.

const iso = (v: Date | string | null | undefined) =>
  v == null ? undefined : v instanceof Date ? v.toISOString() : new Date(v).toISOString();
const opt = <T>(v: T | null | undefined) => (v == null ? undefined : v);

export const USER_COLUMNS =
  'id, name, name_km, email, student_id, role, specialty, department, avatar_url';

export const toUser = (r: any): User => ({
  id: r.id,
  name: r.name,
  nameKm: opt(r.name_km),
  email: r.email,
  studentId: r.student_id,
  role: r.role,
  specialty: opt(r.specialty),
  department: opt(r.department),
  avatarUrl: opt(r.avatar_url),
});

export const toGroup = (r: any, memberIds: string[]): Group => ({
  id: r.id,
  name: r.name,
  nameKm: opt(r.name_km),
  code: r.code,
  description: r.description,
  courseOrProject: r.course_or_project,
  leaderId: r.leader_id ?? '',
  memberIds,
  createdAt: iso(r.created_at)!,
  deadline: opt(r.deadline),
  status: r.status,
  category: r.category,
});

export const toTask = (r: any): Task => ({
  id: r.id,
  groupId: r.group_id,
  title: r.title,
  module: r.module,
  description: r.description,
  assignedTo: r.assigned_to ?? '',
  assignedBy: r.assigned_by ?? '',
  priority: r.priority,
  status: r.status,
  dueDate: r.due_date,
  dueTime: opt(r.due_time),
  createdAt: iso(r.created_at)!,
  completedAt: iso(r.completed_at),
  approvedAt: iso(r.approved_at),
  approvedBy: opt(r.approved_by),
  memberNotes: opt(r.member_notes),
  leaderFeedback: opt(r.leader_feedback),
});

export const toDailyLog = (r: any, reactions: DailyLogReaction[]): DailyLog => {
  const items = typeof r.items === 'string' ? JSON.parse(r.items) : r.items ?? [];
  return {
    id: r.id,
    groupId: r.group_id,
    userId: r.user_id,
    date: r.log_date,
    timestamp: iso(r.created_at)!,
    title: r.title,
    rawContent: r.raw_content,
    items,
    overallDone: items.length > 0 && items.every((i: any) => i.done),
    status: r.status,
    completedAt: iso(r.completed_at),
    leaderChecked: r.leader_checked,
    leaderNote: opt(r.leader_note),
    approvedBy: opt(r.approved_by),
    reactions,
  };
};

export const toActivityEvent = (r: any): ActivityEvent => {
  const timestamp = iso(r.created_at)!;
  return {
    id: r.id,
    groupId: r.group_id,
    type: r.type,
    actorId: r.actor_id ?? '',
    actorName: r.actor_name,
    targetId: opt(r.target_id),
    targetTitle: r.target_title,
    description: r.description,
    descriptionKm: opt(r.description_km),
    timestamp,
    date: timestamp.slice(0, 10),
    metadata: opt(typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata),
  };
};
