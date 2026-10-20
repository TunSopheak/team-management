import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

/** Toast for API errors and confirmations. */
export const Notice: React.FC = () => {
  const { notice, dismissNotice } = useApp();
  if (!notice) return null;

  const isError = notice.type === 'error';
  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] sm:max-w-sm print:hidden" role={isError ? 'alert' : 'status'}>
      <div
        className={`flex items-start gap-2.5 p-3 rounded-lg shadow-2xl border text-xs ${
          isError ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-300'
        }`}
      >
        {isError ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
        <span className="flex-1 font-medium leading-relaxed">{notice.message}</span>
        <button onClick={dismissNotice} className="opacity-70 hover:opacity-100 cursor-pointer" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
