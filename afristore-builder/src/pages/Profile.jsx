import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  User as UserIcon, Mail, Shield, Loader2, Check, Lock, ArrowLeft, Calendar,
} from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then((u) => { setUser(u); setName(u?.full_name || ''); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ full_name: name });
      setUser((u) => ({ ...u, full_name: name }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!user) return <div className="p-6 text-sm text-[#6D7175]">Impossible de charger le profil.</div>;

  const initials = (user.full_name || user.email || 'U').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  const memberSince = user.created_date ? new Date(user.created_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/dashboard" className="text-[#6D7175] hover:text-[#202223]"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold text-[#202223]">Profil</h1>
      </div>

      {/* Identity */}
      <div className="bg-white rounded-2xl border border-[#E1E1E1] p-6 mb-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-[#008060] flex items-center justify-center text-white text-xl font-bold shrink-0">{initials}</div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-[#202223] truncate">{user.full_name || 'Sans nom'}</p>
            <p className="text-sm text-[#6D7175] truncate flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {user.email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#6D7175] mb-1.5">Nom complet</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 border border-[#E1E1E1] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#008060]/30" placeholder="Votre nom" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6D7175] mb-1.5">Email</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F4F4F4] rounded-md text-sm text-[#6D7175]"><Mail className="w-4 h-4" /> {user.email}</div>
          </div>
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-[#00694d] disabled:opacity-40">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />} {saving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-[#E1E1E1] p-6">
        <div className="flex items-center gap-2 mb-4"><Shield className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Sécurité & accès</h2></div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-[#F4F4F4]"><span className="text-sm text-[#6D7175] flex items-center gap-2"><Shield className="w-4 h-4 opacity-60" /> Rôle</span><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${user.role === 'admin' ? 'bg-[#008060]/10 text-[#008060]' : 'bg-[#F4F4F4] text-[#6D7175]'}`}>{user.role || 'user'}</span></div>
          <div className="flex items-center justify-between py-2 border-b border-[#F4F4F4]"><span className="text-sm text-[#6D7175] flex items-center gap-2"><Calendar className="w-4 h-4 opacity-60" /> Membre depuis</span><span className="text-sm text-[#202223]">{memberSince}</span></div>
          <div className="flex items-center justify-between py-2"><span className="text-sm text-[#6D7175] flex items-center gap-2"><Lock className="w-4 h-4 opacity-60" /> Mot de passe</span><Link to="/forgot-password" className="text-sm font-medium text-[#008060] hover:underline">Changer</Link></div>
        </div>
      </div>
    </div>
  );
}