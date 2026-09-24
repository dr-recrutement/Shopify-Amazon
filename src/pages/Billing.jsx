import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Check, Loader2, Download, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { PLANS, PLAN_ORDER, getPlan } from '@/lib/plans';
import PlatformPaymentPicker from '@/components/PlatformPaymentPicker';
import { formatMoney } from '@/lib/world/currencies';

const planFeatures = (plan) => {
  const l = plan.limits;
  const feats = [];
  feats.push(l.products === Infinity ? 'Produits illimités' : `${l.products} produits`);
  feats.push(l.stores === Infinity ? 'Boutiques illimitées' : `${l.stores} boutique(s)`);
  feats.push(l.users === Infinity ? 'Utilisateurs illimités' : `${l.users} utilisateurs`);
  if (l.editor) feats.push('Éditeur visuel');
  if (l.payments === 'integrated') feats.push('Paiements intégrés');
  if (l.multi_currency) feats.push('Multi-devises');
  if (l.ai_assistant) feats.push('Sellia Assistant');
  if (l.custom_domain) feats.push('Domaine personnalisé');
  if (l.discounts) feats.push('Réductions');
  if (l.marketplace) feats.push('Marketplace');
  if (l.api) feats.push('Accès API');
  return feats.slice(0, 6);
};

export default function Billing() {
  const { store, loading } = useCurrentStore();
  const [payments, setPayments] = useState([]);
  const [changing, setChanging] = useState(null);

  const load = useCallback(async () => {
    if (!store?.id) return;
    // No dedicated payments/invoice table exists yet - this shows the real
    // trial/plan state (from tenants), honestly with an empty payment
    // history rather than fabricated invoice rows.
    setPayments([]);
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const inTrial = store?.plan_status === 'trial';
  const [payingFor, setPayingFor] = useState(null);
  const changePlan = async (planId) => {
    if (!store?.id) return;
    if (!inTrial) { setPayingFor(planId); return; }
    setChanging(planId);
    try {
      const { error } = await supabase.from('tenants').update({ plan: planId, status: 'trial', trial_ends_at: store.trial_ends_at || new Date(Date.now() + 14 * 86400000).toISOString() }).eq('id', store.id);
      if (error) throw error;
      window.location.reload();
    } catch (e) {
      alert(e.message || 'Échec du changement de plan');
    } finally { setChanging(null); }
  };
  const onSubscriptionPaid = async () => {
    const planId = payingFor;
    setPayingFor(null);
    setChanging(planId);
    try {
      const { error } = await supabase.from('tenants').update({ plan: planId, status: 'active', subscription_ends_at: new Date(Date.now() + 30 * 86400000).toISOString() }).eq('id', store.id);
      if (error) throw error;
      window.location.reload();
    } catch (e) {
      alert(e.message || "Paiement confirmé mais l'activation du plan a échoué. Contactez le support.");
    } finally { setChanging(null); }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) return <div className="max-w-md mx-auto mt-20 text-center"><AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" /><p className="text-sm text-[#6D7175]">Configurez votre boutique pour gérer l'abonnement.</p></div>;

  const currentPlan = getPlan(store.plan);
  const PLANS_LIST = PLAN_ORDER.map((id) => PLANS[id]);
  const trialEnd = store.trial_ends_at ? new Date(store.trial_ends_at) : null;
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - Date.now()) / 86400000)) : 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5 text-[#6D7175]" />
        <h1 className="text-xl font-bold text-[#202223]">Abonnement et facturation</h1>
      </div>

      <div className="bg-gradient-to-r from-[#008060] to-[#00A878] rounded-2xl p-6 text-white mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide opacity-80">Plan actuel</p>
            <p className="text-2xl font-bold mt-1">{currentPlan.name}</p>
            <p className="text-sm opacity-90 mt-1">{currentPlan.price} {currentPlan.period}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide opacity-80">Essai gratuit</p>
            <p className="text-2xl font-bold mt-1">{daysLeft} jours restants</p>
            <p className="text-sm opacity-90 mt-1">{store.plan_status === 'trial' ? 'Aucune carte requise' : 'Actif'}</p>
          </div>
        </div>
      </div>

      <h2 className="text-sm font-bold text-[#202223] mb-3">Changer de palier tarifaire — 14 jours d'essai gratuit</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {PLANS_LIST.map((plan) => {
          const active = store.plan === plan.id;
          return (
            <div key={plan.id} className={`rounded-xl border-2 p-5 ${active ? 'border-[#008060] bg-[#008060]/5' : 'border-[#E1E1E1] bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-[#202223]">{plan.name}</p>
                {active && <span className="text-[10px] font-bold bg-[#008060] text-white px-2 py-0.5 rounded-full">ACTUEL</span>}
              </div>
              <p className="text-2xl font-bold text-[#202223]">{plan.price}<span className="text-xs font-normal text-[#6D7175]"> {plan.period}</span></p>
              <ul className="mt-3 space-y-1.5">
                {planFeatures(plan).map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-[#6D7175]"><Check className="w-3.5 h-3.5 text-[#008060] shrink-0 mt-0.5" /> {f}</li>
                ))}
              </ul>
              <button onClick={() => changePlan(plan.id)} disabled={active || changing === plan.id} className="w-full mt-4 text-xs font-semibold py-2.5 rounded-full transition disabled:opacity-40 bg-[#008060] text-white hover:bg-[#00694d]">
                {changing === plan.id ? 'Changement…' : active ? 'Plan actuel' : 'Choisir ce plan'}
              </button>
            </div>
          );
        })}
      </div>

      <h2 className="text-sm font-bold text-[#202223] mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> Historique des paiements</h2>
      <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6D7175]">Aucun historique de facturation disponible pour l'instant — le suivi des paiements d'abonnement n'est pas encore branché sur cette plateforme.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F4F4F4] text-left text-xs text-[#6D7175]">
              <tr><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Description</th><th className="px-4 py-3 font-semibold">Montant</th><th className="px-4 py-3 font-semibold">Statut</th><th className="px-4 py-3 font-semibold"></th></tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-[#E1E1E1]">
                  <td className="px-4 py-3 text-[#6D7175]">{new Date(p.created_date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-[#202223]">Abonnement {currentPlan.name}</td>
                  <td className="px-4 py-3 font-semibold text-[#202223]">{formatMoney(p.amount, p.currency)}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${p.status === 'succeeded' ? 'bg-[#008060]/10 text-[#008060]' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span></td>
                  <td className="px-4 py-3"><Download className="w-4 h-4 text-[#6D7175] cursor-pointer hover:text-[#008060]" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
      {payingFor && (
        <PlatformPaymentPicker
          amount={PLANS[payingFor]?.price || 0}
          currency="USD"
          purpose="subscription"
          plan={payingFor}
          reference={`sub-${store.id}-${payingFor}-${Date.now()}`}
          tenantId={store.id}
          onCancel={() => setPayingFor(null)}
          onSuccess={onSubscriptionPaid}
        />
      )}
    </div>
  );
}