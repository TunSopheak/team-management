import React from 'react';
import { useApp } from '../context/AppContext';
import { todayLocal } from '../lib/dates';
import {
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  Plus,
  ArrowRight,
  Award,
  Sparkles
} from 'lucide-react';
import { ActivityLog } from './ActivityLog';

interface OverviewDashboardProps {
  onGoToTab: (tab: 'dashboard' | 'tasks' | 'daily' | 'members' | 'report') => void;
  onOpenAssignTask: () => void;
  onOpenAddMember: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onGoToTab,
  onOpenAssignTask,
}) => {
  const {
    activeGroupMembers,
    activeGroupTasks,
    activeGroupDailyLogs,
    currentUser,
    isTeamLead,
    t,
    language,
  } = useApp();

  const todayStr = todayLocal();

  const totalTasks = activeGroupTasks.length;
  const approvedTasks = activeGroupTasks.filter(t => t.status === 'approved').length;
  const reviewTasks = activeGroupTasks.filter(t => t.status === 'ready_for_review').length;
  const progressPercent = totalTasks > 0 ? Math.round((approvedTasks / totalTasks) * 100) : 0;

  // Daily standups submitted today
  const submittedTodayLogs = activeGroupDailyLogs.filter(l => l.date === todayStr);
  const submittedCount = new Set(submittedTodayLogs.map(l => l.userId)).size;
  const totalMemberCount = activeGroupMembers.length;
  const standupRate = totalMemberCount > 0 ? Math.round((submittedCount / totalMemberCount) * 100) : 0;

  const hasUserSubmittedToday = activeGroupDailyLogs.some(
    l => l.userId === currentUser.id && l.date === todayStr
  );

  const urgentTasks = activeGroupTasks
    .filter(t => t.status !== 'approved')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Progress */}
        <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {language === 'km' ? 'វឌ្ឍនភាពសម្រេច' : 'Project Completion'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-black" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-black font-mono-numbers">
                {progressPercent}%
              </span>
              <span className="text-xs text-neutral-500">
                ({approvedTasks}/{totalTasks} {language === 'km' ? 'កិច្ចការ' : 'tasks'})
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-black h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Today's Standup Turnout */}
        <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {language === 'km' ? 'របាយការណ៍ ToDo ថ្ងៃនេះ' : "Today's Standup"}
            </span>
            <Clock className="w-4 h-4 text-black" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-black font-mono-numbers">
                {submittedCount}/{totalMemberCount}
              </span>
              <span className="text-xs text-neutral-700 font-bold font-mono-numbers">
                ({standupRate}%)
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-2 truncate">
              {hasUserSubmittedToday
                ? (language === 'km' ? '✓ អ្នកបានបញ្ចូលរួចរាល់ហើយ' : '✓ You have posted today')
                : (language === 'km' ? '⚠ អ្នកមិនទាន់បានបញ្ចូលថ្ងៃនេះទេ' : '⚠ You have not posted yet')}
            </p>
          </div>
        </div>

        {/* Card 3: Pending Review */}
        <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {language === 'km' ? 'រង់ចាំប្រធានត្រួតពិនិត្យ' : 'Pending Verification'}
            </span>
            <Award className="w-4 h-4 text-black" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-black font-mono-numbers">
                {reviewTasks}
              </span>
              <span className="text-xs text-neutral-500">
                {language === 'km' ? 'កិច្ចការរួចរាល់' : 'submitted tasks'}
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-2">
              {isTeamLead
                ? (language === 'km' ? 'ចុចផ្ទាំងកិច្ចការដើម្បីអនុម័ត' : 'Click tasks to verify & sign-off')
                : (language === 'km' ? 'កំពុងរង់ចាំ Leader ពិនិត្យ' : 'Awaiting leader approval')}
            </p>
          </div>
        </div>

        {/* Card 4: Team Members */}
        <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {language === 'km' ? 'សមាជិកក្នុងក្រុម' : 'Team Members'}
            </span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-black font-mono-numbers">
                {totalMemberCount}
              </span>
              <span className="text-xs text-neutral-500">
                {language === 'km' ? 'នាក់កំពុងសកម្ម' : 'active collaborators'}
              </span>
            </div>
            {/* Avatars row */}
            <div className="flex items-center -space-x-1.5 mt-2">
              {activeGroupMembers.slice(0, 5).map(m => (
                <div
                  key={m.id}
                  title={m.name}
                  className="w-6 h-6 rounded-md bg-neutral-100 border border-neutral-300 flex items-center justify-center text-[10px] font-bold text-black shadow-2xs"
                >
                  {m.name.charAt(0)}
                </div>
              ))}
              {totalMemberCount > 5 && (
                <span className="text-[10px] font-mono text-neutral-500 pl-2">
                  +{totalMemberCount - 5}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Standup Feed Preview + Urgent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Standup Updates */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-neutral-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-black tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>{t.recentDailyUpdates}</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  {t.peerVisibilityNotice}
                </p>
              </div>

              <button
                onClick={() => onGoToTab('daily')}
                className="text-xs font-semibold text-black hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{language === 'km' ? 'មើលទាំងអស់' : 'View all'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {submittedTodayLogs.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
                <Clock className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-neutral-700">
                  {language === 'km'
                    ? 'មិនទាន់មានសមាជិកបញ្ចូល ToDo ប្រចាំថ្ងៃនៅថ្ងៃនេះនៅឡើយទេ'
                    : 'No members have posted their daily ToDo today yet.'}
                </p>
                <button
                  onClick={() => onGoToTab('daily')}
                  className="mt-3 px-3.5 py-1.5 bg-black text-white rounded text-xs font-semibold hover:bg-neutral-800 cursor-pointer"
                >
                  {t.btnSubmitDailyLog}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {submittedTodayLogs.slice(0, 3).map(log => {
                  const author = activeGroupMembers.find(m => m.id === log.userId);
                  return (
                    <div
                      key={log.id}
                      className="p-3.5 bg-neutral-50 rounded-md border border-neutral-200 hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-neutral-200 text-black flex items-center justify-center text-xs font-bold">
                            {author?.name.charAt(0) || 'M'}
                          </div>
                          <span className="font-semibold text-xs text-black">
                            {author?.name}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {log.timestamp}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-black bg-white px-2 py-0.5 rounded border border-neutral-300">
                          {log.status === 'approved' ? 'Approved' : log.status === 'completed' ? 'Done' : 'In Progress'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-800 line-clamp-2 leading-relaxed">
                        <span className="font-semibold text-black">[{log.title}]: </span>
                        {log.rawContent}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Urgent Tasks & Next Milestones */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-neutral-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-black tracking-tight flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-black" />
                <span>{language === 'km' ? 'កិច្ចការបន្ទាន់ & Deadline' : 'Upcoming Tasks'}</span>
              </h3>

              <button
                onClick={() => onGoToTab('tasks')}
                className="text-xs font-semibold text-black hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{language === 'km' ? 'មើលទាំងអស់' : 'View all'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {urgentTasks.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500 bg-neutral-50 rounded">
                {language === 'km' ? 'ការងារទាំងអស់ត្រូវបានបញ្ចប់!' : 'All tasks completed!'}
              </div>
            ) : (
              <div className="space-y-3">
                {urgentTasks.map(task => {
                  const assignee = activeGroupMembers.find(m => m.id === task.assignedTo);
                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-neutral-50 rounded-md border border-neutral-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[11px] uppercase tracking-wider text-black">
                          {task.module}
                        </span>
                        <span className="font-mono text-[10px] text-neutral-500">
                          {task.dueDate}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-black truncate">
                        {task.title}
                      </h4>
                      <div className="flex items-center justify-between text-[11px] text-neutral-600 pt-1">
                        <span>{assignee?.name}</span>
                        <span className="font-semibold capitalize text-black">
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Action button for Leader */}
            {isTeamLead && (
              <button
                onClick={onOpenAssignTask}
                className="w-full mt-4 py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-neutral-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.assignNewTask}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Group Activity Log (Tracks major events: task completions, member additions, deadline changes) */}
      <ActivityLog />
    </div>
  );
};
