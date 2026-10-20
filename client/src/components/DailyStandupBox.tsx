import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Send, CheckCircle2, Sparkles } from 'lucide-react';

export const DailyStandupBox: React.FC = () => {
  const {
    t,
    currentUser,
    addSimpleDailyLog,
    canContribute,
    activeGroup,
    language,
  } = useApp();

  const [text, setText] = useState('');
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sampleTemplate = `JulNow - Dashboard
- update on button export report as excel
- Add button filter for report
- Update line chart analyze on dashboard - 80%`;

  // Viewers (and users without a group) cannot post standups.
  if (!canContribute || !activeGroup) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    try {
      await addSimpleDailyLog(text.trim());
      setText('');
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 3000);
    } catch {
      // Shown as a notice; keep the text so nothing is lost.
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-300 shadow-xs overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 py-3.5 bg-black text-white flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white" />
          <h2 className="text-sm font-bold tracking-tight">
            {language === 'km' ? 'កត់ត្រាកិច្ចការប្រចាំថ្ងៃ (Daily ToDo & Progress)' : 'Post Daily ToDo & Progress'}
          </h2>
          <span className="text-[11px] text-neutral-400 font-normal hidden sm:inline">
            · {language === 'km' ? 'សាមញ្ញ និងងាយស្រួល' : 'Simple & direct'}
          </span>
        </div>

        {/* User indicator & Try Example button */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setText(sampleTemplate)}
            className="px-2 py-1 bg-white text-black hover:bg-neutral-100 text-[11px] font-bold rounded transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <Sparkles className="w-3 h-3 text-black" />
            <span>{language === 'km' ? 'សាកល្បងឧទាហរណ៍ (JulNow)' : 'Load JulNow Example'}</span>
          </button>

          <span className="text-neutral-400 text-xs hidden md:inline">
            {language === 'km' ? 'ក្នុងនាម៖' : 'As:'} <strong className="text-white">{currentUser.name}</strong>
          </span>
        </div>
      </div>

      {/* Form Body */}
      <div className="p-5">
        {justSubmitted && (
          <div className="mb-4 p-3 bg-neutral-100 border border-neutral-300 rounded-md flex items-center gap-2 text-black text-xs">
            <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
            <span>
              {language === 'km'
                ? 'បានបញ្ចូល ToDo ថ្ងៃនេះដោយជោគជ័យ! ប្រធានក្រុម និងសមាជិកដទៃអាចមើលឃើញភ្លាមៗ។'
                : 'Your daily ToDo is posted! Team leader and peers can see your progress.'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              rows={4}
              required
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`JulNow - Dashboard\n- update on button export report as excel\n- Add button filter for report\n- Update line chart analyze on dashboard - 80%`}
              className="w-full px-3.5 py-3 text-sm font-mono text-black bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-colors placeholder:text-neutral-400 leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-neutral-600 flex items-center gap-1.5">
              <span className="text-[11px]">
                {language === 'km'
                  ? '💡 ព័ត៌មានជំនួយ៖ ជួរទី១ គឺឈ្មោះផ្នែក/គម្រោង បន្ទាប់មកដាក់សញ្ញា (-) សម្រាប់កិច្ចការនីមួយៗ'
                  : '💡 Tip: Line 1 is Module name, then use (-) for each task. Add % like - 80%'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400 hidden sm:inline">
                Ctrl + Enter {language === 'km' ? 'ដើម្បីផ្ញើលឿន' : 'to submit'}
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="disabled:opacity-60 inline-flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'km' ? 'ផ្សព្វផ្សាយ ToDo ថ្ងៃនេះ' : 'Post Daily ToDo'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
