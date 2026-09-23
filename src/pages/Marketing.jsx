import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Megaphone, Loader2, AlertCircle, ShoppingCart, Mail, Users, TrendingUp,
  Send, Clock, AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { formatMoney } from '@/lib/world/currencies';

const NOT_PAID = new Set(['pending', 'cancelled', 'refunded']);

// Real data (orders/customers/abandoned_carts), but honest about the one
// thing that isn't real: no email-sending backend exists anywhere in this
// app (same gap as Chat.jsx replies and newsletter notifications) - the
// old code called base44.integrations.Core.SendEmail and showed a fake
// "Envoyé !" toast regardless. Buttons here say plainly that this isn't
// wired yet instead of pretending an email went out.
export default function Marketing() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const [o, c, ca] = await Promise.all([
        supabase.from('orders').select('*').eq('tenant_id', store.id).order('created_at', { ascending: false }).limit(500),
        supabase.from('customers').select('*').eq('tenant_id', store.id).order('created_at', { ascending: false }).limit(200),
        supabase.from('abandoned_carts').select('*').eq('tenant_id', store.id).eq('status', 'abandoned').order('created_at', { ascending: false }).limit(50),
      ]);
      setOrders(o.data || []); setCustomers(c.data || []); setCarts(ca.data || []);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const marketingCustomers = customers.filter((c) => c.email);
  const paidOrders = orders.filter((o) => !NOT_PAID.has(o.status));
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.total_cents || 0) / 100, 0);
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  const abandonedValue = carts.reduce((s, c) => s + (c.total_cents || 0) / 100, 0);

  const showNotice = (text) => { setNotice(text); setTimeout(() => setNotice(''), 5000); };

  if (storeLoading || loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Configurez votre boutique</h1>
        <Link to="/onboarding" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-3">Configurer</Link>
      </div>
    );
  }

  const campaigns = [
    { id: 'abandoned', icon: ShoppingCart, title: 'Récupération de paniers abandonnés', desc: 'Relancez les clients qui n\u2019ont pas finalisé leur commande.', stat: `${carts.length} panier(s) · ${formatMoney(abandonedValue, store.currency)}`, color: '#E67E22' },
    { id: 'newsletter', icon: Mail, title: 'Newsletter produits', desc: `Envoyez un e-mail à vos ${marketingCustomers.length} client(s) contactable(s).`, stat: `${marketingCustomers.length} contact(s)`, color: '#008060' },
    { id: 'welcome', icon: Users, title: 'E-mail de bienvenue', desc: 'Souhaitez la bienvenue aux nouveaux clients et offrez un code promo.', stat: `${customers.length} client(s) au total`, color: '#8B5CF6', soon: true },
    { id: 'winback', icon: TrendingUp, title: 'Réactivation clients', desc: 'Réengagez les clients qui n\u2019ont pas commandé depuis 60+ jours.', stat: 'Automatisation IA', color: '#0EA5E9', soon: true },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Megaphone className="w-5 h-5 text-[#6D7175]" />
        <div>
          <h1 className="text-xl font-bold text-[#202223]">Marketing</h1>
          <p className="text-xs text-[#6D7175]">Campagnes et automatisation pour fidéliser vos clients.</p>
        </div>
      </div>

      <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">Les données ci-dessous (paniers, clients, panier moyen) sont réelles. L'envoi effectif d'e-mails n'est pas encore branché à un service d'envoi sur cette plateforme.</p>
      </div>

      {notice && (
        <div className="mb-4 flex items-center gap-2 bg-[#F4F4F4] border border-[#E1E1E1] rounded-lg px-4 py-3">
          <p className="text-sm text-[#202223] font-medium">{notice}</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBox icon={Users} label="Clients contactables" value={String(marketingCustomers.length)} />
        <StatBox icon={ShoppingCart} label="Paniers abandonnés" value={String(carts.length)} />
        <StatBox icon={TrendingUp} label="Panier moyen" value={formatMoney(avgOrderValue, store.currency)} />
        <StatBox icon={Mail} label="Valeur abandonnée" value={formatMoney(abandonedValue, store.currency)} />
      </div>

      <h2 className="text-sm font-bold text-[#202223] mb-3">Campagnes</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-[#E1E1E1] p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${c.color}15` }}>
                <c.icon className="w-5 h-5" style={{ color: c.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#202223]">{c.title}</h3>
                <p className="text-xs text-[#6D7175] mt-0.5">{c.desc}</p>
                <p className="text-[11px] font-semibold text-[#6D7175] mt-2">{c.stat}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              {c.soon ? (
                <span className="text-xs font-medium text-[#6D7175] bg-[#F4F4F4] px-3 py-1.5 rounded-full">Bientôt</span>
              ) : (
                <button
                  onClick={() => showNotice("L'envoi d'e-mails n'est pas encore configuré sur cette plateforme. Contactez vos clients par un autre moyen pour l'instant.")}
                  disabled={c.id === 'abandoned' ? !carts.length : !marketingCustomers.length}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#008060] px-3 py-1.5 rounded-full hover:bg-[#00694d] disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" /> Envoyer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-[#6D7175]" />
          <h2 className="text-sm font-bold text-[#202223]">Paniers abandonnés</h2>
        </div>
        {carts.length === 0 ? (
          <p className="text-sm text-[#6D7175] py-6 text-center">Aucun panier abandonné. Bravo !</p>
        ) : (
          <div className="space-y-2">
            {carts.slice(0, 8).map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-[#F4F4F4] border border-[#E1E1E1]/50 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#202223] truncate">{(c.items || []).length} article(s) · {formatMoney((c.total_cents || 0) / 100, store.currency)}</p>
                  <p className="text-[11px] text-[#6D7175]">{c.customer_email || 'Client invité'} · {new Date(c.created_at).toLocaleDateString()}</p>
                </div>
                {c.customer_email && <a href={`mailto:${c.customer_email}`} className="flex items-center gap-1.5 text-xs font-semibold text-[#008060] border border-[#008060]/40 rounded-full px-3 py-1.5 hover:bg-[#008060]/5 shrink-0"><Mail className="w-3.5 h-3.5" /> Contacter</a>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#E1E1E1] bg-white p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-[#6D7175]" />
        <span className="text-xs text-[#6D7175]">{label}</span>
      </div>
      <p className="font-bold text-lg text-[#202223]">{value}</p>
    </div>
  );
}
