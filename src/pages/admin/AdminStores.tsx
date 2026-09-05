import { PageHeader, Card, Badge, Button, Table } from '../dashboard/ui';
import { Search, Eye, Clock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { GLOBAL_COUNTRIES, PLANS } from '../../lib/constants';

type TenantRow = { id: string; name: string; plan: string; status: string; country: string; created_at: string; slug: string | null; plan_renews_at: string | null };
type ExtendMode = 'days' | 'months' | 'years' | 'custom_date';

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatRenewsAt(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const inPast = d.getTime() < Date.now();
  const label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return inPast ? `${label} (expiré)` : label;
}

/** Extension modal: days/months/years relative to remaining time, or an
 *  absolute custom end date. Calls /api/admin/extend-subscription, which
 *  re-checks super-admin status server-side and writes plan_renews_at with
 *  the service role — the same field a real Flutterwave renewal sets, so
 *  the change is immediately effective everywhere that field is read
 *  (merchant dashboard, plan-access checks). */
function ExtendSubscriptionModal({ tenant, onClose, onExtended }: { tenant: TenantRow; onClose: () => void; onExtended: (tenantId: string, planRenewsAt: string, plan: string) => void }) {
  const [mode, setMode] = useState<ExtendMode>('months');
  const [amount, setAmount] = useState(1);
  const [customDate, setCustomDate] = useState('');
  const [plan, setPlan] = useState(tenant.plan);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (mode === 'custom_date' && !customDate) { setError('Choisissez une date.'); return; }
    if (mode !== 'custom_date' && (!amount || amount <= 0)) { setError('Entrez une valeur positive.'); return; }
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const res = await fetch('/api/admin/extend-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          tenantId: tenant.id,
          mode,
          amount: mode !== 'custom_date' ? amount : undefined,
          customDate: mode === 'custom_date' ? customDate : undefined,
          plan: plan !== tenant.plan ? plan : undefined,
          reason: reason || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.error || "Erreur lors de l'extension."); setSaving(false); return; }
      onExtended(tenant.id, result.planRenewsAt, result.plan);
      onClose();
    } catch {
      setError('Erreur réseau.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-900">Étendre l'abonnement</h3>
        <p className="text-xs text-gray-500 mt-1">{tenant.name} — actuellement : {formatRenewsAt(tenant.plan_renews_at)}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {([
            ['days', 'Jours'], ['months', 'Mois'], ['years', 'Années'], ['custom_date', 'Date précise'],
          ] as [ExtendMode, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`py-2 text-xs font-bold rounded-lg border transition-all ${mode === m ? 'bg-brand-600 text-white border-brand-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'custom_date' ? (
          <div className="mt-4">
            <label className="block text-xs font-bold text-gray-600 mb-1">Nouvelle date de fin d'abonnement</label>
            <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        ) : (
          <div className="mt-4">
            <label className="block text-xs font-bold text-gray-600 mb-1">Ajouter</label>
            <input type="number" min={1} value={amount} onChange={e => setAmount(parseInt(e.target.value, 10) || 0)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <p className="text-[10px] text-gray-400 mt-1">S'ajoute au temps restant si l'abonnement est encore actif — ne l'écrase pas.</p>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-600 mb-1">Plan (optionnel)</label>
          <select value={plan} onChange={e => setPlan(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            {PLANS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-600 mb-1">Motif (optionnel, journalisé)</label>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: geste commercial, incident technique…" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>

        {error && <p className="mt-3 text-xs text-red-600 font-medium">{error}</p>}

        <div className="mt-6 flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" onClick={submit} disabled={saving}>{saving ? 'Enregistrement…' : "Confirmer l'extension"}</Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminStores() {
  const [q, setQ] = useState('');
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [extendingTenant, setExtendingTenant] = useState<TenantRow | null>(null);

  useEffect(() => {
    supabase.from('tenants').select('id,name,plan,status,country,created_at,slug,plan_renews_at').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setTenants(data as TenantRow[]);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return tenants;
    const needle = q.toLowerCase();
    return tenants.filter(t => t.name.toLowerCase().includes(needle));
  }, [tenants, q]);

  const active = tenants.filter(t => t.status === 'active').length;
  const trial = tenants.filter(t => t.status === 'trial').length;
  const suspended = tenants.filter(t => t.status === 'suspended').length;

  const exportCsv = () => downloadCsv('boutiques.csv', [
    ['Nom', 'Plan', 'Statut', 'Pays', 'Créée le', 'Fin abonnement'],
    ...filtered.map(t => [t.name, t.plan, t.status, t.country, t.created_at, t.plan_renews_at || '']),
  ]);

  const handleExtended = (tenantId: string, planRenewsAt: string, plan: string) => {
    // Effective immédiatement dans cette console — pas besoin de recharger
    // la page pour voir le nouveau statut/date.
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, plan_renews_at: planRenewsAt, plan, status: 'active' } : t));
  };

  return (
    <div>
      <PageHeader title="Boutiques" subtitle="Toutes les boutiques réelles de la plateforme." action={<Button onClick={exportCsv}>Exporter</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">Total</p><p className="text-2xl font-bold">{loading ? '…' : tenants.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">Actives</p><p className="text-2xl font-bold text-green-600">{loading ? '…' : active}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">En essai</p><p className="text-2xl font-bold text-brand-600">{loading ? '…' : trial}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">Suspendues</p><p className="text-2xl font-bold text-red-600">{loading ? '…' : suspended}</p></Card>
      </div>
      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="flex-1 relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher une boutique..." className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none" />
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 text-center">{tenants.length === 0 ? 'Aucune boutique inscrite pour l\'instant.' : 'Aucun résultat pour cette recherche.'}</p>
        ) : (
          <Table headers={['Boutique', 'Plan', 'Pays', 'Créée le', 'Statut', 'Fin abonnement', '']}>
            {filtered.map(s => {
              const c = GLOBAL_COUNTRIES.find(g => g.code === s.country);
              return (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
                  <td className="py-3 px-4"><Badge color={s.plan === 'enterprise' ? 'gray' : s.plan === 'premium' ? 'brand' : 'blue'}>{s.plan}</Badge></td>
                  <td className="py-3 px-4 text-gray-500">{c ? `${c.flag} ${c.code}` : s.country || '—'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4"><Badge color={s.status === 'active' ? 'green' : s.status === 'trial' ? 'brand' : 'red'}>{s.status === 'active' ? 'Active' : s.status === 'trial' ? 'Essai' : 'Suspendue'}</Badge></td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{formatRenewsAt(s.plan_renews_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {s.slug ? (
                        <a href={`/s/${s.slug}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline text-sm flex items-center gap-1"><Eye size={14} /> Voir</a>
                      ) : (
                        <span className="text-gray-300 text-sm flex items-center gap-1" title="Pas encore de slug public"><Eye size={14} /> —</span>
                      )}
                      <button onClick={() => setExtendingTenant(s)} className="text-gray-500 hover:text-brand-600 text-sm flex items-center gap-1" title="Étendre l'abonnement">
                        <Clock size={14} /> Étendre
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      {extendingTenant && (
        <ExtendSubscriptionModal tenant={extendingTenant} onClose={() => setExtendingTenant(null)} onExtended={handleExtended} />
      )}
    </div>
  );
}
