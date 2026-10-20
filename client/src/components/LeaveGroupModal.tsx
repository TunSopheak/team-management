import React from 'react';
import { useApp } from '../context/AppContext';
import { LogOut, AlertCircle, X } from 'lucide-react';

interface LeaveGroupModalProps {
  groupId: string | null;
  onClose: () => void;
}

export const LeaveGroupModal: React.FC<LeaveGroupModalProps> = ({ groupId, onClose }) => {
  const { groups, currentUser, leaveGroup, t, language } = useApp();

  if (!groupId) return null;
  const targetGroup = groups.find(g => g.id === groupId);
  if (!targetGroup) return null;

  const handleLeave = async () => {
    try {
      await leaveGroup(currentUser.id, groupId);
      onClose();
    } catch {
      // Shown as a notice.
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-neutral-300">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
          <div className="flex items-center gap-2 text-black font-bold">
            <LogOut className="w-5 h-5 text-black" />
            <h2 className="text-base font-bold text-black">{t.leaveGroup}</h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-neutral-100 border border-neutral-300 rounded flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-black shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-800 leading-relaxed">
              <span className="font-bold block mb-1">
                {language === 'km' ? 'បញ្ជាក់ការចាកចេញពីក្រុម' : 'Confirm leaving team'}
              </span>
              <span>{t.leaveGroupConfirm}</span>
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded border border-neutral-200 text-xs">
            <span className="text-neutral-500 block mb-0.5">{language === 'km' ? 'ក្រុមបច្ចុប្បន្ន៖' : 'Active Group:'}</span>
            <span className="font-bold text-black text-sm">{targetGroup.name}</span>
            <span className="text-neutral-500 font-mono ml-2">({targetGroup.code})</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleLeave}
              className="px-4 py-2 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded shadow-xs cursor-pointer"
            >
              {language === 'km' ? 'ចាកចេញពីក្រុម' : 'Confirm Leave'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
