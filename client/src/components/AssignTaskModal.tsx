import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { TaskPriority } from '../types';
import { addDays } from '../lib/dates';
import { Plus, X } from 'lucide-react';

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({ isOpen, onClose }) => {
  const { assignTask, activeGroupMembers, t, language } = useApp();

  const [title, setTitle] = useState('');
  const [module, setModule] = useState('General');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState(() => addDays(5));
  const [dueTime, setDueTime] = useState('18:00');
  const [submitting, setSubmitting] = useState(false);

  // Reset the form each time it opens (members differ between groups).
  useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate(addDays(5));
    setDueTime('18:00');
    setAssignedTo(activeGroupMembers[0]?.id || '');
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedTo || submitting) return;

    setSubmitting(true);
    try {
      await assignTask({
        title: title.trim(),
        module: module.trim() || 'General',
        description: description.trim() || 'Deliver specified module requirements.',
        assignedTo,
        priority,
        dueDate,
        dueTime,
      });
      onClose();
    } catch {
      // The error is shown as a notice; keep the form open so nothing is lost.
    } finally {
      setSubmitting(false);
    }
  };

  const sampleModules = ['JulNow - Dashboard', 'Backend API', 'Database', 'Documentation & Slide', 'QA Testing'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border border-neutral-300">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">{t.assignNewTask}</h2>
              <p className="text-xs text-neutral-500">
                {language === 'km' ? 'កំណត់កិច្ចការ និងកាលបរិច្ឆេទដល់សមាជិកក្រុម' : 'Define deliverable and deadline for a member'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {t.taskTitle} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t.taskTitlePlaceholder}
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {t.taskModule} *
            </label>
            <input
              type="text"
              required
              value={module}
              onChange={e => setModule(e.target.value)}
              placeholder="e.g. JulNow - Dashboard"
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {sampleModules.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModule(m)}
                  className="text-[10px] bg-neutral-100 hover:bg-neutral-200 text-black px-2 py-0.5 rounded border border-neutral-200 cursor-pointer"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                {t.taskAssignTo} *
              </label>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
              >
                {activeGroupMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.studentId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1">
                {t.taskPriority}
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="low">{t.taskPriorityLow}</option>
                <option value="medium">{t.taskPriorityMedium}</option>
                <option value="high">{t.taskPriorityHigh}</option>
                <option value="urgent">{t.taskPriorityUrgent}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                {t.taskDeadline} *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1">
                {t.taskTime}
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {t.taskDescription}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Specific instructions or requirements..."
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-black hover:bg-neutral-800 disabled:opacity-60 rounded shadow-xs"
            >
              {t.btnAssign}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
