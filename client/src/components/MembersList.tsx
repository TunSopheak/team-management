import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { todayLocal } from '../lib/dates';
import { Role } from '../types';
import {
  Shield,
  ShieldCheck,
  UserPlus,
  Trash2,
  CheckCircle2,
  Clock,
  UserCheck,
  Users,
  Search,
  X
} from 'lucide-react';

interface MembersListProps {
  onOpenAddMember: () => void;
  onOpenLeaveGroup: (groupId: string) => void;
  searchQuery?: string;
}

export const MembersList: React.FC<MembersListProps> = ({
  onOpenAddMember,
  searchQuery: externalSearchQuery = '',
}) => {
  const {
    activeGroupMembers,
    currentUser,
    isSuperAdmin,
    updateUserRole,
    removeMemberFromGroup,
    activeGroupTasks,
    activeGroupDailyLogs,
    t,
    language,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState(externalSearchQuery);
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const todayStr = todayLocal();

  React.useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  const filteredMembers = activeGroupMembers.filter(member => {
    if (roleFilter !== 'all' && member.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        member.name.toLowerCase().includes(q) ||
        (member.nameKm && member.nameKm.toLowerCase().includes(q)) ||
        member.studentId.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        (member.specialty && member.specialty.toLowerCase().includes(q)) ||
        member.role.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'super_admin':
        return {
          label: t.superAdminBadge,
          color: 'bg-black text-white',
          icon: <ShieldCheck className="w-3 h-3 text-white" />,
        };
      case 'team_lead':
        return {
          label: t.teamLeadBadge,
          color: 'bg-neutral-200 text-black border border-neutral-300',
          icon: <Shield className="w-3 h-3 text-black" />,
        };
      case 'member':
        return {
          label: t.memberBadge,
          color: 'bg-white text-black border border-neutral-300',
          icon: <UserCheck className="w-3 h-3 text-neutral-500" />,
        };
      default:
        return {
          label: t.viewerBadge,
          color: 'bg-neutral-50 text-neutral-600 border border-neutral-200',
          icon: <Users className="w-3 h-3 text-neutral-400" />,
        };
    }
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-black tracking-tight">
              {t.manageMembers}
            </h2>
            <span className="text-xs bg-neutral-100 text-black font-mono px-2 py-0.5 rounded font-semibold border border-neutral-200">
              {activeGroupMembers.length} {language === 'km' ? 'នាក់' : 'members'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            {isSuperAdmin ? t.onlySuperAdminNotice : t.memberViewDesc}
          </p>
        </div>

        {/* Super Admin Add Member button */}
        {isSuperAdmin && (
          <button
            onClick={onOpenAddMember}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.addMember}</span>
          </button>
        )}
      </div>

      {/* Super Admin Notice */}
      {isSuperAdmin && (
        <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-2.5 text-xs text-neutral-700 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-black shrink-0" />
          <span>
            {language === 'km'
              ? 'ក្នុងនាមជា Super Admin អ្នកអាចកំណត់តួនាទី (Role) ឱ្យសមាជិក បន្ថែមសមាជិកថ្មីតាម Email/ID និងដកសមាជិកចេញបានតាមតម្រូវការ។'
              : 'As Super Admin, you can assign roles, add new members via Email/ID, and remove members as needed.'}
          </span>
        </div>
      )}

      {/* Member Filter & Search Bar */}
      <div className="p-4 border-b border-neutral-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              language === 'km'
                ? 'ស្វែងរកសមាជិកតាមឈ្មោះ, ID, អ៊ីមែល ឬជំនាញ...'
                : 'Search members by name, ID, email, or specialty...'
            }
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role Filters */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              roleFilter === 'all'
                ? 'bg-black text-white'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            {language === 'km' ? 'ទាំងអស់' : 'All'}
          </button>
          <button
            onClick={() => setRoleFilter('super_admin')}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              roleFilter === 'super_admin'
                ? 'bg-black text-white'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => setRoleFilter('team_lead')}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              roleFilter === 'team_lead'
                ? 'bg-black text-white'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            Lead
          </button>
          <button
            onClick={() => setRoleFilter('member')}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              roleFilter === 'member'
                ? 'bg-black text-white'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            Member
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
              <th className="py-3 px-6">{t.memberName}</th>
              <th className="py-3 px-4">{t.memberId} & {t.memberEmail}</th>
              <th className="py-3 px-4">{t.memberRole}</th>
              <th className="py-3 px-4">{t.memberSpecialty}</th>
              <th className="py-3 px-4 text-center">{language === 'km' ? 'ToDo ថ្ងៃនេះ' : 'Today Standup'}</th>
              <th className="py-3 px-4 text-center">{language === 'km' ? 'កិច្ចការ' : 'Tasks'}</th>
              {isSuperAdmin && <th className="py-3 px-6 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-xs">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-neutral-500">
                  {language === 'km'
                    ? 'រកមិនឃើញសមាជិកដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកឡើយ'
                    : 'No members match the search criteria.'}
                </td>
              </tr>
            ) : (
              filteredMembers.map(member => {
                const roleBadge = getRoleBadge(member.role);
                const isCurrentUser = member.id === currentUser.id;
                const hasSubmittedToday = activeGroupDailyLogs.some(
                  l => l.userId === member.id && l.date === todayStr
                );
                const assignedTasksCount = activeGroupTasks.filter(
                  t => t.assignedTo === member.id
                ).length;
                const completedTasksCount = activeGroupTasks.filter(
                  t => t.assignedTo === member.id && t.status === 'approved'
                ).length;

                return (
                  <tr
                    key={member.id}
                    className={`hover:bg-neutral-50 transition-colors ${
                      isCurrentUser ? 'bg-neutral-50/60' : ''
                    }`}
                  >
                    {/* Name and avatar */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-neutral-100 border border-neutral-300 flex items-center justify-center font-bold text-black text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-black">
                              {member.name}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] bg-black text-white font-medium px-1.5 py-0.2 rounded">
                                {language === 'km' ? 'អ្នក (You)' : 'You'}
                              </span>
                            )}
                          </div>
                          {member.nameKm && (
                            <span className="text-[11px] text-neutral-500 block">
                              {member.nameKm}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* ID & Email */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-mono text-black font-semibold block">
                          {member.studentId}
                        </span>
                        <span className="text-neutral-500 text-[11px] block">
                          {member.email}
                        </span>
                      </div>
                    </td>

                    {/* Role / Permission */}
                    <td className="py-4 px-4">
                      {isSuperAdmin && !isCurrentUser ? (
                        <select
                          value={member.role}
                          onChange={e => updateUserRole(member.id, e.target.value as Role)}
                          className="text-xs bg-white border border-neutral-300 rounded px-2 py-1 text-black font-medium focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                        >
                          <option value="super_admin">{t.superAdminBadge}</option>
                          <option value="team_lead">{t.teamLeadBadge}</option>
                          <option value="member">{t.memberBadge}</option>
                          <option value="viewer">{t.viewerBadge}</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${roleBadge.color}`}
                        >
                          {roleBadge.icon}
                          <span>{roleBadge.label}</span>
                        </span>
                      )}
                    </td>

                    {/* Specialty */}
                    <td className="py-4 px-4 text-neutral-700">
                      <span>{member.specialty || 'General'}</span>
                    </td>

                    {/* Today Standup Status */}
                    <td className="py-4 px-4 text-center">
                      {hasSubmittedToday ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-black bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-black" />
                          <span>{language === 'km' ? 'បានបញ្ចូល' : 'Submitted'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          <span>{language === 'km' ? 'មិនទាន់' : 'Pending'}</span>
                        </span>
                      )}
                    </td>

                    {/* Tasks count */}
                    <td className="py-4 px-4 text-center">
                      <span className="font-mono font-bold text-black">
                        {completedTasksCount}/{assignedTasksCount}
                      </span>
                    </td>

                    {/* Actions for Super Admin */}
                    {isSuperAdmin && (
                      <td className="py-4 px-6 text-right">
                        {!isCurrentUser ? (
                          <button
                            onClick={() => {
                              if (confirm(t.removeMemberConfirm)) {
                                removeMemberFromGroup(member.id);
                              }
                            }}
                            className="text-neutral-500 hover:text-black hover:bg-neutral-100 p-1.5 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                            title={t.removeMember}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[11px]">{t.removeMember}</span>
                          </button>
                        ) : (
                          <span className="text-neutral-400 text-[11px] italic">
                            {language === 'km' ? 'ម្ចាស់ប្រព័ន្ធ' : 'Super Admin'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
