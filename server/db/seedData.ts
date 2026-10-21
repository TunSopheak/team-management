import type { Group, Task, User, DailyLog, ActivityEvent } from '../../shared/types';

// Clean initial data template.
// By default, the system starts with a completely empty, clean database.
// The very first user to register automatically becomes the Super Admin.
export const initialUsers: User[] = [];
export const initialGroups: Group[] = [];
export const initialDailyLogs: DailyLog[] = [];
export const initialTasks: Task[] = [];
export const initialActivityEvents: ActivityEvent[] = [];
