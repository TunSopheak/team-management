import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ActivityEvent, BootstrapData, DailyLog, Group, Role, Task, TaskStatus, User } from '../types';
import { translations, Language } from '../locales/translations';
import { api, ApiError } from '../lib/api';
import { todayLocal } from '../lib/dates';

type SessionStatus = 'loading' | 'signed_out' | 'ready';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['km'];

  // Session
  status: SessionStatus;
  currentUser: User;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; nameKm?: string; email: string; studentId: string; password: string; groupCode?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;

  // Notifications
  notice: { type: 'error' | 'success'; message: string } | null;
  dismissNotice: () => void;

  // Permissions (for the active group)
  isSuperAdmin: boolean;
  /** Can assign/approve tasks and approve standups in the active group. */
  isTeamLead: boolean;
  /** Can post standups and work on tasks in the active group (not a viewer). */
  canContribute: boolean;

  // Data
  users: User[];
  groups: Group[];
  activeGroupId: string;
  setActiveGroupId: (id: string) => void;
  activeGroup: Group | undefined;
  activeGroupMembers: User[];
  tasks: Task[];
  activeGroupTasks: Task[];
  dailyLogs: DailyLog[];
  activeGroupDailyLogs: DailyLog[];
  activityEvents: ActivityEvent[];
  activeGroupActivityEvents: ActivityEvent[];

  // Group & member actions
  addMemberToGroup: (data: {
    name: string;
    nameKm?: string;
    email: string;
    studentId: string;
    role: Role;
    specialty?: string;
    department?: string;
    groupId?: string;
  }) => Promise<void>;
  removeMemberFromGroup: (userId: string, groupId?: string) => Promise<void>;
  updateUserRole: (userId: string, newRole: Role) => Promise<void>;
  createGroup: (data: {
    name: string;
    nameKm?: string;
    code: string;
    courseOrProject: string;
    description: string;
    deadline?: string;
    category: Group['category'];
  }) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  joinGroup: (codeOrId: string) => Promise<void>;
  leaveGroup: (userId: string, groupId?: string) => Promise<void>;
  updateGroupDeadline: (groupId: string, newDeadline: string) => Promise<void>;

  // Daily standups
  addSimpleDailyLog: (rawContent: string) => Promise<void>;
  toggleDailyTodoItem: (logId: string, itemId: string) => Promise<void>;
  markDailyLogDone: (logId: string) => Promise<void>;
  approveDailyLog: (logId: string, feedback?: string) => Promise<void>;
  deleteDailyLog: (logId: string) => Promise<void>;
  addReactionToDailyLog: (logId: string, emoji: string) => Promise<void>;

  // Tasks
  assignTask: (data: {
    title: string;
    module: string;
    description: string;
    assignedTo: string;
    priority: Task['priority'];
    dueDate: string;
    dueTime?: string;
  }) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Exclude<TaskStatus, 'approved'>, memberNotes?: string) => Promise<void>;
  updateTaskDeadline: (taskId: string, newDueDate: string, newDueTime?: string) => Promise<void>;
  approveTask: (taskId: string, leaderFeedback?: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  clearActivityLogs: (groupId?: string) => Promise<void>;
}

// Only UI preferences live in localStorage; all team data lives in the database.
const STORAGE_KEYS = {
  ACTIVE_GROUP: 'leadersync_active_group',
  LANGUAGE: 'leadersync_language',
};

const POLL_INTERVAL_MS = 30_000;

const readStorage = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) — ignore */
  }
};

const EMPTY_USER: User = { id: '', name: '', email: '', studentId: '', role: 'viewer' };

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() =>
    readStorage(STORAGE_KEYS.LANGUAGE) === 'en' ? 'en' : 'km'
  );
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [data, setData] = useState<BootstrapData | null>(null);
  const [activeGroupId, setActiveGroupIdState] = useState<string>(() => readStorage(STORAGE_KEYS.ACTIVE_GROUP) || '');
  const [notice, setNotice] = useState<AppContextType['notice']>(null);
  const noticeTimer = useRef<number | undefined>(undefined);

  const t = translations[language];

  const showNotice = useCallback((type: 'error' | 'success', message: string) => {
    setNotice({ type, message });
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 5000);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await api.bootstrap();
      setData(next);
      setStatus('ready');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setData(null);
        setStatus('signed_out');
      } else {
        throw err;
      }
    }
  }, []);

  // Initial session check
  useEffect(() => {
    refresh().catch(err => {
      setStatus('signed_out');
      showNotice('error', err.message);
    });
  }, [refresh, showNotice]);

  // Keep everyone's view in sync: poll while the tab is visible, and refresh when it regains focus.
  useEffect(() => {
    if (status !== 'ready') return;
    const tick = () => {
      if (document.visibilityState === 'visible') refresh().catch(() => undefined);
    };
    const id = window.setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [status, refresh]);

  useEffect(() => writeStorage(STORAGE_KEYS.LANGUAGE, language), [language]);
  useEffect(() => {
    if (activeGroupId) writeStorage(STORAGE_KEYS.ACTIVE_GROUP, activeGroupId);
  }, [activeGroupId]);

  // ---- Derived state ----
  const currentUser = data?.currentUser ?? EMPTY_USER;
  const users = data?.users ?? [];
  const groups = data?.groups ?? [];
  const tasks = data?.tasks ?? [];
  const dailyLogs = data?.dailyLogs ?? [];
  const activityEvents = data?.activityEvents ?? [];

  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];
  const resolvedGroupId = activeGroup?.id ?? '';

  const derived = useMemo(() => {
    const memberIds = new Set(activeGroup?.memberIds ?? []);
    return {
      activeGroupMembers: users.filter(u => memberIds.has(u.id)),
      activeGroupTasks: tasks.filter(t => t.groupId === resolvedGroupId),
      activeGroupDailyLogs: dailyLogs.filter(d => d.groupId === resolvedGroupId),
      activeGroupActivityEvents: activityEvents.filter(e => e.groupId === resolvedGroupId),
    };
  }, [activeGroup, users, tasks, dailyLogs, activityEvents, resolvedGroupId]);

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isMemberOfActive = !!activeGroup?.memberIds.includes(currentUser.id);
  const isTeamLead =
    isSuperAdmin ||
    (isMemberOfActive && (currentUser.role === 'team_lead' || activeGroup?.leaderId === currentUser.id));
  const canContribute = isSuperAdmin || (isMemberOfActive && currentUser.role !== 'viewer');

  // ---- Action helper: call the API, show errors, then reload data ----
  const run = useCallback(
    async (action: () => Promise<unknown>, successMessage?: string) => {
      try {
        await action();
        if (successMessage) showNotice('success', successMessage);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setData(null);
          setStatus('signed_out');
        }
        showNotice('error', err instanceof Error ? err.message : String(err));
        throw err;
      } finally {
        await refresh().catch(() => undefined);
      }
    },
    [refresh, showNotice]
  );
  // For fire-and-forget UI handlers: the error is already shown as a notice.
  const quiet = (p: Promise<unknown>) => p.then(() => undefined, () => undefined);

  const value: AppContextType = {
    language,
    setLanguage: setLanguageState,
    t,

    status,
    currentUser,
    async login(email, password) {
      await api.login(email, password);
      await refresh();
    },
    async register(input) {
      await api.register(input);
      await refresh();
    },
    async logout() {
      await api.logout().catch(() => undefined);
      setData(null);
      setStatus('signed_out');
    },
    refresh,

    notice,
    dismissNotice: () => setNotice(null),

    isSuperAdmin,
    isTeamLead,
    canContribute,

    users,
    groups,
    activeGroupId: resolvedGroupId,
    setActiveGroupId: setActiveGroupIdState,
    activeGroup,
    ...derived,
    tasks,
    dailyLogs,
    activityEvents,

    // Groups & members
    addMemberToGroup: ({ groupId, ...member }) =>
      run(() => api.addMember(groupId || resolvedGroupId, member)),
    removeMemberFromGroup: (userId, groupId) =>
      quiet(run(() => api.removeMember(groupId || resolvedGroupId, userId))),
    updateUserRole: (userId, role) => quiet(run(() => api.updateUserRole(userId, role, resolvedGroupId || undefined))),
    createGroup: input =>
      run(async () => {
        const { id } = await api.createGroup(input);
        setActiveGroupIdState(id);
      }),
    deleteGroup: groupId => run(() => api.deleteGroup(groupId)),
    joinGroup: codeOrId =>
      run(async () => {
        const res = await api.joinGroup(codeOrId);
        setActiveGroupIdState(res.group.id);
      }, language === 'km' ? 'បានចូលរួមក្រុមដោយជោគជ័យ!' : 'Successfully joined group!'),
    leaveGroup: (userId, groupId) => run(() => api.removeMember(groupId || resolvedGroupId, userId)),
    updateGroupDeadline: (groupId, deadline) => quiet(run(() => api.updateGroup(groupId, { deadline }))),

    // Daily standups
    addSimpleDailyLog: rawContent => run(() => api.createDailyLog(resolvedGroupId, rawContent, todayLocal())),
    toggleDailyTodoItem: (logId, itemId) => quiet(run(() => api.toggleDailyLogItem(logId, itemId))),
    markDailyLogDone: logId => quiet(run(() => api.completeDailyLog(logId))),
    approveDailyLog: (logId, feedback) => quiet(run(() => api.approveDailyLog(logId, feedback))),
    deleteDailyLog: logId => quiet(run(() => api.deleteDailyLog(logId))),
    addReactionToDailyLog: (logId, emoji) => quiet(run(() => api.toggleReaction(logId, emoji))),

    // Tasks
    assignTask: input => run(() => api.createTask(resolvedGroupId, input)),
    updateTaskStatus: (taskId, status, notes) => quiet(run(() => api.updateTaskStatus(taskId, status, notes))),
    updateTaskDeadline: (taskId, dueDate, dueTime) => quiet(run(() => api.updateTaskDeadline(taskId, dueDate, dueTime))),
    approveTask: (taskId, feedback) => quiet(run(() => api.approveTask(taskId, feedback))),
    deleteTask: taskId => quiet(run(() => api.deleteTask(taskId))),

    clearActivityLogs: groupId => quiet(run(() => api.clearActivity(groupId || resolvedGroupId))),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
