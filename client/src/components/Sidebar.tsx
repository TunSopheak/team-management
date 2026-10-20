import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { todayLocal } from '../lib/dates';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  FileText,
  Plus,
  Search,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Globe,
  LogOut,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  FolderKanban,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'tasks' | 'daily' | 'members' | 'report';
  setActiveTab: (tab: 'dashboard' | 'tasks' | 'daily' | 'members' | 'report') => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onOpenAssignTask: () => void;
  onOpenCreateGroup: () => void;
  onOpenAddMember: () => void;
  onTriggerSearch: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onOpenAssignTask,
  onOpenCreateGroup,
  onTriggerSearch,
}) => {
  const {
    currentUser,
    logout,
    groups,
    activeGroup,
    setActiveGroupId,
    activeGroupTasks,
    activeGroupMembers,
    activeGroupDailyLogs,
    language,
    setLanguage,
    t,
    isSuperAdmin,
    isTeamLead,
  } = useApp();

  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const todayStr = todayLocal();
  const submittedTodayCount = new Set(
    activeGroupDailyLogs.filter(l => l.date === todayStr).map(l => l.userId)
  ).size;
  const userSubmittedToday = activeGroupDailyLogs.some(
    l => l.userId === currentUser.id && l.date === todayStr
  );
  const pendingReviewTasks = activeGroupTasks.filter(t => t.status === 'ready_for_review').length;
  const inProgressTasks = activeGroupTasks.filter(t => t.status === 'in_progress').length;

  const totalTasks = activeGroupTasks.length;
  const approvedTasks = activeGroupTasks.filter(t => t.status === 'approved').length;
  const progressPercent = totalTasks > 0 ? Math.round((approvedTasks / totalTasks) * 100) : 0;

  const handleNavClick = (tab: 'dashboard' | 'tasks' | 'daily' | 'members' | 'report') => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  const navItems = [
    {
      id: 'dashboard' as const,
      label: t.tabDashboard,
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      badge: null,
    },
    {
      id: 'daily' as const,
      label: t.tabDailyLogs,
      icon: <CheckSquare className="w-4 h-4 shrink-0" />,
      badge: !userSubmittedToday ? (
        <span
          className="w-2 h-2 rounded-full bg-black shrink-0 ring-2 ring-white"
          title={language === 'km' ? 'អ្នកមិនទាន់បានបញ្ចូលថ្ងៃនេះទេ' : 'Not submitted today'}
        />
      ) : (
        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-200 text-black font-semibold">
          {submittedTodayCount}/{activeGroupMembers.length}
        </span>
      ),
    },
    {
      id: 'tasks' as const,
      label: t.tabTasks,
      icon: <FolderKanban className="w-4 h-4 shrink-0" />,
      badge: pendingReviewTasks > 0 ? (
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-black text-white">
          {pendingReviewTasks}
        </span>
      ) : inProgressTasks > 0 ? (
        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-200 text-neutral-800">
          {inProgressTasks}
        </span>
      ) : null,
    },
    {
      id: 'members' as const,
      label: t.tabMembers,
      icon: <Users className="w-4 h-4 shrink-0" />,
      badge: (
        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 font-semibold border border-neutral-200">
          {activeGroupMembers.length}
        </span>
      ),
    },
    {
      id: 'report' as const,
      label: t.tabReport,
      icon: <FileText className="w-4 h-4 shrink-0" />,
      badge: (
        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-neutral-100 text-neutral-500 uppercase">
          PDF
        </span>
      ),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-neutral-200 transition-all duration-200 ease-in-out select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header: Brand + Collapse Toggle */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-bold tracking-tight shrink-0 shadow-xs">
              <span className="text-sm font-bold">LS</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-black tracking-tight leading-none">
                    LeaderSync
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-black text-white font-bold rounded">
                    HUB
                  </span>
                </div>
                <span className="text-[11px] text-neutral-600 truncate mt-0.5 font-medium">
                  {language === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងក្រុម' : 'Team Workspace'}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="flex lg:hidden p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Group Selector Dropdown inside Sidebar */}
        <div className="p-3 border-b border-neutral-100 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowGroupDropdown(!showGroupDropdown)}
              className={`w-full flex items-center gap-2 p-2 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300 transition-all text-left cursor-pointer group ${
                isCollapsed ? 'justify-center p-2' : 'justify-between'
              }`}
              title={activeGroup ? activeGroup.name : 'Select Group'}
            >
              <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                <div className="w-6 h-6 rounded bg-black text-white flex items-center justify-center shrink-0 text-xs font-bold">
                  {activeGroup ? activeGroup.code.substring(0, 2) : 'GP'}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-black truncate leading-tight group-hover:underline">
                      {activeGroup ? (language === 'km' && activeGroup.nameKm ? activeGroup.nameKm : activeGroup.name) : 'Select Group'}
                    </p>
                    <p className="text-[10px] font-mono text-neutral-600 truncate">
                      {activeGroup?.code} · {activeGroupMembers.length} {language === 'km' ? 'នាក់' : 'members'}
                    </p>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black shrink-0 transition-transform" />
              )}
            </button>

            {/* Dropdown Menu */}
            {showGroupDropdown && (
              <div
                className="absolute left-0 right-0 top-full mt-1.5 bg-white text-black rounded-lg shadow-xl border border-neutral-200 py-1.5 z-50 text-left min-w-64"
                onMouseLeave={() => setShowGroupDropdown(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-600 uppercase tracking-wider flex items-center justify-between border-b border-neutral-100">
                  <span>{t.switchGroup}</span>
                  <span className="font-mono text-neutral-600">{groups.length} {language === 'km' ? 'ក្រុម' : 'teams'}</span>
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {groups.map(group => {
                    const isSelected = activeGroup?.id === group.id;
                    return (
                      <button
                        key={group.id}
                        onClick={() => {
                          setActiveGroupId(group.id);
                          setShowGroupDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-neutral-100 transition-colors cursor-pointer ${
                          isSelected ? 'bg-neutral-100 font-bold border-l-2 border-black' : ''
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-black truncate">
                            {language === 'km' && group.nameKm ? group.nameKm : group.name}
                          </p>
                          <p className="text-[10px] text-neutral-600 font-mono">
                            {group.code} · {group.courseOrProject}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="text-[9px] font-mono px-1 rounded bg-black text-white font-bold shrink-0">
                            ACTIVE
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Create Group Action for Super Admin */}
                {isSuperAdmin && (
                  <div className="p-1.5 border-t border-neutral-100">
                    <button
                      onClick={() => {
                        setShowGroupDropdown(false);
                        onOpenCreateGroup();
                      }}
                      className="w-full px-2.5 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.createGroup}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Search Button in Sidebar */}
        <div className="px-3 pt-3 shrink-0">
          <button
            onClick={onTriggerSearch}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 hover:text-black rounded-lg border border-neutral-200 transition-all cursor-pointer group ${
              isCollapsed ? 'justify-center px-2' : 'justify-between'
            }`}
            title="Search tasks, members, or categories (⌘K)"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-neutral-500 group-hover:text-black" />
              {!isCollapsed && (
                <span className="truncate">
                  {language === 'km' ? 'ស្វែងរក...' : 'Quick Search...'}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-neutral-300 text-neutral-500 group-hover:text-black shadow-2xs">
                ⌘K
              </span>
            )}
          </button>
        </div>

        {/* Main Navigation Items */}
        <div className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
          <div className="pb-1">
            {!isCollapsed && (
              <p className="px-2 text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                {language === 'km' ? 'មឺនុយមេ' : 'Menu'}
              </p>
            )}
            <nav className="space-y-1">
              {navItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer group relative ${
                      isActive
                        ? 'bg-black text-white shadow-xs'
                        : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
                    } ${isCollapsed ? 'justify-center px-2' : 'justify-between'}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={isActive ? 'text-white' : 'text-neutral-500 group-hover:text-black'}>
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>
                    {!isCollapsed && item.badge && <div>{item.badge}</div>}

                    {/* Collapsed Tooltip Indicator */}
                    {isCollapsed && isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-black rounded-r" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Leader Quick Action: Assign Task */}
          {isTeamLead && (
            <div className="pt-2">
              <button
                onClick={onOpenAssignTask}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                  isCollapsed ? 'justify-center px-2' : 'justify-center'
                }`}
                title={t.assignNewTask}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                {!isCollapsed && <span>{t.assignNewTask}</span>}
              </button>
            </div>
          )}

          {/* Active Group Progress Widget (when expanded) */}
          {!isCollapsed && activeGroup && (
            <div className="mt-4 p-3 rounded-lg border border-neutral-200 bg-neutral-50/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-600">
                  {language === 'km' ? 'វឌ្ឍនភាពក្រុម' : 'Team Progress'}
                </span>
                <span className="font-mono font-bold text-black">{progressPercent}%</span>
              </div>
              <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-black h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-neutral-600 pt-0.5">
                <span>{approvedTasks}/{totalTasks} {language === 'km' ? 'សម្រេច' : 'completed'}</span>
                <span className="font-mono">{activeGroup.deadline || 'No deadline'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Language & Persona Switcher */}
        <div className="p-3 border-t border-neutral-200 bg-neutral-50/50 shrink-0 space-y-2">
          {/* Language Toggle Row */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-[11px] text-neutral-600 font-medium">
                {language === 'km' ? 'ភាសា' : 'Language'}
              </span>
              <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded p-0.5">
                <button
                  onClick={() => setLanguage('km')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors font-bold cursor-pointer ${
                    language === 'km' ? 'bg-black text-white' : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  🇰🇭 ខ្មែរ
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors font-bold cursor-pointer ${
                    language === 'en' ? 'bg-black text-white' : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setLanguage(language === 'km' ? 'en' : 'km')}
                className="p-1.5 rounded bg-white border border-neutral-200 text-black hover:bg-neutral-100 text-[10px] font-bold cursor-pointer"
                title="Switch Language"
              >
                {language === 'km' ? '🇰🇭' : '🇬🇧'}
              </button>
            </div>
          )}

          {/* Active User Card & Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className={`w-full flex items-center gap-2 p-2 rounded-lg bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-2xs transition-all text-left cursor-pointer group ${
                isCollapsed ? 'justify-center p-2' : 'justify-between'
              }`}
              title={`${currentUser.name} (${currentUser.role})`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-black truncate leading-tight group-hover:underline">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-neutral-600 truncate font-mono">
                      ID: {currentUser.studentId} · {currentUser.role.replace('_', ' ')}
                    </p>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black shrink-0" />
              )}
            </button>

            {/* Account Menu */}
            {showUserDropdown && (
              <div
                className="absolute left-0 bottom-full mb-2 w-64 bg-white text-black rounded-lg shadow-2xl border border-neutral-200 py-2 z-50 text-left"
                onMouseLeave={() => setShowUserDropdown(false)}
              >
                <div className="px-3 py-2 border-b border-neutral-100 text-xs">
                  <p className="font-bold text-black truncate">
                    {currentUser.name} {currentUser.nameKm && <span className="text-neutral-500 font-normal">({currentUser.nameKm})</span>}
                  </p>
                  <p className="text-[11px] text-neutral-500 truncate">{currentUser.email}</p>
                  <p className="text-[10px] font-mono uppercase mt-1 text-neutral-600">{currentUser.role.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-neutral-100 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.signOut}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
