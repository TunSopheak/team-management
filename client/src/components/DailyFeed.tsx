import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTime } from '../lib/dates';
import {
  CheckCircle2,
  Clock,
  CheckSquare,
  Square,
  Award,
  Send,
  Trash2,
  Calendar,
  Layers,
  Search,
  Check
} from 'lucide-react';

export const DailyFeed: React.FC = () => {
  const {
    activeGroupDailyLogs,
    users,
    currentUser,
    isTeamLead,
    canContribute,
    toggleDailyTodoItem,
    markDailyLogDone,
    approveDailyLog,
    deleteDailyLog,
    addReactionToDailyLog,
    t,
    language,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'in_progress' | 'completed' | 'approved'>('all');
  const [activeLeaderNoteId, setActiveLeaderNoteId] = useState<string | null>(null);
  const [leaderFeedbackText, setLeaderFeedbackText] = useState<{ [id: string]: string }>({});

  const filteredLogs = activeGroupDailyLogs.filter(log => {
    if (filterMode !== 'all' && log.status !== filterMode) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const author = users.find(u => u.id === log.userId);
      const fullText =
        (author?.name.toLowerCase() || '') +
        log.title.toLowerCase() +
        log.rawContent.toLowerCase();
      if (!fullText.includes(q)) return false;
    }
    return true;
  });

  const availableEmojis = ['👏', '🔥', '👍', '🚀', '💡'];

  const handleApproveWithNote = (logId: string) => {
    const note = leaderFeedbackText[logId]?.trim();
    approveDailyLog(logId, note || 'Approved by Group Leader');
    setActiveLeaderNoteId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header filter & search */}
      <div className="bg-white p-4 rounded-lg border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-black text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            {t.all} ({activeGroupDailyLogs.length})
          </button>
          <button
            onClick={() => setFilterMode('in_progress')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              filterMode === 'in_progress'
                ? 'bg-black text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            {language === 'km' ? 'កំពុងធ្វើ' : 'In Progress'}
          </button>
          <button
            onClick={() => setFilterMode('completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              filterMode === 'completed'
                ? 'bg-black text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            {language === 'km' ? 'បានសម្រេច (រង់ចាំពិនិត្យ)' : 'Done (Pending Leader)'}
          </button>
          <button
            onClick={() => setFilterMode('approved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              filterMode === 'approved'
                ? 'bg-black text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
            }`}
          >
            {language === 'km' ? 'បានអនុម័ត' : 'Approved'}
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.search}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      {/* Feed List */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <Clock className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-black">{t.noDailyLogsFound}</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            {language === 'km'
              ? 'សូមប្រើប្រាស់ប្រអប់ខាងលើដើម្បីបញ្ចូល ToDo ប្រចាំថ្ងៃរបស់អ្នក'
              : 'Use the simple textbox above to post your daily tasks.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map(log => {
            const author = users.find(u => u.id === log.userId) || {
              id: log.userId,
              name: 'Member',
              email: '',
              studentId: '',
              role: 'member',
            };

            const isAuthor = log.userId === currentUser.id;
            const canEditChecklist = (isAuthor && canContribute) || isTeamLead;
            const completedItemsCount = log.items.filter(i => i.done).length;
            const totalItemsCount = log.items.length;
            const calcPercent = totalItemsCount > 0
              ? Math.round((completedItemsCount / totalItemsCount) * 100)
              : log.overallDone ? 100 : 50;

            return (
              <div
                key={log.id}
                className="bg-white rounded-lg border border-neutral-200 p-5 transition-all hover:border-neutral-400 shadow-xs"
              >
                {/* Header: Author + Module Title + Timestamp + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-neutral-100 border border-neutral-300 flex items-center justify-center font-bold text-black text-xs shrink-0">
                      {author.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-black">
                          {author.name}
                        </span>
                        {author.nameKm && (
                          <span className="text-xs text-neutral-500 hidden sm:inline">
                            ({author.nameKm})
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-neutral-500">
                          ID: {author.studentId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                        <span className="font-semibold text-black bg-neutral-100 px-2 py-0.2 rounded border border-neutral-200">
                          {log.title}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-mono text-neutral-500">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          <span>{formatDateTime(log.timestamp)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Delete button */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {log.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-black px-2.5 py-0.5 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>{language === 'km' ? 'បានអនុម័តជោគជ័យ' : 'Approved & Verified'}</span>
                      </span>
                    )}
                    {log.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-black bg-neutral-200 px-2.5 py-0.5 rounded border border-neutral-300">
                        <Clock className="w-3.5 h-3.5 text-black" />
                        <span>{language === 'km' ? 'បានសម្រេច (រង់ចាំ Leader ពិនិត្យ)' : 'Done (Pending Review)'}</span>
                      </span>
                    )}
                    {log.status === 'in_progress' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-800 bg-neutral-100 border border-neutral-300 px-2.5 py-0.5 rounded">
                        <span>{language === 'km' ? 'កំពុងដំណើរការ' : 'In Progress'}</span>
                        <span className="font-mono font-bold">({calcPercent}%)</span>
                      </span>
                    )}

                    {(isAuthor || isTeamLead) && (
                      <button
                        onClick={() => {
                          if (confirm(language === 'km' ? 'លុបរបាយការណ៍ប្រចាំថ្ងៃនេះ?' : 'Delete this daily update?')) {
                            deleteDailyLog(log.id);
                          }
                        }}
                        className="text-neutral-400 hover:text-black p-1 rounded transition-colors cursor-pointer"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Parsed Checklist / Bullet Items */}
                <div className="py-4 space-y-1.5">
                  {log.items.length > 0 ? (
                    <div className="space-y-1.5">
                      {log.items.map(item => (
                        <div
                          key={item.id}
                          onClick={() => canEditChecklist && toggleDailyTodoItem(log.id, item.id)}
                          className={`flex items-start gap-2.5 p-2 rounded-md transition-colors text-xs ${
                            canEditChecklist ? 'cursor-pointer' : 'cursor-default'
                          } ${
                            item.done
                              ? 'bg-neutral-50 text-neutral-400 line-through'
                              : 'hover:bg-neutral-50 text-black'
                          }`}
                        >
                          <div className="mt-0.5 text-black shrink-0">
                            {item.done ? (
                              <CheckSquare className="w-4 h-4 text-black" />
                            ) : (
                              <Square className="w-4 h-4 text-neutral-400" />
                            )}
                          </div>
                          <div className="flex-1 flex items-center justify-between gap-2">
                            <span className="font-medium text-sm leading-snug">
                              {item.text}
                            </span>
                            {item.progressTag && (
                              <span
                                className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                  item.done
                                    ? 'bg-neutral-200 text-neutral-800'
                                    : 'bg-black text-white'
                                }`}
                              >
                                {item.progressTag}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-black whitespace-pre-line leading-relaxed bg-neutral-50 p-3 rounded-md border border-neutral-200 font-mono">
                      {log.rawContent}
                    </p>
                  )}
                </div>

                {/* Leader Note / Praise */}
                {log.leaderChecked && log.leaderNote && (
                  <div className="p-3 mb-3 bg-neutral-50 border border-neutral-300 rounded-md text-xs flex items-start gap-2.5 text-black">
                    <Award className="w-4 h-4 text-black shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold text-black mb-0.5">
                        {language === 'km' ? 'មតិបញ្ជាក់ពីប្រធានក្រុម (Leader Feedback):' : 'Leader Feedback:'}
                      </div>
                      <p className="font-medium text-neutral-700">"{log.leaderNote}"</p>
                    </div>
                  </div>
                )}

                {/* Inline Leader Approve form */}
                {isTeamLead && log.status !== 'approved' && (
                  <div className="mb-3">
                    {activeLeaderNoteId === log.id ? (
                      <div className="p-3 bg-neutral-50 border border-neutral-300 rounded-md space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-black">
                          <span>{language === 'km' ? 'បញ្ជាក់ការអនុម័ត និងផ្តល់មតិកែលម្អ' : 'Sign off & Provide Feedback'}</span>
                          <button
                            onClick={() => setActiveLeaderNoteId(null)}
                            className="text-neutral-500 hover:text-black text-xs"
                          >
                            {t.cancel}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={leaderFeedbackText[log.id] || ''}
                            onChange={e =>
                              setLeaderFeedbackText(prev => ({ ...prev, [log.id]: e.target.value }))
                            }
                            placeholder={language === 'km' ? 'ឧ. ធ្វើបានល្អណាស់! ត្រឹមត្រូវតាម requirement' : 'e.g. Great progress, clean code!'}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                          />
                          <button
                            type="button"
                            onClick={() => handleApproveWithNote(log.id)}
                            className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{language === 'km' ? 'អនុម័ត' : 'Approve'}</span>
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Bottom Row: Completion Buttons & Reactions */}
                <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Left: Action buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Member button: Mark Done */}
                    {log.status === 'in_progress' && canEditChecklist && (
                      <button
                        onClick={() => markDailyLogDone(log.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-black border border-neutral-300 rounded-md font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.btnMarkDone}</span>
                      </button>
                    )}

                    {/* Leader button: Approve & Verify */}
                    {isTeamLead && log.status !== 'approved' && activeLeaderNoteId !== log.id && (
                      <button
                        onClick={() => setActiveLeaderNoteId(log.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-md font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{t.btnApproveTask}</span>
                      </button>
                    )}
                  </div>

                  {/* Right: Emoji reactions */}
                  <div className="flex items-center gap-1.5">
                    {log.reactions.map(r => {
                      const userHasReacted = r.userIds.includes(currentUser.id);
                      return (
                        <button
                          key={r.emoji}
                          onClick={() => addReactionToDailyLog(log.id, r.emoji)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors cursor-pointer ${
                            userHasReacted
                              ? 'bg-black border-black text-white'
                              : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          <span>{r.emoji}</span>
                          <span className="font-mono text-[10px]">{r.count}</span>
                        </button>
                      );
                    })}

                    <div className="flex items-center gap-0.5 pl-1">
                      {availableEmojis.map(emoji => {
                        if (log.reactions.some(r => r.emoji === emoji)) return null;
                        return (
                          <button
                            key={emoji}
                            onClick={() => addReactionToDailyLog(log.id, emoji)}
                            className="p-1 text-neutral-400 hover:text-black hover:scale-125 transition-all text-xs cursor-pointer"
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
