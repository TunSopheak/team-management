import React from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Printer,
  X
} from 'lucide-react';

interface AssignmentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssignmentReportModal: React.FC<AssignmentReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeGroup,
    activeGroupMembers,
    activeGroupTasks,
    activeGroupDailyLogs,
    users,
    language,
    t,
  } = useApp();

  if (!isOpen || !activeGroup) return null;

  const leader = users.find(u => u.id === activeGroup.leaderId);
  const totalTasks = activeGroupTasks.length;
  const approvedTasks = activeGroupTasks.filter(t => t.status === 'approved').length;
  const progressPercent = totalTasks > 0 ? Math.round((approvedTasks / totalTasks) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-300">
        {/* Modal Top Actions */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10 print:hidden">
          <div className="flex items-center gap-2 text-black font-bold text-base">
            <FileText className="w-5 h-5 text-black" />
            <span>{t.tabReport}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t.printReport}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-black rounded hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 space-y-8 print:p-0">
          {/* Document Header */}
          <div className="border-b-2 border-black pb-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-neutral-500 font-bold">
                  OFFICIAL ASSIGNMENT REPORT
                </span>
                <h1 className="text-2xl font-bold text-black mt-1">
                  {language === 'km' && activeGroup.nameKm ? activeGroup.nameKm : activeGroup.name}
                </h1>
                <p className="text-sm font-semibold text-neutral-700 mt-1">
                  {activeGroup.courseOrProject}
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono text-xs font-bold text-black block">
                  CODE: {activeGroup.code}
                </span>
                <span className="text-xs text-neutral-500 block mt-0.5">
                  Generated: {new Date().toLocaleDateString()}
                </span>
                <span className="inline-block mt-2 text-xs font-bold px-2.5 py-0.5 rounded bg-black text-white">
                  {progressPercent}% Completed
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 mt-4 leading-relaxed">
              {activeGroup.description}
            </p>
          </div>

          {/* Group Lead & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-neutral-50 rounded border border-neutral-300 text-xs">
            <div>
              <span className="text-neutral-500 block">{language === 'km' ? 'ប្រធានក្រុម / Leader:' : 'Group Leader:'}</span>
              <span className="font-bold text-black text-sm mt-0.5 block">
                {leader?.name} {leader?.nameKm && `(${leader.nameKm})`}
              </span>
              <span className="text-neutral-500 font-mono text-[11px]">{leader?.studentId}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">{language === 'km' ? 'កាលបរិច្ឆេទបង្កើត & Deadline:' : 'Timeline & Deadline:'}</span>
              <span className="font-semibold text-black mt-0.5 block">
                {activeGroup.createdAt} → {activeGroup.deadline || 'Ongoing'}
              </span>
              <span className="text-neutral-500 text-[11px]">Category: {activeGroup.category}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">{language === 'km' ? 'ស្ថិតិសរុប:' : 'Aggregate Metrics:'}</span>
              <span className="font-semibold text-black mt-0.5 block">
                {activeGroupMembers.length} Members · {totalTasks} Tasks
              </span>
              <span className="text-neutral-700 font-bold text-[11px]">
                {approvedTasks} Approved Completions
              </span>
            </div>
          </div>

          {/* Section: Member Contributions Roster */}
          <div>
            <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-3">
              1. Team Members & Responsibilities
            </h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-black bg-neutral-100 font-bold text-black">
                  <th className="py-2.5 px-3">Member Name</th>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">Assigned Specialty</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-right">Tasks Approved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {activeGroupMembers.map(m => {
                  const mTasks = activeGroupTasks.filter(t => t.assignedTo === m.id);
                  const mApproved = mTasks.filter(t => t.status === 'approved').length;
                  return (
                    <tr key={m.id}>
                      <td className="py-2.5 px-3 font-semibold text-black">
                        {m.name} {m.nameKm && `(${m.nameKm})`}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-neutral-600">{m.studentId}</td>
                      <td className="py-2.5 px-3 text-neutral-700">{m.specialty || 'General'}</td>
                      <td className="py-2.5 px-3 capitalize text-black font-medium">
                        {m.role.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {mApproved}/{mTasks.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Section: Assigned Tasks and Sign-Offs */}
          <div>
            <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-3">
              2. Deliverables & Leader Sign-Off Status
            </h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-black bg-neutral-100 font-bold text-black">
                  <th className="py-2.5 px-3">Module & Task</th>
                  <th className="py-2.5 px-3">Assignee</th>
                  <th className="py-2.5 px-3">Deadline</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Leader Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {activeGroupTasks.map(t => {
                  const assignee = activeGroupMembers.find(m => m.id === t.assignedTo);
                  return (
                    <tr key={t.id}>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-black block">{t.title}</span>
                        <span className="text-[11px] text-neutral-500 font-mono">[{t.module}]</span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700">{assignee?.name}</td>
                      <td className="py-2.5 px-3 font-mono text-neutral-600">{t.dueDate}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.status === 'approved'
                              ? 'bg-black text-white'
                              : 'bg-neutral-200 text-black'
                          }`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700 italic">
                        {t.leaderFeedback || (t.status === 'approved' ? 'Verified by Leader' : 'Pending')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Section: Daily Standup Evidence Log */}
          <div>
            <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-3">
              3. Daily Standup Log & Progress Trail
            </h3>
            <div className="space-y-2.5">
              {activeGroupDailyLogs.slice(0, 5).map(log => {
                const author = activeGroupMembers.find(m => m.id === log.userId);
                return (
                  <div
                    key={log.id}
                    className="p-3 bg-neutral-50 rounded border border-neutral-300 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black">
                        {author?.name} · [{log.title}]
                      </span>
                      <span className="font-mono text-neutral-500 text-[11px]">
                        {log.date} at {log.timestamp} ({log.status.toUpperCase()})
                      </span>
                    </div>
                    <p className="text-neutral-800 whitespace-pre-line font-mono text-[11px] bg-white p-2 rounded border border-neutral-200">
                      {log.rawContent}
                    </p>
                    {log.leaderNote && (
                      <p className="text-black font-semibold text-[11px] pt-1">
                        ↳ Leader note: "{log.leaderNote}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signatures Footer */}
          <div className="pt-8 border-t border-neutral-400 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-12">
              <span className="text-neutral-500 block">Prepared By Group Leader:</span>
              <div className="border-t border-black pt-2 w-48">
                <span className="font-bold text-black block">{leader?.name}</span>
                <span className="text-neutral-500 text-[11px]">Team Leader / Super Admin</span>
              </div>
            </div>

            <div className="space-y-12 text-right">
              <span className="text-neutral-500 block">Supervisor Acknowledgment:</span>
              <div className="border-t border-black pt-2 w-48 ml-auto text-left">
                <span className="text-neutral-400 text-[11px] italic">Date & Signature</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
