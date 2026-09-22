import { useState, useEffect, useCallback, useMemo } from 'react';
import { ShieldAlert, Loader2, Search } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

const ACTION_LABELS = {
  plan_change: 'Changement de plan', status_change: 'Changement de statut', extend: 'Prolongation', reduce: 'Réduction',
  suspend: 'Suspension', reactivate: 'Réactivation', trial_set: 'Essai personnalisé', bonus_days: 'Jours offerts',
  discount_applied: 'Remise appliquée', credit_applied: 'Crédit appliqué', billing_cycle_change: 'Cycle de facturation',
};

export default function AuditLogViewer() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tenants, setTenants] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    const [subLog, platLog, t] = await Promise.all([
      supabase.from('subscription_audit_log').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('platform_audit_log').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('tenants').select('id, name'),
    ]);
    const merged = [
      ...(subLog.data || []).map((r) => ({ ...r, source: 'subscription', target_type: 'boutique', target_id: r.tenant_id })),
      ...(platLog.data || []).map((r) => ({ ...r, source: 'platform' })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setEntries(merged);
    setTenants(Object.fromEntries((t.data || []).map((x) => [x.id, x.name])));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => entries.filter((e) => !search
    || e.admin_email?.toLowerCase().includes(search.toLowerCase())
    || (ACTION_LABELS[e.action] || e.action)?.toLowerCase().includes(search.toLowerCase())
    || (tenants[e.target_id] || '').toLowerCase().includes(search.toLowerCase())
  ), [entries, tenants, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Journal d'audit</h2><span className="text-xs text-[#6D7175]">({filtered.length})</span></div>
        <div className="flex items-center gap-1.5 border border-[#E1E1E1] rounded-lg px-2.5 py-1.5 bg-white"><Search className="w-3.5 h-3.5 text-[#6D7175]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Admin, action, boutique…" className="text-xs outline-none w-48" /></div>
      </div>
      <p className="text-xs text-[#6D7175] mb-4">Chaque action sensible d'un super admin — qui, quand, quoi, avant/après — est enregistrée ici et ne peut pas être modifiée a posteriori.</p>

      <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
        {loading ? <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-[#008060] mx-auto" /></div> : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#6D7175]">Aucune entrée pour l'instant.</p>
        ) : (
          <div className="divide-y divide-[#E1E1E1] max-h-[60vh] overflow-y-auto">
            {filtered.map((e) => (
              <div key={`${e.source}-${e.id}`} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm font-semibold text-[#202223]">{ACTION_LABELS[e.action] || e.action}</p>
                  <p className="text-[11px] text-[#6D7175]">{new Date(e.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <p className="text-xs text-[#6D7175] mt-0.5">
                  {e.admin_email}
                  {e.target_id && tenants[e.target_id] && <> · {tenants[e.target_id]}</>}
                  {e.target_type && !tenants[e.target_id] && <> · {e.target_type}</>}
                </p>
                {e.note && <p className="text-xs text-[#6D7175] italic mt-0.5">« {e.note} »</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
