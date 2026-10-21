import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, X, KeyRound, Loader2 } from 'lucide-react';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({ isOpen, onClose }) => {
  const { joinGroup, language } = useApp();
  const [codeOrId, setCodeOrId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = codeOrId.trim();
    if (!trimmed || submitting) return;

    setError('');
    setSubmitting(true);
    try {
      await joinGroup(trimmed);
      setCodeOrId('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isKm = language === 'km';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-neutral-300">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">
                {isKm ? 'ចូលរួមក្រុម (Join Group)' : 'Join Group'}
              </h2>
              <p className="text-xs text-neutral-500">
                {isKm ? 'ចូលរួមតាមរយៈលេខកូដក្រុម ឬ Group ID' : 'Join via Group Code or Group ID'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black p-1 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 text-xs rounded-md border border-black bg-neutral-100 text-black font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-black mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-neutral-500" />
              <span>{isKm ? 'លេខកូដក្រុម ឬ Group ID *' : 'Group Code or Group ID *'}</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={codeOrId}
              onChange={e => setCodeOrId(e.target.value)}
              placeholder={isKm ? 'ឧទាហរណ៍៖ GRP-101 ឬ Group UUID...' : 'e.g. GRP-101 or Group UUID...'}
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black font-mono uppercase placeholder:normal-case placeholder:font-sans"
            />
            <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
              {isKm
                ? 'សួរប្រធានក្រុមរបស់អ្នកដើម្បីទទួលបានលេខកូដក្រុម (Group Code) ឬ Group ID។'
                : 'Ask your team leader for the Group Code or Group ID to join directly.'}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded cursor-pointer"
            >
              {isKm ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting || !codeOrId.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-black hover:bg-neutral-800 disabled:opacity-60 rounded shadow-xs cursor-pointer"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isKm ? 'ចូលរួមក្រុមឥឡូវនេះ' : 'Join Group Now'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
