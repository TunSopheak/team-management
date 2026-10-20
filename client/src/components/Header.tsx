import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Menu,
  Search,
  X,
  Plus,
  ArrowRight,
  Globe,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'tasks' | 'daily' | 'members' | 'report';
  setActiveTab: (tab: 'dashboard' | 'tasks' | 'daily' | 'members' | 'report') => void;
  onOpenAssignTask: () => void;
  onOpenCreateGroup: () => void;
  onOpenAddMember: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onToggleMobileSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAssignTask,
  searchQuery = '',
  setSearchQuery,
  onToggleMobileSidebar,
}) => {
  const {
    currentUser,
    logout,
    users,
    language,
    setLanguage,
    t,
    isSuperAdmin,
    isTeamLead,
    activeGroup,
    activeGroupTasks,
    activeGroupMembers,
  } = useApp();

  const [internalSearch, setInternalSearch] = useState(searchQuery);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInternalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (val: string) => {
    setInternalSearch(val);
    if (setSearchQuery) {
      setSearchQuery(val);
    }
    if (val.trim()) {
      setIsSearchOpen(true);
    }
  };

  // Keyboard shortcut '/' or 'Ctrl+K' / 'Cmd+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter tasks and members based on search
  const q = internalSearch.toLowerCase().trim();
  const matchingTasks = q
    ? activeGroupTasks.filter(task => {
        const assignee = users.find(u => u.id === task.assignedTo);
        return (
          task.title.toLowerCase().includes(q) ||
          task.module.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q) ||
          (assignee && assignee.name.toLowerCase().includes(q))
        );
      })
    : [];

  const matchingMembers = q
    ? activeGroupMembers.filter(member => {
        return (
          member.name.toLowerCase().includes(q) ||
          (member.nameKm && member.nameKm.toLowerCase().includes(q)) ||
          member.email.toLowerCase().includes(q) ||
          member.studentId.toLowerCase().includes(q) ||
          (member.specialty && member.specialty.toLowerCase().includes(q)) ||
          member.role.toLowerCase().includes(q)
        );
      })
    : [];

  const hasResults = matchingTasks.length > 0 || matchingMembers.length > 0;

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return t.tabDashboard;
      case 'daily':
        return t.tabDailyLogs;
      case 'tasks':
        return t.tabTasks;
      case 'members':
        return t.tabMembers;
      case 'report':
        return t.tabReport;
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left Zone: Mobile Hamburger + Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger button for mobile */}
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 -ml-2 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-md cursor-pointer"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs truncate">
              <span className="font-bold text-black truncate max-w-44 sm:max-w-64">
                {activeGroup ? (language === 'km' && activeGroup.nameKm ? activeGroup.nameKm : activeGroup.name) : 'LeaderSync'}
              </span>
              <span className="text-neutral-400">/</span>
              <span className="text-neutral-600 font-semibold truncate hidden sm:inline">
                {getTabTitle()}
              </span>
              {activeGroup && (
                <span className="hidden md:inline-flex text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                  {activeGroup.code}
                </span>
              )}
            </div>
          </div>

          {/* Center Zone: Search Bar with CMD+K */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-xs sm:max-w-md lg:max-w-lg mx-2">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={internalSearch}
                onChange={e => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (internalSearch.trim()) setIsSearchOpen(true);
                }}
                placeholder={
                  language === 'km'
                    ? 'ស្វែងរកកិច្ចការ, សមាជិក, ឬផ្នែក...'
                    : 'Search tasks, members, categories...'
                }
                className="w-full pl-9 pr-14 py-1.5 text-xs bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
              />
              {internalSearch ? (
                <button
                  onClick={() => {
                    handleSearchChange('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-2.5 p-0.5 text-neutral-400 hover:text-black cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="absolute right-2.5 hidden sm:flex items-center gap-0.5 text-[10px] font-mono text-neutral-400 pointer-events-none">
                  <span className="bg-white border border-neutral-200 px-1 rounded shadow-2xs">⌘K</span>
                </div>
              )}
            </div>

            {/* Quick-Search Results Dropdown */}
            {isSearchOpen && q && (
              <div className="absolute left-0 right-0 mt-2 bg-white text-black rounded-lg shadow-2xl border border-neutral-200 py-2 z-50 max-h-96 overflow-y-auto">
                {!hasResults ? (
                  <div className="p-4 text-center text-xs text-neutral-500">
                    <p className="font-semibold text-black">
                      {language === 'km' ? 'រកមិនឃើញលទ្ធផលទេ' : 'No matching results'}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {language === 'km' ? 'សូមសាកល្បងស្វែងរកដោយប្រើពាក្យផ្សេង' : 'Try searching for a different task, member, or category'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Tasks Matches */}
                    {matchingTasks.length > 0 && (
                      <div>
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                          <span>{language === 'km' ? 'កិច្ចការងារ' : 'Tasks'} ({matchingTasks.length})</span>
                          <span className="font-mono text-[9px] text-neutral-500">{language === 'km' ? 'ចុចដើម្បីមើល' : 'click to jump'}</span>
                        </div>
                        <div className="divide-y divide-neutral-100">
                          {matchingTasks.map(task => {
                            const assignee = users.find(u => u.id === task.assignedTo);
                            return (
                              <button
                                key={task.id}
                                onClick={() => {
                                  setActiveTab('tasks');
                                  setIsSearchOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-neutral-50 transition-colors flex items-start justify-between gap-2 cursor-pointer group"
                              >
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 text-black font-semibold border border-neutral-200">
                                      {task.module}
                                    </span>
                                    <span className="text-xs font-bold text-black group-hover:underline truncate">
                                      {task.title}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-neutral-500 truncate">
                                    {language === 'km' ? 'ចាត់តាំងឱ្យ៖' : 'Assigned to:'} <span className="font-semibold text-neutral-800">{assignee?.name}</span> · Deadline: {task.dueDate}
                                  </p>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black shrink-0 mt-1" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Members Matches */}
                    {matchingMembers.length > 0 && (
                      <div className="pt-1 border-t border-neutral-100">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                          <span>{language === 'km' ? 'សមាជិកក្រុម' : 'Team Members'} ({matchingMembers.length})</span>
                          <span className="font-mono text-[9px] text-neutral-500">{language === 'km' ? 'ចុចដើម្បីមើល' : 'click to jump'}</span>
                        </div>
                        <div className="divide-y divide-neutral-100">
                          {matchingMembers.map(member => (
                            <button
                              key={member.id}
                              onClick={() => {
                                setActiveTab('members');
                                setIsSearchOpen(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-neutral-50 transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded bg-neutral-100 border border-neutral-300 flex items-center justify-center font-bold text-xs text-black shrink-0">
                                  {member.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-black group-hover:underline truncate">
                                      {member.name}
                                    </span>
                                    {member.nameKm && (
                                      <span className="text-[11px] text-neutral-500 truncate">({member.nameKm})</span>
                                    )}
                                    <span className="text-[9px] font-mono uppercase bg-neutral-200 text-black px-1 rounded shrink-0">
                                      {member.role.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-neutral-500 truncate block">
                                    {member.studentId} · {member.specialty || member.email}
                                  </span>
                                </div>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Zone: Role Pill + Quick Assign + Persona Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Assign Action for Leader */}
            {isTeamLead && (
              <button
                onClick={onOpenAssignTask}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-black hover:bg-neutral-800 rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.assignNewTask}</span>
              </button>
            )}

            {/* Account Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-black rounded-lg text-xs transition-colors border border-neutral-200 cursor-pointer"
                title={currentUser.email}
              >
                <div className="w-5 h-5 rounded bg-black text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="font-semibold hidden md:inline truncate max-w-28">{currentUser.name}</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-neutral-200 text-black uppercase font-bold hidden sm:inline">
                  {currentUser.role === 'super_admin' ? 'ADMIN' : currentUser.role === 'team_lead' ? 'LEAD' : currentUser.role === 'viewer' ? 'VIEWER' : 'MEMBER'}
                </span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {showUserDropdown && (
                <div
                  className="absolute right-0 mt-1.5 w-64 bg-white text-black rounded-lg shadow-2xl border border-neutral-200 py-1.5 z-50 text-left"
                  onMouseLeave={() => setShowUserDropdown(false)}
                >
                  <div className="px-3 py-2 border-b border-neutral-100 text-xs">
                    <p className="font-bold text-black truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {currentUser.email} · ID: {currentUser.studentId}
                    </p>
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

            {/* Language toggle */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200 cursor-pointer"
                title="Change language"
              >
                <Globe className="w-3.5 h-3.5 text-neutral-500" />
                <span className="font-bold">{language === 'km' ? 'ខ្មែរ' : 'EN'}</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {showLanguageDropdown && (
                <div
                  className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-neutral-200 py-1 z-50 text-xs"
                  onMouseLeave={() => setShowLanguageDropdown(false)}
                >
                  <button
                    onClick={() => {
                      setLanguage('km');
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left font-medium hover:bg-neutral-100 flex items-center justify-between cursor-pointer ${
                      language === 'km' ? 'text-black font-bold bg-neutral-100' : 'text-neutral-700'
                    }`}
                  >
                    <span>🇰🇭 ខ្មែរ (Khmer)</span>
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left font-medium hover:bg-neutral-100 flex items-center justify-between cursor-pointer ${
                      language === 'en' ? 'text-black font-bold bg-neutral-100' : 'text-neutral-700'
                    }`}
                  >
                    <span>🇬🇧 English</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
