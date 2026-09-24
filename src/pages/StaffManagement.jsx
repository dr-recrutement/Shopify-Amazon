import { useState, useEffect, useCallback } from 'react';
import { UsersRound, Plus, Trash2, Loader2, Crown, User } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
// supabase-js's own error object only ever carries a generic "Edge
// Function returned a non-2xx status code" - the real message is in the
// function's own JSON error body, same pattern used everywhere else this
// session (Domains.jsx, PlatformPaymentPicker.jsx, etc).
async function functionErrorMessage(error) {
  try {
    const body = await error.context?.json?.();
    if (body?.error) return body.error;
  } catch { /* fall through to the generic message below */ }
  return error.message || 'Erreur inconnue';
}
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { getFeatureValue, getPlan } from '@/lib/plans';

export default function StaffManagement() {
  const { store } = useCurrentStore();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data, error: loadError } = await supabase.from('team_members').select('*').eq('tenant_id', store.id).order('created_at', { ascending: false });
      if (loadError) throw loadError;
      setStaff(data || []);
    } catch (e) {
      console.error('Failed to load team members:', e);
      setStaff([]);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const invite = async () => {
    if (!store?.id || !email.trim()) return;
    // Real plan enforcement (same pattern as the product limit in
    // ProductForm.jsx): each plan caps team size differently.
    const limit = getFeatureValue(store.plan, 'users');
    if (Number.isFinite(limit) && staff.length >= limit) {
      setError(`Limite atteinte : le plan ${getPlan(store.plan).name} autorise ${limit} membre(s) maximum. Passez à un plan supérieur dans Paramètres → Plan.`);
      return;
    }
    setBusy(true); setError('');
    try {
      const { data, error: inviteError } = await supabase.functions.invoke('invite-staff', { body: { tenant_id: store.id, email: email.trim(), role } });
      if (inviteError) throw new Error(await functionErrorMessage(inviteError));
      if (data.error) throw new Error(data.error);
      await load();
      setShowInvite(false);
      setEmail('');
      setRole('user');
    } catch (e) {
      setError(e.message || "Erreur lors de l'invitation");
    } finally { setBusy(false); }
  };

  const removeStaff = async (id) => {
    if (!confirm('Retirer cet employé de la boutique ?')) return;
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2"><UsersRound className="w-5 h-5 text-[#6D7175]" /><h1 className="text-xl font-bold text-[#202223]">Gestion du personnel</h1></div>
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d]"><Plus className="w-4 h-4" /> Inviter un employé</button>
      </div>

      <p className="text-sm text-[#6D7175] mb-4">Invitez des employés — un vrai e-mail d'invitation Supabase leur est envoyé pour créer leur mot de passe et se connecter à cette boutique.</p>

      {showInvite && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#202223] mb-4">Inviter un employé</h2>
            <div className="space-y-3">
              <div><label className="text-xs font-semibold text-[#6D7175]">Adresse e-mail</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="employe@boutique.com" className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" /></div>
              <div>
                <label className="text-xs font-semibold text-[#6D7175]">Rôle</label>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => setRole('admin')} className={`flex-1 text-xs font-semibold py-2 rounded-full border ${role === 'admin' ? 'bg-[#008060] text-white border-[#008060]' : 'border-[#E1E1E1] text-[#6D7175]'}`}>Administrateur</button>
                  <button onClick={() => setRole('user')} className={`flex-1 text-xs font-semibold py-2 rounded-full border ${role === 'user' ? 'bg-[#008060] text-white border-[#008060]' : 'border-[#E1E1E1] text-[#6D7175]'}`}>Employé</button>
                </div>
                <p className="text-[11px] text-[#6D7175] mt-1">Le rôle est informatif pour l'instant — les permissions détaillées par rôle ne sont pas encore appliquées.</p>
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
            <button onClick={invite} disabled={busy || !email} className="w-full mt-5 bg-[#008060] text-white text-sm font-medium py-2.5 rounded-full hover:bg-[#00694d] disabled:opacity-40">{busy ? 'Envoi…' : "Envoyer l'invitation"}</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F4F4F4] text-left text-xs text-[#6D7175]"><tr><th className="px-4 py-3 font-semibold">Membre</th><th className="px-4 py-3 font-semibold">Rôle</th><th className="px-4 py-3 font-semibold">Statut</th><th className="px-4 py-3"></th></tr></thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-t border-[#E1E1E1]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${s.role === 'admin' ? 'bg-[#008060]' : 'bg-[#6D7175]'}`}>{(s.email || '?').charAt(0).toUpperCase()}</div>
                    <p className="font-medium text-[#202223]">{s.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">{s.role === 'admin' ? <span className="flex items-center gap-1 text-xs font-semibold text-[#008060]"><Crown className="w-3.5 h-3.5" /> Administrateur</span> : <span className="flex items-center gap-1 text-xs text-[#6D7175]"><User className="w-3.5 h-3.5" /> Employé</span>}</td>
                <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-[#008060]/10 text-[#008060]' : 'bg-amber-100 text-amber-700'}`}>{s.status === 'active' ? 'Actif' : 'Invitation envoyée'}</span></td>
                <td className="px-4 py-3 text-right"><button onClick={() => removeStaff(s.id)} className="text-[#6D7175] hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
            {staff.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-[#6D7175]">Aucun membre pour le moment.</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
