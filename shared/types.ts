// Domain types shared by the client (React) and the server (Express API).

export const ROLES = ['super_admin', 'team_lead', 'member', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ['todo', 'in_progress', 'ready_for_review', 'approved'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const GROUP_CATEGORIES = ['assignment', 'research', 'startup', 'other'] as const;
export type GroupCategory = (typeof GROUP_CATEGORIES)[number];

export const GROUP_STATUSES = ['active', 'completed', 'archived'] as const;
export type GroupStatus = (typeof GROUP_STATUSES)[number];

export type DailyLogStatus = 'in_progress' | 'completed' | 'approved';

export interface User {
  id: string;
  name: string;
  nameKm?: string;
  email: string;
  studentId: string;
  avatarUrl?: string;
  role: Role;
  specialty?: string;
  department?: string;
}

export interface DailyTodoItem {
  id: string;
  text: string;
  done: boolean;
  progressTag?: string; // e.g. '80%'
}

export interface DailyLogReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface DailyLog {
  id: string;
  groupId: string;
  userId: string;
  date: string; // YYYY-MM-DD in the author's local time zone
  timestamp: string; // ISO 8601 creation time
  title: string; // e.g. 'JulNow - Dashboard'
  rawContent: string; // the exact text entered
  items: DailyTodoItem[]; // parsed bullet items
  overallDone: boolean;
  status: DailyLogStatus;
  completedAt?: string;
  leaderChecked: boolean;
  leaderNote?: string;
  approvedBy?: string;
  reactions: DailyLogReaction[];
}

export interface Task {
  id: string;
  groupId: string;
  title: string;
  module: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  createdAt: string;
  completedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  memberNotes?: string;
  leaderFeedback?: string;
}

export interface Group {
  id: string;
  name: string;
  nameKm?: string;
  code: string;
  description: string;
  courseOrProject: string;
  leaderId: string;
  memberIds: string[];
  createdAt: string;
  deadline?: string; // YYYY-MM-DD
  status: GroupStatus;
  category: GroupCategory;
}

export type ActivityEventType =
  | 'task_completed'
  | 'task_approved'
  | 'task_assigned'
  | 'task_deadline_changed'
  | 'member_added'
  | 'member_removed'
  | 'member_role_changed'
  | 'daily_todo_posted'
  | 'daily_todo_completed'
  | 'daily_todo_approved'
  | 'group_created'
  | 'group_deadline_changed';

export interface ActivityEvent {
  id: string;
  groupId: string;
  type: ActivityEventType;
  actorId: string;
  actorName: string;
  targetId?: string;
  targetTitle: string;
  description: string;
  descriptionKm?: string;
  timestamp: string; // ISO 8601
  date: string; // YYYY-MM-DD (UTC)
  metadata?: {
    oldValue?: string;
    newValue?: string;
    role?: string;
    feedback?: string;
  };
}

/** Everything the signed-in user is allowed to see, returned by GET /api/bootstrap. */
export interface BootstrapData {
  currentUser: User;
  users: User[];
  groups: Group[];
  tasks: Task[];
  dailyLogs: DailyLog[];
  activityEvents: ActivityEvent[];
}
