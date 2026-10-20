import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black';

export const AuthScreen: React.FC = () => {
  const { login, register, t, language, setLanguage } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', nameKm: '', email: '', studentId: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(form.email.trim(), form.password);
      } else {
        await register({
          name: form.name.trim(),
          nameKm: form.nameKm.trim() || undefined,
          email: form.email.trim(),
          studentId: form.studentId.trim(),
          password: form.password,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center font-bold">LS</div>
            <div>
              <p className="font-bold text-black leading-tight">LeaderSync</p>
              <p className="text-xs text-neutral-500">{t.appSubtitle}</p>
            </div>
          </div>
          <button
            onClick={() => setLanguage(language === 'km' ? 'en' : 'km')}
            className="text-xs font-bold px-2 py-1 rounded border border-neutral-300 bg-white hover:bg-neutral-100 cursor-pointer"
          >
            {language === 'km' ? '🇬🇧 EN' : '🇰🇭 ខ្មែរ'}
          </button>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 shadow-xs p-6">
          <h1 className="text-lg font-bold text-black">{mode === 'login' ? t.authWelcome : t.signUp}</h1>
          <p className="text-xs text-neutral-500 mt-1 mb-5">
            {mode === 'login' ? t.authSubtitle : t.authInviteNote}
          </p>

          {error && (
            <div role="alert" className="mb-4 p-3 text-xs rounded-md border border-black bg-neutral-100 text-black font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-xs font-bold text-black mb-1">{t.memberName} *</span>
                    <input required value={form.name} onChange={update('name')} autoComplete="name" className={inputClass} />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-bold text-black mb-1">
                      {language === 'km' ? 'ឈ្មោះជាភាសាខ្មែរ' : 'Khmer name'}
                    </span>
                    <input value={form.nameKm} onChange={update('nameKm')} className={inputClass} />
                  </label>
                </div>
                <label className="block">
                  <span className="block text-xs font-bold text-black mb-1">{t.memberId} *</span>
                  <input
                    required
                    value={form.studentId}
                    onChange={update('studentId')}
                    placeholder="ST-2026-115"
                    className={`${inputClass} font-mono`}
                  />
                </label>
              </>
            )}

            <label className="block">
              <span className="block text-xs font-bold text-black mb-1">{t.memberEmail} *</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={update('email')}
                autoComplete="email"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="block text-xs font-bold text-black mb-1">{t.password} *</span>
              <input
                type="password"
                required
                minLength={mode === 'register' ? 8 : undefined}
                value={form.password}
                onChange={update('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={inputClass}
              />
              {mode === 'register' && <span className="text-[11px] text-neutral-500">{t.passwordHint}</span>}
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-black hover:bg-neutral-800 disabled:opacity-60 text-white text-sm font-semibold rounded-md cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'login' ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>{mode === 'login' ? t.signIn : t.signUp}</span>
            </button>
          </form>

          <p className="text-xs text-neutral-600 text-center mt-5">
            {mode === 'login' ? t.noAccount : t.haveAccount}{' '}
            <button onClick={switchMode} className="font-bold text-black hover:underline cursor-pointer">
              {mode === 'login' ? t.signUp : t.signIn}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
