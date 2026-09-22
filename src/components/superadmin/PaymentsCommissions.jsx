import { useState, useEffect, useCallback, useMemo } from 'react';
import { Wallet, Loader2, Globe, AlertCircle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { formatMoney } from '@/lib/world/currencies';

// Real revenue Sellia actually collects today lives in one place: the 10%
// markup on Cloudflare domain purchases (domains.platform_fee_cents, from
// the Registrar integration earlier this session). There is no connected
// payment gateway for order-level transactions or subscription billing, so
// this deliberately does NOT invent numbers for those - it shows what's
// real and says plainly what isn't wired yet.
export default function PaymentsCommissions() {
  const [domains, setDomains] = useState([]);
  const [tenants, setTenants] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [d, t] = await Promise.all([
      supabase.from('domains').select('*').eq('type', 'buy').order('created_at', { ascending: false }).limit(500),
      supabase.from('tenants').select('id, name'),
    ]);
    setDomains(d.data || []);
    setTenants(Object.fromEntries((t.data || []).map((x) => [x.id, x.name])));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalFees = domains.reduce((s, d) => s + (d.platform_fee_cents || 0), 0);
  const totalCollected = domains.reduce((s, d) => s + (d.price_cents || 0), 0);

  const byStore = useMemo(() => {
    const map = {};
    domains.forEach((d) => {
      const key = d.tenant_id;
      if (!map[key]) map[key] = { name: tenants[key] || key.slice(0, 8), fee: 0, count: 0, currency: d.currency || 'USD' };
      map[key].fee += d.platform_fee_cents || 0;
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => b.fee - a.fee);
  }, [domains, tenants]);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-[#008060]" /></div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4"><Wallet className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Paiements & commissions</h2></div>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">Aucune passerelle de paiement (Stripe, Flutterwave, PayUnit…) n'est connectée pour l'instant — pas de suivi réel des transactions de commandes, remboursements ou payouts d'abonnement ici. La seule commission réellement encaissée aujourd'hui vient de l'achat de domaines via Cloudflare (+10%, voir la page Domaines).</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><Globe className="w-4 h-4 text-[#008060] mb-2" /><p className="text-xl font-bold text-[#202223]">{formatMoney(totalFees / 100, 'USD')}</p><p className="text-xs text-[#6D7175]">Commission Sellia cumulée (domaines)</p></div>
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><p className="text-xl font-bold text-[#202223]">{formatMoney(totalCollected / 100, 'USD')}</p><p className="text-xs text-[#6D7175]">Total facturé aux marchands</p></div>
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><p className="text-xl font-bold text-[#202223]">{domains.length}</p><p className="text-xs text-[#6D7175]">Domaines achetés via Sellia</p></div>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E1E1E1]"><p className="text-xs font-bold text-[#202223]">Commission par boutique</p></div>
        {byStore.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#6D7175]">Aucun domaine acheté via Sellia pour l'instant.</p>
        ) : (
          <div className="divide-y divide-[#E1E1E1]">
            {byStore.map((s) => (
              <div key={s.name} className="px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-[#202223]">{s.name}</span>
                <span className="text-[#6D7175]">{s.count} domaine(s) · <span className="font-semibold text-[#008060]">{formatMoney(s.fee / 100, s.currency)}</span></span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
