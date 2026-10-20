import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { FolderKanban, X } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const { createGroup, t, language } = useApp();

  const [name, setName] = useState('');
  const [nameKm, setNameKm] = useState('');
  const [code, setCode] = useState('');
  const [courseOrProject, setCourseOrProject] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState<'assignment' | 'research' | 'startup' | 'other'>('assignment');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setNameKm('');
    setCode('');
    setCourseOrProject('');
    setDescription('');
    setDeadline('');
    setCategory('assignment');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !courseOrProject.trim() || submitting) return;

    setSubmitting(true);
    try {
      await createGroup({
        name: name.trim(),
        nameKm: nameKm.trim() || undefined,
        code: code.trim(), // empty = server generates one
        courseOrProject: courseOrProject.trim(),
        description: description.trim() || 'Collaborative team workspace.',
        deadline: deadline || undefined,
        category,
      });
      onClose();
    } catch {
      // Shown as a notice (e.g. duplicate group code); keep the form open.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border border-neutral-300">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">{t.createGroup}</h2>
              <p className="text-xs text-neutral-500">
                {language === 'km' ? 'បង្កើតក្រុមថ្មីដាច់ដោយឡែក និងគ្រប់គ្រងសមាជិក' : 'Create separate team workspace with independent members'}
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
              {language === 'km' ? 'ឈ្មោះក្រុម (ជាភាសាអង់គ្លេស/ទូទៅ)' : 'Group / Team Name'} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. JulNow Development Team"
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {language === 'km' ? 'ឈ្មោះជាភាសាខ្មែរ (ស្រេចចិត្ត)' : 'Khmer Group Name (Optional)'}
            </label>
            <input
              type="text"
              value={nameKm}
              onChange={e => setNameKm(e.target.value)}
              placeholder="ឧ. ក្រុមការងារ JulNow"
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                {t.groupCode}
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. GRP-JULNOW"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1">
                {language === 'km' ? 'ប្រភេទក្រុម' : 'Category'}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="assignment">School Assignment</option>
                <option value="research">Academic Research</option>
                <option value="startup">Project / Startup</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {language === 'km' ? 'មុខវិជ្ជា ឬគម្រោង (Course / Project Title)' : 'Course / Project Name'} *
            </label>
            <input
              type="text"
              required
              value={courseOrProject}
              onChange={e => setCourseOrProject(e.target.value)}
              placeholder="e.g. Web Architecture & Frontend Engineering"
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {t.taskDeadline}
            </label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {language === 'km' ? 'ការពិពណ៌នាអំពីក្រុម' : 'Description / Goal'}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Workspace for daily standups, task assignment, and progress verification."
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
              {t.createGroup}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
