import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CreditCard, Search, Loader2, Clock, Ban, CheckCircle2, X, History,
  Calendar, Gift, Percent, Wallet, ArrowUpDown, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { formatMoney } from '@/lib/world/currencies';

const PLANS = ['starter', 'growth', 'pro', 'enterprise'];
const PLAN_LABELS = { starter: 'Starter', growth: 'Growth', pro: 'Pro', enterprise: 'Enterprise' };
const STATUSES = ['trial', 'active', 'suspended'];
const STATUS_STYLE = {
  trial: 'bg-amber-500/10 text-amber-600', active: 'bg-[#008060]/10 text-[#008060]', suspended: 'bg-red-500/10 text-red-600',
};
const ACTION_LABELS = {
  plan_change: 'Changement de plan', status_change: 'Changement de statut', extend: 'Prolongation', reduce: 'Réduction',
  suspend: 'Suspension', reactivate: 'Réactivation', trial_set: 'Essai personnalisé', bonus_days: 'Jours offerts',
  discount_applied: 'Remise appliquée', credit_applied: 'Crédit appliqué', billing_cycle_change: 'Cycle de facturation',
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const daysLeft = (d) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null);

export default function SubscriptionManager() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [detail, setDetail] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false }).limit(1000);
    if (error) { console.error('Failed to load tenants:', error); setTenants([]); }
    else setTenants(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => tenants.filter((t) => {
    const m = !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.slug?.toLowerCase().includes(search.toLowerCase());
    const p = planFilter === 'all' || t.plan === planFilter;
    const s = statusFilter === 'all' || t.status === statusFilter;
    return m && p && s;
  }), [tenants, search, planFilter, statusFilter]);

  const toggleSelect = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => setSelected((s) => (s.size === filtered.length ? new Set() : new Set(filtered.map((t) => t.id))));

  const runAction = async (tenantId, action, params, note) => {
    const { error } = await supabase.rpc('super_admin_update_subscription', {
      p_tenant_id: tenantId, p_action: action, p_note: note || null, ...params,
    });
    if (error) throw error;
  };

  const bulkAction = async (action, params, note) => {
    if (selected.size === 0) return;
    if (!confirm(`Appliquer « ${ACTION_LABELS[action] || action} » à ${selected.size} boutique(s) ?`)) return;
    setBulkBusy(true);
    try {
      for (const id of selected) {
        await runAction(id, action, params, note);
      }
      setSelected(new Set());
      await load();
    } catch (e) {
      alert(e.message || "Échec de l'action groupée");
    } finally { setBulkBusy(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Gestion des abonnements</h2><span className="text-xs text-[#6D7175]">({filtered.length})</span></div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 border border-[#E1E1E1] rounded-lg px-2.5 py-1.5 bg-white"><Search className="w-3.5 h-3.5 text-[#6D7175]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une boutique…" className="text-xs outline-none w-40" /></div>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="text-xs border border-[#E1E1E1] rounded-lg px-2 py-1.5 bg-white"><option value="all">Tous les plans</option>{PLANS.map((p) => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}</select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs border border-[#E1E1E1] rounded-lg px-2 py-1.5 bg-white"><option value="all">Tous les statuts</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap bg-[#008060]/5 border border-[#008060]/20 rounded-lg px-3 py-2 mb-3">
          <span className="text-xs font-semibold text-[#008060]">{selected.size} sélectionnée(s)</span>
          <button disabled={bulkBusy} onClick={() => bulkAction('suspend', { p_status: 'suspended', p_suspended_reason: 'Action groupée' }, 'Suspension en masse')} className="text-xs font-semibold text-red-600 border border-red-200 rounded-full px-2.5 py-1 hover:bg-red-50 disabled:opacity-40">Suspendre</button>
          <button disabled={bulkBusy} onClick={() => bulkAction('reactivate', { p_status: 'active' }, 'Réactivation en masse')} className="text-xs font-semibold text-[#008060] border border-[#008060]/30 rounded-full px-2.5 py-1 hover:bg-[#008060]/5 disabled:opacity-40">Réactiver</button>
          <button disabled={bulkBusy} onClick={() => {
            const days = prompt('Prolonger de combien de jours ?', '30');
            if (!days || isNaN(+days)) return;
            const map = new Map(filtered.map((t) => [t.id, t]));
            (async () => {
              setBulkBusy(true);
              try {
                for (const id of selected) {
                  const t = map.get(id);
                  const base = t?.subscription_ends_at && new Date(t.subscription_ends_at) > new Date() ? new Date(t.subscription_ends_at) : new Date();
                  base.setDate(base.getDate() + Number(days));
                  await runAction(id, 'extend', { p_subscription_ends_at: base.toISOString() }, `Prolongation groupée de ${days} jours`);
                }
                setSelected(new Set());
                await load();
              } catch (e) { alert(e.message); } finally { setBulkBusy(false); }
            })();
          }} className="text-xs font-semibold text-[#202223] border border-[#E1E1E1] rounded-full px-2.5 py-1 hover:bg-black/5 disabled:opacity-40">Prolonger…</button>
          {bulkBusy && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6D7175]" />}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
        {loading ? <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-[#008060] mx-auto" /></div> : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#6D7175]">Aucune boutique.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F4F4F4] text-left text-xs text-[#6D7175]">
                <tr>
                  <th className="px-3 py-2.5"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="accent-[#008060]" /></th>
                  <th className="px-3 py-2.5 font-semibold">Boutique</th>
                  <th className="px-3 py-2.5 font-semibold">Plan</th>
                  <th className="px-3 py-2.5 font-semibold">Statut</th>
                  <th className="px-3 py-2.5 font-semibold">Essai</th>
                  <th className="px-3 py-2.5 font-semibold">Prochain renouvellement</th>
                  <th className="px-3 py-2.5 font-semibold">Crédit</th>
                  <th className="px-3 py-2.5 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const tLeft = daysLeft(t.trial_ends_at);
                  const sLeft = daysLeft(t.subscription_ends_at);
                  return (
                    <tr key={t.id} className="border-t border-[#E1E1E1] hover:bg-[#F4F4F4]">
                      <td className="px-3 py-2.5"><input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} className="accent-[#008060]" /></td>
                      <td className="px-3 py-2.5"><p className="font-medium text-[#202223]">{t.name}</p><p className="text-[11px] text-[#6D7175]">{t.slug}</p></td>
                      <td className="px-3 py-2.5"><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F4F4F4] text-[#202223]">{PLAN_LABELS[t.plan] || t.plan || '—'}</span>{t.discount_percent > 0 && <span className="ml-1 text-[10px] text-[#008060]">-{t.discount_percent}%</span>}</td>
                      <td className="px-3 py-2.5"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[t.status] || 'bg-[#F4F4F4] text-[#6D7175]'}`}>{t.status || '—'}</span></td>
                      <td className="px-3 py-2.5 text-[#6D7175]">{t.status === 'trial' && t.trial_ends_at ? (tLeft >= 0 ? `${tLeft} j` : 'Expiré') : '—'}</td>
                      <td className="px-3 py-2.5 text-[#6D7175]">{t.subscription_ends_at ? `${fmtDate(t.subscription_ends_at)}${sLeft != null ? ` (${sLeft}j)` : ''}` : '—'}</td>
                      <td className="px-3 py-2.5 text-[#6D7175]">{t.credits_cents > 0 ? formatMoney(t.credits_cents / 100, t.currency) : '—'}</td>
                      <td className="px-3 py-2.5 text-right"><button onClick={() => setDetail(t)} className="text-xs font-semibold text-[#008060] hover:underline flex items-center gap-0.5">Gérer <ChevronRight className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail && (
        <TenantSubscriptionDrawer
          tenant={detail}
          onClose={() => setDetail(null)}
          onChanged={async () => { await load(); setDetail((d) => tenants.find((t) => t.id === d?.id) || d); }}
          runAction={runAction}
        />
      )}
    </div>
  );
}

function TenantSubscriptionDrawer({ tenant, onClose, onChanged, runAction }) {
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [plan, setPlan] = useState(tenant.plan || 'starter');
  const [billingCycle, setBillingCycle] = useState(tenant.billing_cycle || 'monthly');
  const [extendDays, setExtendDays] = useState(30);
  const [bonusDays, setBonusDays] = useState(7);
  const [trialDate, setTrialDate] = useState(tenant.trial_ends_at ? tenant.trial_ends_at.slice(0, 10) : '');
  const [discount, setDiscount] = useState(tenant.discount_percent || 0);
  const [creditAmount, setCreditAmount] = useState(0);
  const [reason, setReason] = useState('');

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const { data } = await supabase.from('subscription_audit_log').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(50);
    setHistory(data || []);
    setHistoryLoading(false);
  }, [tenant.id]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const withBase = () => {
    const now = new Date();
    if (tenant.subscription_ends_at && new Date(tenant.subscription_ends_at) > now) return new Date(tenant.subscription_ends_at);
    return now;
  };

  const act = async (action, params, note, msg) => {
    if (!confirm(msg)) return;
    setBusy(true);
    try {
      await runAction(tenant.id, action, params, note || reason || null);
      setReason('');
      await onChanged();
      await loadHistory();
    } catch (e) {
      alert(e.message || "Échec de l'action");
    } finally { setBusy(false); }
  };

  const changePlan = () => act('plan_change', { p_plan: plan, p_billing_cycle: billingCycle }, reason, `Changer le plan de "${tenant.plan}" à "${plan}" (${billingCycle}) ?`);
  const extend = () => { const d = withBase(); d.setDate(d.getDate() + Number(extendDays)); act('extend', { p_subscription_ends_at: d.toISOString() }, reason, `Prolonger l'abonnement de ${extendDays} jours (nouvelle échéance : ${fmtDate(d)}) ?`); };
  const reduce = () => { const d = withBase(); d.setDate(d.getDate() - Number(extendDays)); act('reduce', { p_subscription_ends_at: d.toISOString() }, reason, `Réduire l'abonnement de ${extendDays} jours (nouvelle échéance : ${fmtDate(d)}) ?`); };
  const grantBonus = () => { const d = withBase(); d.setDate(d.getDate() + Number(bonusDays)); act('bonus_days', { p_subscription_ends_at: d.toISOString() }, reason || `${bonusDays} jours offerts`, `Offrir ${bonusDays} jours supplémentaires ?`); };
  const setTrial = () => act('trial_set', { p_trial_ends_at: trialDate ? new Date(trialDate).toISOString() : null, p_status: 'trial' }, reason, `Définir la fin d'essai au ${fmtDate(trialDate)} ?`);
  const suspend = () => act('suspend', { p_status: 'suspended', p_suspended_reason: reason || 'Suspendu par un super admin' }, reason, `Suspendre cette boutique ? Le client n'aura plus accès à l'administration.`);
  const reactivate = () => act('reactivate', { p_status: 'active' }, reason, `Réactiver cette boutique ?`);
  const applyDiscount = () => act('discount_applied', { p_discount_percent: Number(discount) }, reason, `Appliquer une remise récurrente de ${discount}% ?`);
  const applyCredit = () => act('credit_applied', { p_credits_delta_cents: Math.round(Number(creditAmount) * 100) }, reason, `${Number(creditAmount) >= 0 ? 'Ajouter' : 'Retirer'} ${Math.abs(Number(creditAmount))} ${tenant.currency || ''} de crédit ?`);

  const inputCls = 'px-2.5 py-1.5 border border-[#E1E1E1] rounded-md text-xs w-full';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-[#E1E1E1] px-5 py-4 flex items-center justify-between z-10">
          <div><p className="text-sm font-bold text-[#202223]">{tenant.name}</p><p className="text-[11px] text-[#6D7175]">{tenant.slug}</p></div>
          <button onClick={onClose} className="text-[#6D7175] p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          {tenant.status === 'suspended' && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700"><AlertTriangle className="w-4 h-4 shrink-0" /> Boutique suspendue{tenant.suspended_reason ? ` — ${tenant.suspended_reason}` : ''} le {fmtDate(tenant.suspended_at)}</div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#F4F4F4] rounded-lg p-3"><p className="text-[#6D7175] mb-0.5">Créée le</p><p className="font-semibold text-[#202223]">{fmtDate(tenant.created_at)}</p></div>
            <div className="bg-[#F4F4F4] rounded-lg p-3"><p className="text-[#6D7175] mb-0.5">Statut</p><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[tenant.status] || ''}`}>{tenant.status}</span></div>
            <div className="bg-[#F4F4F4] rounded-lg p-3"><p className="text-[#6D7175] mb-0.5">Fin d'essai</p><p className="font-semibold text-[#202223]">{fmtDate(tenant.trial_ends_at)}</p></div>
            <div className="bg-[#F4F4F4] rounded-lg p-3"><p className="text-[#6D7175] mb-0.5">Prochain renouvellement</p><p className="font-semibold text-[#202223]">{fmtDate(tenant.subscription_ends_at)}</p></div>
            <div className="bg-[#F4F4F4] rounded-lg p-3"><p className="text-[#6D7175] mb-0.5">Crédit</p><p className="font-semibold text-[#202223]">{formatMoney((tenant.credits_cents || 0) / 100, tenant.currency)}</p></div>
            <div className="bg-[#F4F4F4] rounded-lg p-3"><p className="text-[#6D7175] mb-0.5">Remise</p><p className="font-semibold text-[#202223]">{tenant.discount_percent || 0}%</p></div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#6D7175] block mb-1">Note (jointe à la prochaine action, journalisée)</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Raison de l'intervention…" className={inputCls} />
          </div>

          <section className="border border-[#E1E1E1] rounded-lg p-3.5">
            <p className="text-xs font-bold text-[#202223] mb-2 flex items-center gap-1.5"><ArrowUpDown className="w-3.5 h-3.5" /> Plan & cycle</p>
            <div className="flex gap-2">
              <select value={plan} onChange={(e) => setPlan(e.target.value)} className={inputCls}>{PLANS.map((p) => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}</select>
              <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)} className={inputCls}><option value="monthly">Mensuel</option><option value="annual">Annuel</option></select>
              <button disabled={busy} onClick={changePlan} className="shrink-0 text-xs font-semibold bg-[#202223] text-white rounded-md px-3 hover:bg-black/80 disabled:opacity-40">Appliquer</button>
            </div>
          </section>

          <section className="border border-[#E1E1E1] rounded-lg p-3.5">
            <p className="text-xs font-bold text-[#202223] mb-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Durée de l'abonnement</p>
            <div className="flex gap-2 items-center">
              <input type="number" value={extendDays} onChange={(e) => setExtendDays(e.target.value)} className={inputCls + ' w-20'} />
              <span className="text-xs text-[#6D7175]">jours</span>
              <button disabled={busy} onClick={extend} className="text-xs font-semibold text-[#008060] border border-[#008060]/30 rounded-md px-3 py-1.5 hover:bg-[#008060]/5 disabled:opacity-40">Prolonger</button>
              <button disabled={busy} onClick={reduce} className="text-xs font-semibold text-red-600 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50 disabled:opacity-40">Réduire</button>
            </div>
          </section>

          <section className="border border-[#E1E1E1] rounded-lg p-3.5">
            <p className="text-xs font-bold text-[#202223] mb-2 flex items-center gap-1.5"><Gift className="w-3.5 h-3.5" /> Jours offerts</p>
            <div className="flex gap-2 items-center">
              <input type="number" value={bonusDays} onChange={(e) => setBonusDays(e.target.value)} className={inputCls + ' w-20'} />
              <span className="text-xs text-[#6D7175]">jours</span>
              <button disabled={busy} onClick={grantBonus} className="text-xs font-semibold text-[#008060] border border-[#008060]/30 rounded-md px-3 py-1.5 hover:bg-[#008060]/5 disabled:opacity-40">Offrir</button>
            </div>
          </section>

          <section className="border border-[#E1E1E1] rounded-lg p-3.5">
            <p className="text-xs font-bold text-[#202223] mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Essai personnalisé</p>
            <div className="flex gap-2">
              <input type="date" value={trialDate} onChange={(e) => setTrialDate(e.target.value)} className={inputCls} />
              <button disabled={busy} onClick={setTrial} className="shrink-0 text-xs font-semibold bg-[#202223] text-white rounded-md px-3 hover:bg-black/80 disabled:opacity-40">Définir</button>
            </div>
          </section>

          <section className="border border-[#E1E1E1] rounded-lg p-3.5">
            <p className="text-xs font-bold text-[#202223] mb-2 flex items-center gap-1.5"><Percent className="w-3.5 h-3.5" /> Remise récurrente</p>
            <div className="flex gap-2 items-center">
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputCls + ' w-20'} /><span className="text-xs text-[#6D7175]">%</span>
              <button disabled={busy} onClick={applyDiscount} className="text-xs font-semibold bg-[#202223] text-white rounded-md px-3 py-1.5 hover:bg-black/80 disabled:opacity-40">Appliquer</button>
            </div>
          </section>

          <section className="border border-[#E1E1E1] rounded-lg p-3.5">
            <p className="text-xs font-bold text-[#202223] mb-2 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Crédit de compte</p>
            <div className="flex gap-2 items-center">
              <input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="+/- montant" className={inputCls} />
              <button disabled={busy} onClick={applyCredit} className="shrink-0 text-xs font-semibold bg-[#202223] text-white rounded-md px-3 hover:bg-black/80 disabled:opacity-40">Appliquer</button>
            </div>
          </section>

          <section className="border border-[#E1E1E1] rounded-lg p-3.5">
            <p className="text-xs font-bold text-[#202223] mb-2 flex items-center gap-1.5"><Ban className="w-3.5 h-3.5" /> État du compte</p>
            {tenant.status === 'suspended' ? (
              <button disabled={busy} onClick={reactivate} className="text-xs font-semibold text-[#008060] border border-[#008060]/30 rounded-md px-3 py-1.5 hover:bg-[#008060]/5 disabled:opacity-40 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Réactiver</button>
            ) : (
              <button disabled={busy} onClick={suspend} className="text-xs font-semibold text-red-600 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50 disabled:opacity-40 flex items-center gap-1"><Ban className="w-3.5 h-3.5" /> Suspendre</button>
            )}
          </section>

          <section>
            <p className="text-xs font-bold text-[#202223] mb-2 flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Historique</p>
            {historyLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#6D7175]" /> : history.length === 0 ? (
              <p className="text-xs text-[#6D7175]">Aucune action enregistrée pour cette boutique.</p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="text-xs border-l-2 border-[#E1E1E1] pl-3 py-0.5">
                    <p className="font-semibold text-[#202223]">{ACTION_LABELS[h.action] || h.action}</p>
                    <p className="text-[#6D7175]">{h.admin_email} · {new Date(h.created_at).toLocaleString('fr-FR')}</p>
                    {h.note && <p className="text-[#6D7175] italic">« {h.note} »</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
