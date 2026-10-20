import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { UserPlus, X, Mail, CreditCard, Briefcase } from 'lucide-react';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose }) => {
  const { addMemberToGroup, t, language, activeGroup, users } = useApp();

  const [name, setName] = useState('');
  const [nameKm, setNameKm] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [specialty, setSpecialty] = useState('');
  const [department, setDepartment] = useState('Member');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setNameKm('');
    setEmail('');
    setStudentId('');
    setRole('member');
    setSpecialty('');
    setDepartment('Member');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const existing = users.find(u => u.email.toLowerCase() === val.toLowerCase());
    if (existing) {
      setName(existing.name);
      setNameKm(existing.nameKm || '');
      setStudentId(existing.studentId);
      setRole(existing.role);
      setSpecialty(existing.specialty || '');
    }
  };

  const handleIdChange = (val: string) => {
    setStudentId(val);
    const existing = users.find(u => u.studentId.toLowerCase() === val.toLowerCase());
    if (existing) {
      setName(existing.name);
      setNameKm(existing.nameKm || '');
      setEmail(existing.email);
      setRole(existing.role);
      setSpecialty(existing.specialty || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !studentId.trim() || submitting) return;

    setSubmitting(true);
    try {
      await addMemberToGroup({
        name: name.trim(),
        nameKm: nameKm.trim() || undefined,
        email: email.trim(),
        studentId: studentId.trim(),
        role,
        specialty: specialty.trim() || 'Team Contributor',
        department,
        groupId: activeGroup?.id,
      });
      onClose();
    } catch {
      // Shown as a notice; keep the form open.
    } finally {
      setSubmitting(false);
    }
  };

  const quickRoles: { role: Role; label: string; desc: string }[] = [
    { role: 'member', label: t.memberBadge, desc: 'Can submit daily standups and complete assigned tasks' },
    { role: 'team_lead', label: t.teamLeadBadge, desc: 'Can assign tasks and verify/approve member deliverables' },
    { role: 'super_admin', label: t.superAdminBadge, desc: 'Full system control: add/remove members, create/delete groups' },
    { role: 'viewer', label: t.viewerBadge, desc: 'Read-only audit view for supervisor or observer' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border border-neutral-300">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">{t.addMember}</h2>
              <p className="text-xs text-neutral-500">
                {t.addMemberByEmailOrId}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                <span>{t.memberEmail} *</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => handleEmailChange(e.target.value)}
                placeholder="sok.student@edu.kh"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                <span>{t.memberId} *</span>
              </label>
              <input
                type="text"
                required
                value={studentId}
                onChange={e => handleIdChange(e.target.value)}
                placeholder="e.g. ST-2026-115"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                {t.memberName} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sovann Vichea"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1">
                {language === 'km' ? 'ឈ្មោះជាភាសាខ្មែរ' : 'Khmer Name'}
              </label>
              <input
                type="text"
                value={nameKm}
                onChange={e => setNameKm(e.target.value)}
                placeholder="ឧ. សុវណ្ណ វិជ្ជា"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              {t.memberRole} *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {quickRoles.map(item => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => setRole(item.role)}
                  className={`p-2.5 text-left rounded border text-xs transition-all cursor-pointer ${
                    role === item.role
                      ? 'border-black bg-black text-white font-semibold'
                      : 'border-neutral-300 bg-white hover:bg-neutral-50 text-black'
                  }`}
                >
                  <div className="font-bold">{item.label}</div>
                  <div className={`text-[10px] mt-0.5 line-clamp-1 ${role === item.role ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
              <span>{t.memberSpecialty}</span>
            </label>
            <input
              type="text"
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              placeholder="e.g. Frontend UI & Dashboard, Backend API"
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
              {t.btnSaveMember}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
