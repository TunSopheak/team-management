import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { daysUntil } from '../lib/dates';
import {
  FolderKanban,
  Calendar,
  Users,
  CheckCircle2,
  Trash2,
  LogOut,
  Plus,
  ChevronDown,
  UserPlus,
  Clock,
  Layers
} from 'lucide-react';

interface GroupBannerProps {
  onOpenCreateGroup: () => void;
  onOpenAddMember: () => void;
  onOpenDeleteGroup: (groupId: string) => void;
  onOpenLeaveGroup: (groupId: string) => void;
}

export const GroupBanner: React.FC<GroupBannerProps> = ({
  onOpenCreateGroup,
  onOpenAddMember,
  onOpenDeleteGroup,
  onOpenLeaveGroup,
}) => {
  const {
    activeGroup,
    currentUser,
    groups,
    setActiveGroupId,
    activeGroupMembers,
    activeGroupTasks,
    isSuperAdmin,
    updateGroupDeadline,
    t,
    language,
  } = useApp();

  const [showGroupSwitcher, setShowGroupSwitcher] = useState(false);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [newDeadlineInput, setNewDeadlineInput] = useState(activeGroup?.deadline || '');

  if (!activeGroup) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-lg border border-neutral-300 p-8 text-center">
        <FolderKanban className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <p className="text-neutral-700 mb-4 font-medium max-w-md mx-auto">
          {isSuperAdmin ? t.noGroupSelected : t.noGroupsMember}
        </p>
        {isSuperAdmin && (
          <button
            onClick={onOpenCreateGroup}
            className="px-4 py-2 bg-black text-white rounded-md text-xs font-semibold hover:bg-neutral-800 transition-colors"
          >
            {t.createGroup}
          </button>
        )}
      </div>
      </div>
    );
  }

  // Calculate stats
  const totalTasks = activeGroupTasks.length;
  const approvedTasks = activeGroupTasks.filter(t => t.status === 'approved').length;
  const reviewTasks = activeGroupTasks.filter(t => t.status === 'ready_for_review').length;
  const progressPercent = totalTasks > 0 ? Math.round((approvedTasks / totalTasks) * 100) : 0;

  const getDeadlineText = () => {
    if (!activeGroup.deadline) return null;
    const diffDays = daysUntil(activeGroup.deadline);

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} ${t.daysOverdue}`, isUrgent: true };
    } else if (diffDays === 0) {
      return { text: t.dueToday, isUrgent: true };
    } else {
      return { text: `${diffDays} ${t.daysLeft}`, isUrgent: diffDays <= 3 };
    }
  };

  const deadlineInfo = getDeadlineText();

  return (
    <div className="bg-white border-b border-neutral-200 py-6 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Group Header Info */}
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Group Dropdown Switcher */}
              <div className="relative">
                <button
                  onClick={() => setShowGroupSwitcher(!showGroupSwitcher)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-md text-xs font-semibold tracking-wide transition-colors cursor-pointer hover:bg-neutral-800"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{activeGroup.code}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                {showGroupSwitcher && (
                  <div
                    className="absolute left-0 mt-1.5 w-80 bg-white rounded-lg shadow-2xl border border-neutral-200 py-2 z-50 text-left"
                    onMouseLeave={() => setShowGroupSwitcher(false)}
                  >
                    <div className="px-3 py-1.5 border-b border-neutral-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                        {t.switchGroup} ({groups.length})
                      </span>
                      {isSuperAdmin && (
                        <button
                          onClick={() => {
                            setShowGroupSwitcher(false);
                            onOpenCreateGroup();
                          }}
                          className="text-[11px] text-black hover:underline font-semibold flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{t.createGroup}</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto py-1">
                      {groups.map(group => {
                        const isSelected = group.id === activeGroup.id;
                        return (
                          <button
                            key={group.id}
                            onClick={() => {
                              setActiveGroupId(group.id);
                              setShowGroupSwitcher(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-xs flex flex-col gap-0.5 hover:bg-neutral-100 transition-colors ${
                              isSelected ? 'bg-neutral-100 border-l-2 border-black font-semibold' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-black">
                                {language === 'km' && group.nameKm ? group.nameKm : group.name}
                              </span>
                              <span className="font-mono text-[10px] text-neutral-600 bg-neutral-200 px-1.5 py-0.5 rounded">
                                {group.code}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-500 truncate">
                              {group.courseOrProject}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <span
                className={`text-xs px-2.5 py-0.5 rounded font-mono font-medium border ${
                  activeGroup.status === 'completed'
                    ? 'bg-neutral-900 text-white border-black'
                    : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                }`}
              >
                {activeGroup.status === 'completed' ? t.groupCompleted : t.activeGroups}
              </span>

              {/* Deadline Badge with Inline Editor for Super Admin */}
              {isEditingDeadline && isSuperAdmin ? (
                <div className="flex items-center gap-1 bg-white border border-black rounded px-2 py-0.5 text-xs">
                  <input
                    type="date"
                    value={newDeadlineInput}
                    onChange={e => setNewDeadlineInput(e.target.value)}
                    className="text-xs bg-white text-black focus:outline-none font-mono"
                  />
                  <button
                    onClick={() => {
                      if (newDeadlineInput) {
                        updateGroupDeadline(activeGroup.id, newDeadlineInput);
                      }
                      setIsEditingDeadline(false);
                    }}
                    className="px-1.5 py-0.5 bg-black text-white rounded text-[10px] font-bold cursor-pointer"
                  >
                    ✓ Save
                  </button>
                  <button
                    onClick={() => setIsEditingDeadline(false)}
                    className="text-neutral-400 hover:text-black text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => {
                    if (isSuperAdmin) {
                      setNewDeadlineInput(activeGroup.deadline || '');
                      setIsEditingDeadline(true);
                    }
                  }}
                  className={`flex items-center gap-1 text-xs px-2.5 py-0.5 rounded font-medium border bg-white border-neutral-300 text-neutral-800 ${
                    isSuperAdmin ? 'hover:border-black cursor-pointer' : ''
                  }`}
                  title={isSuperAdmin ? 'Click to change deadline' : undefined}
                >
                  <Calendar className="w-3 h-3 text-black" />
                  <span>
                    {activeGroup.deadline ? `${activeGroup.deadline} (${deadlineInfo?.text})` : 'No Deadline'}
                  </span>
                  {isSuperAdmin && (
                    <span className="text-[10px] text-neutral-400 ml-1">✎</span>
                  )}
                </div>
              )}
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
                {language === 'km' && activeGroup.nameKm ? activeGroup.nameKm : activeGroup.name}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-3xl">
                <span className="font-semibold text-black">{activeGroup.courseOrProject}</span>
                <span className="mx-1.5 text-neutral-300">·</span>
                <span>{activeGroup.description}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics & Controls */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4">
            {/* Quick Metrics */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-neutral-700">
                <Users className="w-4 h-4 text-neutral-500" />
                <span className="font-bold text-black font-mono-numbers">
                  {activeGroupMembers.length}
                </span>
                <span>{language === 'km' ? 'សមាជិក' : 'Members'}</span>
              </div>
              <span className="text-neutral-300">|</span>
              <div className="flex items-center gap-1 text-neutral-700">
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span className="font-bold text-black font-mono-numbers">
                  {approvedTasks}/{totalTasks}
                </span>
                <span>{language === 'km' ? 'សម្រេច' : 'Done'}</span>
                <span className="font-bold font-mono-numbers text-black">
                  ({progressPercent}%)
                </span>
              </div>
              {reviewTasks > 0 && (
                <>
                  <span className="text-neutral-300">|</span>
                  <div className="flex items-center gap-1 text-neutral-900 font-medium">
                    <Clock className="w-4 h-4 text-neutral-500" />
                    <span className="font-mono-numbers font-bold">{reviewTasks}</span>
                    <span>{language === 'km' ? 'រង់ចាំពិនិត្យ' : 'Pending'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Action buttons in Black & White */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Add Member button (Super Admin only) */}
              {isSuperAdmin && (
                <button
                  onClick={onOpenAddMember}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-black hover:bg-neutral-800 rounded-md transition-colors cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t.addMember}</span>
                </button>
              )}

              {/* Create Another Group (Super Admin only) */}
              {isSuperAdmin && (
                <button
                  onClick={onOpenCreateGroup}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-100 rounded-md transition-colors cursor-pointer border border-neutral-300"
                >
                  <Plus className="w-3.5 h-3.5 text-black" />
                  <span>{t.createGroup}</span>
                </button>
              )}

              {/* Leave Group (only when you are a member) */}
              {activeGroup.memberIds.includes(currentUser.id) && (
              <button
                onClick={() => onOpenLeaveGroup(activeGroup.id)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-black bg-white hover:bg-neutral-100 rounded-md transition-colors cursor-pointer border border-neutral-300"
                title={t.leaveGroup}
              >
                <LogOut className="w-3.5 h-3.5 text-neutral-500" />
                <span>{t.leaveGroup}</span>
              </button>
              )}

              {/* Delete Group (Super Admin only) */}
              {isSuperAdmin && (
                <button
                  onClick={() => onOpenDeleteGroup(activeGroup.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-md transition-colors cursor-pointer border border-neutral-300"
                  title={t.deleteGroup}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.deleteGroup}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
