import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { daysUntil } from '../lib/dates';
import { Task, TaskPriority, TaskStatus } from '../types';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Plus,
  Trash2,
  Check,
  Award,
  Search,
  Filter,
  X,
  Layers,
  User as UserIcon
} from 'lucide-react';

interface TaskBoardProps {
  onOpenAssignTask: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  onOpenAssignTask,
  searchQuery: externalSearchQuery = '',
  onSearchChange,
}) => {
  const {
    activeGroupTasks,
    activeGroupMembers,
    users,
    currentUser,
    isTeamLead,
    canContribute,
    updateTaskStatus,
    updateTaskDeadline,
    approveTask,
    deleteTask,
    t,
    language,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [approvingTaskId, setApprovingTaskId] = useState<string | null>(null);
  const [leaderFeedback, setLeaderFeedback] = useState('');
  const [editingDeadlineTaskId, setEditingDeadlineTaskId] = useState<string | null>(null);
  const [newDeadlineDate, setNewDeadlineDate] = useState('');

  // Sync external search query
  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  // Extract unique modules / assignment categories
  const categories = Array.from(new Set(activeGroupTasks.map(t => t.module))).filter(Boolean);

  const filteredTasks = activeGroupTasks.filter(task => {
    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;

    // Assignee filter
    if (assigneeFilter !== 'all' && task.assignedTo !== assigneeFilter) return false;

    // Category / Module filter
    if (categoryFilter !== 'all' && task.module.toLowerCase() !== categoryFilter.toLowerCase()) return false;

    // Search query (matches title, description, module/category, or assignee name/studentId)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const assignee = users.find(u => u.id === task.assignedTo);
      const match =
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.module.toLowerCase().includes(q) ||
        (assignee && assignee.name.toLowerCase().includes(q)) ||
        (assignee && assignee.studentId.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const isAnyFilterActive =
    statusFilter !== 'all' ||
    assigneeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setStatusFilter('all');
    setAssigneeFilter('all');
    setCategoryFilter('all');
    handleSearchChange('');
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return {
          label: t.taskPriorityUrgent,
          className: 'bg-black text-white border-black font-bold',
        };
      case 'high':
        return {
          label: t.taskPriorityHigh,
          className: 'bg-neutral-200 text-black border-neutral-300 font-semibold',
        };
      case 'medium':
        return {
          label: t.taskPriorityMedium,
          className: 'bg-white text-black border-neutral-300',
        };
      case 'low':
      default:
        return {
          label: t.taskPriorityLow,
          className: 'bg-neutral-50 text-neutral-600 border-neutral-200',
        };
    }
  };

  const getDeadlineStatus = (dueDate: string) => {
    const diffDays = daysUntil(dueDate);

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} ${t.daysOverdue}`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: t.dueToday, isToday: true };
    } else {
      return { text: `${diffDays} ${t.daysLeft}`, isUpcoming: true };
    }
  };

  const handleMarkAsDoneSubmit = (taskId: string) => {
    updateTaskStatus(taskId, 'ready_for_review', completionNote.trim() || undefined);
    setCompletingTaskId(null);
    setCompletionNote('');
  };

  const handleApproveSubmit = (taskId: string) => {
    approveTask(taskId, leaderFeedback.trim() || undefined);
    setApprovingTaskId(null);
    setLeaderFeedback('');
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Controls */}
      <div className="bg-white p-4 rounded-lg border border-neutral-200 space-y-3">
        {/* Row 1: Search Bar & Primary Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder={
                language === 'km'
                  ? 'ស្វែងរកតាមឈ្មោះកិច្ចការ, អ្នកទទួលខុសត្រូវ, ឬផ្នែក/Category...'
                  : 'Filter by task title, assignee name, or assignment category...'
              }
              className="w-full pl-9 pr-8 py-2 text-xs bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Tools: Assignee Filter, Category Filter, New Task */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category / Module Dropdown */}
            <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded-md px-2 py-1.5 text-xs">
              <Layers className="w-3 h-3 text-neutral-500" />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs text-black focus:outline-none cursor-pointer"
              >
                <option value="all">
                  {language === 'km' ? 'គ្រប់ផ្នែក (All Categories)' : 'All Categories'}
                </option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee Filter Dropdown */}
            <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded-md px-2 py-1.5 text-xs">
              <UserIcon className="w-3 h-3 text-neutral-500" />
              <select
                value={assigneeFilter}
                onChange={e => setAssigneeFilter(e.target.value)}
                className="bg-transparent text-xs text-black focus:outline-none cursor-pointer"
              >
                <option value="all">
                  {language === 'km' ? 'សមាជិកទាំងអស់' : 'All Assignees'}
                </option>
                {activeGroupMembers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.studentId})
                  </option>
                ))}
              </select>
            </div>

            {/* New Task button */}
            {isTeamLead && (
              <button
                onClick={onOpenAssignTask}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-black hover:bg-neutral-800 rounded-md shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.assignNewTask}</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Status Segments & Quick Category Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 text-xs">
          {/* Status segmented filters */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              {t.all} ({activeGroupTasks.length})
            </button>
            <button
              onClick={() => setStatusFilter('todo')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                statusFilter === 'todo'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              {t.taskStatusTodo}
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                statusFilter === 'in_progress'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              {t.taskStatusInProgress}
            </button>
            <button
              onClick={() => setStatusFilter('ready_for_review')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                statusFilter === 'ready_for_review'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              {t.taskStatusReview}
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              {t.taskStatusApproved}
            </button>
          </div>

          {/* Active Filter Indicators & Reset */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-neutral-500">
              {filteredTasks.length} {language === 'km' ? 'កិច្ចការត្រូវបានបង្ហាញ' : 'tasks match'}
            </span>

            {isAnyFilterActive && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-neutral-600 hover:text-black hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>{language === 'km' ? 'សម្អាតតម្រង' : 'Clear filters'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Category / Module Filter Pills */}
        {categories.length > 1 && (
          <div className="flex flex-wrap items-center gap-1 pt-1">
            <span className="text-[11px] text-neutral-400 mr-1 flex items-center gap-1 font-medium">
              <Layers className="w-3 h-3" />
              <span>{language === 'km' ? 'ផ្នែក (Category):' : 'Category:'}</span>
            </span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              {language === 'km' ? 'ទាំងអស់' : 'All'}
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                  categoryFilter.toLowerCase() === cat.toLowerCase()
                    ? 'bg-black text-white border-black font-semibold'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <Clock className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-black">
            {isAnyFilterActive
              ? (language === 'km' ? 'រកមិនឃើញកិច្ចការដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកឡើយ' : 'No tasks match the active search or filters')
              : t.noTasksFound}
          </p>
          {isAnyFilterActive ? (
            <button
              onClick={handleResetFilters}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-black rounded text-xs font-semibold cursor-pointer border border-neutral-300"
            >
              <X className="w-3.5 h-3.5" />
              <span>{language === 'km' ? 'បង្ហាញកិច្ចការទាំងអស់ឡើងវិញ' : 'Reset all filters'}</span>
            </button>
          ) : isTeamLead ? (
            <button
              onClick={onOpenAssignTask}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-md text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.assignNewTask}</span>
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map(task => {
            const assignee = users.find(u => u.id === task.assignedTo) || {
              id: task.assignedTo,
              name: 'Unassigned',
              email: '',
              studentId: '',
              role: 'member',
            };

            const canWorkOnTask = isTeamLead || (canContribute && task.assignedTo === currentUser.id);
            const priorityBadge = getPriorityBadge(task.priority);
            const deadlineInfo = getDeadlineStatus(task.dueDate);

            return (
              <div
                key={task.id}
                className="bg-white rounded-lg border border-neutral-200 p-5 transition-all flex flex-col justify-between gap-4 hover:border-neutral-400 shadow-xs"
              >
                {/* Top: Module / Category + Priority + Delete */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setCategoryFilter(task.module)}
                      className="text-xs font-semibold text-black bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      title="Filter by this category"
                    >
                      {task.module}
                    </button>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase px-2 py-0.5 rounded border ${priorityBadge.className}`}
                      >
                        {priorityBadge.label}
                      </span>

                      {isTeamLead && (
                        <button
                          onClick={() => {
                            if (confirm(language === 'km' ? 'លុបកិច្ចការនេះ?' : 'Delete this task?')) {
                              deleteTask(task.id);
                            }
                          }}
                          className="text-neutral-400 hover:text-black p-0.5 transition-colors cursor-pointer"
                          title={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      className={`text-base font-bold tracking-tight ${
                        task.status === 'approved'
                          ? 'text-neutral-500 line-through'
                          : 'text-black'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <p className="text-xs text-neutral-600 mt-1 line-clamp-3 leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                </div>

                {/* Middle: Notes or Feedback if any */}
                {task.memberNotes && (
                  <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-black">
                    <span className="font-bold block mb-0.5">
                      {language === 'km' ? 'កំណត់សម្គាល់ពីសមាជិក៖' : 'Member notes:'}
                    </span>
                    <span>{task.memberNotes}</span>
                  </div>
                )}

                {task.leaderFeedback && (
                  <div className="p-2.5 bg-neutral-50 border border-neutral-300 rounded-md text-xs text-black">
                    <div className="flex items-center gap-1 font-bold mb-0.5">
                      <Award className="w-3.5 h-3.5 text-black" />
                      <span>{t.leaderFeedbackText}:</span>
                    </div>
                    <span>{task.leaderFeedback}</span>
                  </div>
                )}

                {/* Bottom info & actions */}
                <div className="pt-3 border-t border-neutral-100 space-y-3">
                  <div className="flex items-center justify-between text-xs gap-2">
                    {/* Assignee */}
                    <div
                      onClick={() => setAssigneeFilter(assignee.id)}
                      className="flex items-center gap-2 cursor-pointer group"
                      title="Filter by this member"
                    >
                      <div className="w-6 h-6 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-[11px] text-black">
                        {assignee.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-black block truncate max-w-[130px] group-hover:underline">
                          {assignee.name}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {assignee.studentId}
                        </span>
                      </div>
                    </div>

                    {/* Deadline info */}
                    <div className="text-right">
                      {editingDeadlineTaskId === task.id && isTeamLead ? (
                        <div className="flex items-center gap-1 bg-white border border-black rounded p-1 text-xs">
                          <input
                            type="date"
                            value={newDeadlineDate}
                            onChange={e => setNewDeadlineDate(e.target.value)}
                            className="text-[11px] font-mono bg-white text-black focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              if (newDeadlineDate) {
                                updateTaskDeadline(task.id, newDeadlineDate);
                              }
                              setEditingDeadlineTaskId(null);
                            }}
                            className="px-1.5 py-0.5 bg-black text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingDeadlineTaskId(null)}
                            className="text-neutral-400 hover:text-black text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            if (isTeamLead) {
                              setNewDeadlineDate(task.dueDate);
                              setEditingDeadlineTaskId(task.id);
                            }
                          }}
                          className={`flex items-center gap-1.5 justify-end ${
                            isTeamLead ? 'cursor-pointer group/deadline' : ''
                          }`}
                          title={isTeamLead ? 'Click to change task deadline' : undefined}
                        >
                          <Calendar className="w-3.5 h-3.5 text-neutral-500 group-hover/deadline:text-black" />
                          <div>
                            <span className="font-mono text-black font-medium block">
                              {task.dueDate} {task.dueTime}
                              {isTeamLead && <span className="text-[10px] text-neutral-400 ml-1">✎</span>}
                            </span>
                            <span className="text-[10px] font-semibold text-neutral-700">
                              {deadlineInfo.text}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status & Confirmation Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {/* Status indicator */}
                    <div>
                      {task.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-black px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>{t.taskStatusApproved}</span>
                        </span>
                      )}
                      {task.status === 'ready_for_review' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-black bg-neutral-200 px-2 py-0.5 rounded border border-neutral-300">
                          <Clock className="w-3.5 h-3.5 text-black" />
                          <span>{t.taskStatusReview}</span>
                        </span>
                      )}
                      {task.status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-800 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded">
                          <span>{t.taskStatusInProgress}</span>
                        </span>
                      )}
                      {task.status === 'todo' && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                          <span>{t.taskStatusTodo}</span>
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {canWorkOnTask && task.status === 'todo' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-100 border border-neutral-300 rounded-md transition-colors cursor-pointer"
                        >
                          <span>{language === 'km' ? 'ចាប់ផ្តើមធ្វើ' : 'Start'}</span>
                        </button>
                      )}
                      {canWorkOnTask && task.status !== 'approved' && task.status !== 'ready_for_review' && (
                        <button
                          onClick={() => setCompletingTaskId(task.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-100 border border-neutral-300 rounded-md transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t.btnMarkDone}</span>
                        </button>
                      )}

                      {isTeamLead && task.status === 'ready_for_review' && (
                        <button
                          onClick={() => setApprovingTaskId(task.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-black hover:bg-neutral-800 rounded-md shadow-xs transition-colors cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{t.btnApproveTask}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline completion note */}
                  {completingTaskId === task.id && canWorkOnTask && (
                    <div className="p-3 bg-neutral-50 border border-neutral-300 rounded-md space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-black">
                        <span>{language === 'km' ? 'បញ្ជាក់ការសម្រេចការងារ និងផ្ញើជូនប្រធានត្រួតពិនិត្យ' : 'Submit task completion for Leader review'}</span>
                        <button
                          onClick={() => setCompletingTaskId(null)}
                          className="text-neutral-500 hover:text-black"
                        >
                          {t.cancel}
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={completionNote}
                        onChange={e => setCompletionNote(e.target.value)}
                        placeholder="Notes on what was finished..."
                        className="w-full p-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                      />
                      <button
                        onClick={() => handleMarkAsDoneSubmit(task.id)}
                        className="w-full py-1.5 bg-black hover:bg-neutral-800 text-white font-semibold text-xs rounded transition-colors cursor-pointer"
                      >
                        {t.btnSubmitReview}
                      </button>
                    </div>
                  )}

                  {/* Inline Leader Approval */}
                  {approvingTaskId === task.id && isTeamLead && (
                    <div className="p-3 bg-neutral-50 border border-neutral-300 rounded-md space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-black">
                        <span>{language === 'km' ? 'អនុម័ត និងបញ្ជាក់ទទួលស្គាល់ការងារជោគជ័យ' : 'Leader Sign-off'}</span>
                        <button
                          onClick={() => setApprovingTaskId(null)}
                          className="text-neutral-500 hover:text-black"
                        >
                          {t.cancel}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={leaderFeedback}
                        onChange={e => setLeaderFeedback(e.target.value)}
                        placeholder="Leader feedback / praise..."
                        className="w-full p-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                      />
                      <button
                        onClick={() => handleApproveSubmit(task.id)}
                        className="w-full py-1.5 bg-black hover:bg-neutral-800 text-white font-semibold text-xs rounded transition-colors cursor-pointer"
                      >
                        {t.btnApproveTask}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
