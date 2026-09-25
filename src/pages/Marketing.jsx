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

// Real message from the function's own JSON error body - same pattern
// used everywhere an edge function is called this session.
async function functionErrorMessage(error) {
  try {
    const body = await error.context?.json?.();
    if (body?.error) return body.error;
  } catch { /* fall through to the generic message below */ }
  return error.message || 'Erreur inconnue';
}

// Real data (orders/customers/abandoned_carts) AND real sending: the
// send-email Edge Function (Resend, platform-wide key in
// platform_secrets) actually sends now - the old code called
// base44.integrations.Core.SendEmail and showed a fake "Envoyé !" toast
// regardless of whether anything went out; this genuinely does.
export default function Marketing() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(null);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const [o, c, ca] = await Promise.all([
        supabase.from('orders').select('*').eq('tenant_id', store.id).order('created_at', { ascending: false }).limit(500),
        supabase.from('customers').select('*').eq('tenant_id', store.id).order('created_at', { ascending: false }).limit(200),
        supabase.from('abandoned_carts').select('*').eq('tenant_id', store.id).eq('status', 'open').lt('last_activity_at', oneHourAgo).order('created_at', { ascending: false }).limit(50),
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

  // Real segments per campaign, computed from the same real data already
  // loaded - not a placeholder count.
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);
  const orderedCustomerIds = new Set(paidOrders.map((o) => o.customer_id).filter(Boolean));
  const newCustomers = marketingCustomers.filter((c) => new Date(c.created_at) > sevenDaysAgo);
  const winbackCustomers = marketingCustomers.filter((c) => {
    if (!orderedCustomerIds.has(c.id)) return false;
    const lastOrder = paidOrders.filter((o) => o.customer_id === c.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    return lastOrder && new Date(lastOrder.created_at) < sixtyDaysAgo;
  });
  const abandonedEmails = [...new Set(carts.map((c) => c.email).filter(Boolean))];

  const showNotice = (text) => { setNotice(text); setTimeout(() => setNotice(''), 6000); };

  const sendCampaign = async (campaign) => {
    const recipients = campaign.id === 'abandoned' ? abandonedEmails
      : campaign.id === 'newsletter' ? marketingCustomers.map((c) => c.email)
      : campaign.id === 'welcome' ? newCustomers.map((c) => c.email)
      : winbackCustomers.map((c) => c.email);
    if (recipients.length === 0) return;
    setSending(campaign.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          tenant_id: store.id,
          to: recipients,
          subject: campaign.subject,
          html: campaign.html,
          from_name: store.name,
          campaign_id: campaign.id,
        },
      });
      if (error) throw new Error(await functionErrorMessage(error));
      if (data?.error) throw new Error(data.error);
      showNotice(`E-mail envoyé à ${recipients.length} destinataire(s).`);
    } catch (e) {
      showNotice(e.message || "Échec de l'envoi");
    } finally { setSending(null); }
  };

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
    { id: 'abandoned', icon: ShoppingCart, title: 'Récupération de paniers abandonnés', desc: 'Relancez les clients qui n\u2019ont pas finalisé leur commande.', stat: `${carts.length} panier(s) · ${formatMoney(abandonedValue, store.currency)}`, color: '#E67E22', count: abandonedEmails.length, subject: `Vous avez oublié quelque chose chez ${store.name}`, html: `<p>Bonjour,</p><p>Vous avez laissé des articles dans votre panier chez <strong>${store.name}</strong>. Ils vous attendent toujours !</p><p><a href="https://sellia.liafrik.com/store/${store.slug}/cart">Finaliser ma commande</a></p>` },
    { id: 'newsletter', icon: Mail, title: 'Newsletter produits', desc: `Envoyez un e-mail à vos ${marketingCustomers.length} client(s) contactable(s).`, stat: `${marketingCustomers.length} contact(s)`, color: '#008060', count: marketingCustomers.length, subject: `Nouveautés chez ${store.name}`, html: `<p>Bonjour,</p><p>Découvrez nos derniers produits chez <strong>${store.name}</strong> !</p><p><a href="https://sellia.liafrik.com/store/${store.slug}">Visiter la boutique</a></p>` },
    { id: 'welcome', icon: Users, title: 'E-mail de bienvenue', desc: 'Souhaitez la bienvenue aux clients inscrits ces 7 derniers jours.', stat: `${newCustomers.length} nouveau(x) client(s)`, color: '#8B5CF6', count: newCustomers.length, subject: `Bienvenue chez ${store.name} !`, html: `<p>Bonjour,</p><p>Merci de nous avoir rejoint ! Nous sommes ravis de vous compter parmi nos clients.</p><p><a href="https://sellia.liafrik.com/store/${store.slug}">Découvrir la boutique</a></p>` },
    { id: 'winback', icon: TrendingUp, title: 'Réactivation clients', desc: 'Réengagez les clients qui n\u2019ont pas commandé depuis 60+ jours.', stat: `${winbackCustomers.length} client(s) inactif(s)`, color: '#0EA5E9', count: winbackCustomers.length, subject: `On vous a manqué chez ${store.name}`, html: `<p>Bonjour,</p><p>Ça fait un moment ! Revenez découvrir nos nouveautés chez <strong>${store.name}</strong>.</p><p><a href="https://sellia.liafrik.com/store/${store.slug}">Revenir sur la boutique</a></p>` },
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

      <div className="mb-4 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">Envoi réel activé (Resend). Si un envoi échoue en indiquant que ce n'est pas configuré, contactez le support — la clé d'envoi de la plateforme doit être ajoutée côté serveur.</p>
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
              <button
                onClick={() => sendCampaign(c)}
                disabled={!c.count || sending === c.id}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#008060] px-3 py-1.5 rounded-full hover:bg-[#00694d] disabled:opacity-40"
              >
                {sending === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Envoyer
              </button>
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
