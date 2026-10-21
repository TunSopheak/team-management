import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { GroupBanner } from './components/GroupBanner';
import { DailyStandupBox } from './components/DailyStandupBox';
import { DailyFeed } from './components/DailyFeed';
import { TaskBoard } from './components/TaskBoard';
import { MembersList } from './components/MembersList';
import { OverviewDashboard } from './components/OverviewDashboard';
import { CreateGroupModal } from './components/CreateGroupModal';
import { AssignTaskModal } from './components/AssignTaskModal';
import { AddMemberModal } from './components/AddMemberModal';
import { DeleteGroupModal } from './components/DeleteGroupModal';
import { LeaveGroupModal } from './components/LeaveGroupModal';
import { AssignmentReportModal } from './components/AssignmentReportModal';
import { JoinGroupModal } from './components/JoinGroupModal';
import { AuthScreen } from './components/AuthScreen';
import { Notice } from './components/Notice';
import { Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, language, t } = useApp();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'daily' | 'members' | 'report'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [leaveGroupId, setLeaveGroupId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // If user clicks report tab directly, open report modal
  const handleTabChange = (tab: 'dashboard' | 'tasks' | 'daily' | 'members' | 'report') => {
    if (tab === 'report') {
      setIsReportModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  // Trigger search focus
  const handleTriggerSearch = () => {
    const searchInput = document.querySelector('header input[type="text"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex text-black selection:bg-black selection:text-white">
      {/* Modern Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        onOpenAssignTask={() => setIsAssignTaskOpen(true)}
        onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
        onOpenAddMember={() => setIsAddMemberOpen(true)}
        onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
        onTriggerSearch={handleTriggerSearch}
      />

      {/* Main Workspace Area (Offset dynamically by sidebar width) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Sleek Top Bar with Global Search and Mobile Hamburger */}
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onOpenAssignTask={() => setIsAssignTaskOpen(true)}
          onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
          onOpenAddMember={() => setIsAddMemberOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Workspace Body */}
        <main className="flex-1 pb-16">
          {/* Active Group Banner with Selector and Stats */}
          <GroupBanner
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            onOpenAddMember={() => setIsAddMemberOpen(true)}
            onOpenDeleteGroup={id => setDeleteGroupId(id)}
            onOpenLeaveGroup={id => setLeaveGroupId(id)}
            onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
          />

          {/* Content Container (Standard responsive layout) */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Daily Standup Box: Quick entry right on top */}
                <DailyStandupBox />

                {/* High-level KPIs and Section Split + Activity Log */}
                <OverviewDashboard
                  onGoToTab={tab => handleTabChange(tab)}
                  onOpenAssignTask={() => setIsAssignTaskOpen(true)}
                  onOpenAddMember={() => setIsAddMemberOpen(true)}
                />
              </div>
            )}

            {activeTab === 'tasks' && (
              <TaskBoard
                onOpenAssignTask={() => setIsAssignTaskOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}

            {activeTab === 'daily' && (
              <div className="space-y-6">
                <DailyStandupBox />
                <DailyFeed />
              </div>
            )}

            {activeTab === 'members' && (
              <MembersList
                onOpenAddMember={() => setIsAddMemberOpen(true)}
                onOpenLeaveGroup={id => setLeaveGroupId(id)}
                searchQuery={searchQuery}
              />
            )}
          </div>
        </main>

        {/* Minimalist Footer */}
        <footer className="border-t border-neutral-200 bg-white py-6 text-xs text-neutral-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-black">LeaderSync</span>
              <span>·</span>
              <span>
                {language === 'km'
                  ? 'ប្រព័ន្ធគ្រប់គ្រងក្រុម និងកិច្ចការងារនិស្សិត'
                  : 'Student & Team Leadership Workspace'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="text-black hover:underline font-bold cursor-pointer"
              >
                {t.tabReport}
              </button>
              <span>·</span>
              <span>
                {currentUser.name} ({currentUser.email})
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Interactive Modals */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />

      <AssignTaskModal
        isOpen={isAssignTaskOpen}
        onClose={() => setIsAssignTaskOpen(false)}
      />

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
      />

      <DeleteGroupModal
        groupId={deleteGroupId}
        onClose={() => setDeleteGroupId(null)}
      />

      <LeaveGroupModal
        groupId={leaveGroupId}
        onClose={() => setLeaveGroupId(null)}
      />

      <JoinGroupModal
        isOpen={isJoinGroupOpen}
        onClose={() => setIsJoinGroupOpen(false)}
      />

      <AssignmentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <Notice />
    </div>
  );
};

const SessionGate: React.FC = () => {
  const { status, t } = useApp();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-600 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{t.loading}</span>
      </div>
    );
  }

  if (status === 'signed_out') {
    return (
      <>
        <AuthScreen />
        <Notice />
      </>
    );
  }

  return <MainApp />;
};

export default function App() {
  return (
    <AppProvider>
      <SessionGate />
    </AppProvider>
  );
}
