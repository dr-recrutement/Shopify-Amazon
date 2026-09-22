import { useState, useEffect, useCallback, useMemo } from 'react';
import { Store, Loader2, Search, ShieldCheck, X } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

export default function MarketplaceModeration() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [noteFor, setNoteFor] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('tenants').select('*').order('created_at', { ascending: false }).limit(1000);
    setTenants(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => tenants.filter((t) => {
    const m = !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.slug?.toLowerCase().includes(search.toLowerCase());
    const f = filter === 'all' || (filter === 'verified' ? t.is_verified : !t.is_verified);
    return m && f;
  }), [tenants, search, filter]);

  const setVerified = async (t, verified, verificationNote) => {
    setBusy(t.id);
    try {
      const { error } = await supabase.from('tenants').update({ is_verified: verified, verification_note: verificationNote || null }).eq('id', t.id);
      if (error) throw error;
      await supabase.from('platform_audit_log').insert({
        admin_id: user.id, admin_email: user.email,
        action: verified ? 'store_verified' : 'store_unverified',
        target_type: 'boutique', target_id: t.id,
        old_value: { is_verified: t.is_verified }, new_value: { is_verified: verified },
        note: verificationNote || null,
      });
      setTenants((l) => l.map((x) => (x.id === t.id ? { ...x, is_verified: verified, verification_note: verificationNote || null } : x)));
      setNoteFor(null);
      setNote('');
    } catch (e) {
      alert(e.message || "Échec de l'action");
    } finally { setBusy(null); }
  };

  const verifiedCount = tenants.filter((t) => t.is_verified).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2"><Store className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Modération marketplace</h2><span className="text-xs text-[#6D7175]">({filtered.length})</span></div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 border border-[#E1E1E1] rounded-lg px-2.5 py-1.5 bg-white"><Search className="w-3.5 h-3.5 text-[#6D7175]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="text-xs outline-none w-40" /></div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="text-xs border border-[#E1E1E1] rounded-lg px-2 py-1.5 bg-white"><option value="all">Toutes</option><option value="verified">Vérifiées</option><option value="unverified">Non vérifiées</option></select>
        </div>
      </div>
      <p className="text-xs text-[#6D7175] mb-4">{verifiedCount} boutique(s) vérifiée(s) sur {tenants.length}. Le badge « Vérifié » est un signal de confiance affiché aux visiteurs — il ne bloque jamais l'activité d'une boutique.</p>

      <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
        {loading ? <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-[#008060] mx-auto" /></div> : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#6D7175]">Aucune boutique.</p>
        ) : (
          <div className="divide-y divide-[#E1E1E1]">
            {filtered.map((t) => (
              <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#202223] truncate">{t.name}</p>
                    {t.is_verified ? <span className="flex items-center gap-1 text-[10px] font-bold text-[#008060] bg-[#008060]/10 px-1.5 py-0.5 rounded-full"><ShieldCheck className="w-3 h-3" /> Vérifié</span> : <span className="text-[10px] font-bold text-[#6D7175] bg-[#F4F4F4] px-1.5 py-0.5 rounded-full">Non vérifié</span>}
                  </div>
                  <p className="text-[11px] text-[#6D7175] mt-0.5">{t.slug} · {t.country || '—'}</p>
                  {t.verification_note && <p className="text-[11px] text-[#6D7175] italic mt-0.5">« {t.verification_note} »</p>}
                </div>
                <div className="shrink-0">
                  {t.is_verified ? (
                    <button onClick={() => setVerified(t, false)} disabled={busy === t.id} className="text-xs font-semibold text-[#6D7175] border border-[#E1E1E1] rounded-full px-3 py-1.5 hover:bg-black/5 disabled:opacity-40">Retirer la vérification</button>
                  ) : (
                    <button onClick={() => setNoteFor(t)} disabled={busy === t.id} className="flex items-center gap-1 text-xs font-semibold text-[#008060] border border-[#008060]/30 rounded-full px-3 py-1.5 hover:bg-[#008060]/5 disabled:opacity-40"><ShieldCheck className="w-3.5 h-3.5" /> Vérifier</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {noteFor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setNoteFor(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3"><p className="text-sm font-bold text-[#202223]">Vérifier {noteFor.name}</p><button onClick={() => setNoteFor(null)} className="text-[#6D7175]"><X className="w-4 h-4" /></button></div>
            <label className="text-xs font-semibold text-[#6D7175]">Note (optionnelle, journalisée)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full mt-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" placeholder="Ex : identité et coordonnées vérifiées manuellement" />
            <button onClick={() => setVerified(noteFor, true, note)} disabled={busy === noteFor.id} className="w-full mt-3 flex items-center justify-center gap-1.5 bg-[#008060] text-white text-sm font-semibold rounded-full py-2.5 hover:bg-[#00694d] disabled:opacity-40">{busy === noteFor.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Confirmer la vérification</button>
          </div>
        </div>
      )}
    </div>
  );
}
