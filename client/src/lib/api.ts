import type { BootstrapData, Role, TaskPriority, TaskStatus, User, GroupCategory } from '@shared/types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Same-origin by default (Express serves the app). Set VITE_API_URL only if the API lives elsewhere.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

async function request<T = void>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `Request failed (${res.status})`);
  return data as T;
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T = void>(path: string, body: unknown = {}) => request<T>('POST', path, body);
const patch = (path: string, body: unknown) => request('PATCH', path, body);
const del = (path: string) => request('DELETE', path);

export const api = {
  // Auth
  me: () => get<{ user: User }>('/auth/me'),
  login: (email: string, password: string) => post<{ user: User }>('/auth/login', { email, password }),
  register: (data: { name: string; nameKm?: string; email: string; studentId: string; password: string }) =>
    post<{ user: User }>('/auth/register', data),
  logout: () => post('/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) =>
    post('/auth/change-password', { currentPassword, newPassword }),

  bootstrap: () => get<BootstrapData>('/bootstrap'),

  // Groups & members
  createGroup: (data: {
    name: string;
    nameKm?: string;
    code?: string;
    courseOrProject: string;
    description?: string;
    deadline?: string;
    category: GroupCategory;
  }) => post<{ id: string }>('/groups', data),
  updateGroup: (groupId: string, data: { deadline?: string | null }) => patch(`/groups/${groupId}`, data),
  deleteGroup: (groupId: string) => del(`/groups/${groupId}`),
  addMember: (
    groupId: string,
    data: { name: string; nameKm?: string; email: string; studentId: string; role: Role; specialty?: string; department?: string }
  ) => post<{ id: string }>(`/groups/${groupId}/members`, data),
  removeMember: (groupId: string, userId: string) => del(`/groups/${groupId}/members/${userId}`),
  clearActivity: (groupId: string) => del(`/groups/${groupId}/activity`),
  updateUserRole: (userId: string, role: Role, groupId?: string) => patch(`/users/${userId}/role`, { role, groupId }),

  // Tasks
  createTask: (
    groupId: string,
    data: { title: string; module: string; description: string; assignedTo: string; priority: TaskPriority; dueDate: string; dueTime?: string }
  ) => post<{ id: string }>(`/groups/${groupId}/tasks`, data),
  updateTaskStatus: (taskId: string, status: Exclude<TaskStatus, 'approved'>, memberNotes?: string) =>
    patch(`/tasks/${taskId}/status`, { status, memberNotes }),
  updateTaskDeadline: (taskId: string, dueDate: string, dueTime?: string) =>
    patch(`/tasks/${taskId}/deadline`, { dueDate, dueTime }),
  approveTask: (taskId: string, feedback?: string) => post(`/tasks/${taskId}/approve`, { feedback }),
  deleteTask: (taskId: string) => del(`/tasks/${taskId}`),

  // Daily standups
  createDailyLog: (groupId: string, rawContent: string, date: string) =>
    post<{ id: string }>(`/groups/${groupId}/daily-logs`, { rawContent, date }),
  toggleDailyLogItem: (logId: string, itemId: string) => post(`/daily-logs/${logId}/items/${itemId}/toggle`),
  completeDailyLog: (logId: string) => post(`/daily-logs/${logId}/complete`),
  approveDailyLog: (logId: string, feedback?: string) => post(`/daily-logs/${logId}/approve`, { feedback }),
  deleteDailyLog: (logId: string) => del(`/daily-logs/${logId}`),
  toggleReaction: (logId: string, emoji: string) => post(`/daily-logs/${logId}/reactions`, { emoji }),
};
