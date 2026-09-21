import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Megaphone, Loader2, AlertCircle, ShoppingCart, Mail, Users, TrendingUp,
  Send, Clock, CheckCircle, ArrowRight, Zap, Target,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { formatMoney } from '@/lib/world/currencies';

export default function Marketing() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(null);
  const [sentToast, setSentToast] = useState('');

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const [o, c, ca] = await Promise.all([
        base44.entities.Order.filter({ store_id: store.id }, '-created_date', 500),
        base44.entities.Customer.filter({ store_id: store.id }, '-created_date', 200),
        base44.entities.Cart.filter({ store_id: store.id, status: 'abandoned' }, '-created_date', 50),
      ]);
      setOrders(o); setCustomers(c); setCarts(ca);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const marketingCustomers = customers.filter((c) => c.accepts_marketing);
  const totalRevenue = orders.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + (o.total || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const abandonedValue = carts.reduce((s, c) => s + (c.total || 0), 0);

  const sendAbandonedRecovery = async (cart) => {
    const email = cart.customer_email || cart.items?.[0]?.email;
    if (!email) { setSentToast('Aucun e-mail associ\u00e9 \u00e0 ce panier.'); return; }
    setSending(cart.id);
    try {
      const items = (cart.items || []).map((i) => `${i.title} (x${i.quantity})`).join(', ');
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `Vous avez oubli\u00e9 quelque chose \u2014 ${store?.name || 'votre boutique'}`,
        html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;background:#fff;padding:32px;border:1px solid #E1E1E1;border-radius:12px">
          <h2 style="color:#008060;margin:0 0 16px">Votre panier vous attend</h2>
          <p style="color:#202223;font-size:14px">Bonjour,</p>
          <p style="color:#6D7175;font-size:14px">Vous avez laiss\u00e9 des articles dans votre panier chez <strong>${store?.name || 'notre boutique'}</strong>. Il n'est pas trop tard pour finaliser votre commande !</p>
          <div style="background:#F4F4F4;border-radius:8px;padding:16px;margin:16px 0"><p style="margin:0;color:#202223;font-size:14px">${items}</p><p style="margin:8px 0 0;color:#008060;font-weight:bold">${formatMoney(cart.total || 0, store?.currency)}</p></div>
          <a href="${window.location.origin}/store/${store?.slug || ''}" style="display:inline-block;background:#008060;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:600;font-size:14px;margin-top:8px">Finaliser ma commande</a>
          <p style="color:#C9C9C9;font-size:11px;margin-top:24px">Si vous n'avez pas demand\u00e9 cet e-mail, vous pouvez l'ignorer.</p>
        </div>`,
      });
      setSentToast(`E-mail de r\u00e9cup\u00e9ration envoy\u00e9 \u00e0 ${email}`);
    } catch (e) {
      setSentToast('Erreur : ' + (e.message || 'envoi impossible'));
    } finally {
      setSending(null);
      setTimeout(() => setSentToast(''), 4000);
    }
  };

  const sendNewsletter = async () => {
    if (marketingCustomers.length === 0) return;
    setSending('newsletter');
    try {
      for (const c of marketingCustomers.slice(0, 50)) {
        if (!c.email) continue;
        await base44.integrations.Core.SendEmail({
          to: c.email,
          subject: `Nouveaut\u00e9s chez ${store?.name || 'votre boutique'}`,
          html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;background:#fff;padding:32px;border:1px solid #E1E1E1;border-radius:12px">
            <h2 style="color:#008060;margin:0 0 16px">Bonjour ${c.first_name || ''},</h2>
            <p style="color:#6D7175;font-size:14px">D\u00e9couvrez nos nouveaux produits et offres exclusives chez <strong>${store?.name}</strong>.</p>
            <a href="${window.location.origin}/store/${store?.slug || ''}" style="display:inline-block;background:#008060;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:600;font-size:14px;margin-top:12px">Voir la boutique</a>
          </div>`,
        });
      }
      setSentToast(`Newsletter envoy\u00e9e \u00e0 ${Math.min(marketingCustomers.length, 50)} abonn\u00e9(s)`);
    } catch (e) {
      setSentToast('Erreur : ' + (e.message || 'envoi impossible'));
    } finally {
      setSending(null);
      setTimeout(() => setSentToast(''), 4000);
    }
  };

  if (storeLoading || loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Configurez votre boutique</h1>
        <Link to="/store-setup" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-3">Configurer</Link>
      </div>
    );
  }

  const campaigns = [
    {
      id: 'abandoned',
      icon: ShoppingCart,
      title: 'R\u00e9cup\u00e9ration de paniers abandonn\u00e9s',
      desc: 'Relancez automatiquement les clients qui n\u2019ont pas finalis\u00e9 leur commande.',
      stat: `${carts.length} panier(s) \u00b7 ${formatMoney(abandonedValue, store.currency)}`,
      cta: 'Relancer',
      color: '#E67E22',
    },
    {
      id: 'newsletter',
      icon: Mail,
      title: 'Newsletter produits',
      desc: `Envoyez un e-mail \u00e0 vos ${marketingCustomers.length} abonn\u00e9(s) marketing.`,
      stat: `${marketingCustomers.length} abonn\u00e9(s)`,
      cta: 'Envoyer',
      color: '#008060',
    },
    {
      id: 'welcome',
      icon: Users,
      title: 'E-mail de bienvenue',
      desc: 'Souhaitez la bienvenue aux nouveaux clients et offrez un code promo.',
      stat: `${customers.length} client(s) au total`,
      cta: 'Bient\u00f4t',
      color: '#8B5CF6',
      soon: true,
    },
    {
      id: 'winback',
      icon: TrendingUp,
      title: 'R\u00e9activation clients',
      desc: 'R\u00e9engagez les clients qui n\u2019ont pas command\u00e9 depuis 60+ jours.',
      stat: 'Automatisation IA',
      cta: 'Bient\u00f4t',
      color: '#0EA5E9',
      soon: true,
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Megaphone className="w-5 h-5 text-[#6D7175]" />
        <div>
          <h1 className="text-xl font-bold text-[#202223]">Marketing</h1>
          <p className="text-xs text-[#6D7175]">Campagnes et automatisation pour fid\u00e9liser vos clients.</p>
        </div>
      </div>

      {sentToast && (
        <div className="mb-4 flex items-center gap-2 bg-[#008060]/10 border border-[#008060]/30 rounded-lg px-4 py-3">
          <CheckCircle className="w-4 h-4 text-[#008060] shrink-0" />
          <p className="text-sm text-[#008060] font-medium">{sentToast}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBox icon={Users} label="Abonn\u00e9s marketing" value={String(marketingCustomers.length)} />
        <StatBox icon={ShoppingCart} label="Paniers abandonn\u00e9s" value={String(carts.length)} />
        <StatBox icon={TrendingUp} label="Panier moyen" value={formatMoney(avgOrderValue, store.currency)} />
        <StatBox icon={Mail} label="Clients contactables" value={String(customers.filter((c) => c.email).length)} />
      </div>

      {/* Campaigns */}
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
                <span className="text-xs font-medium text-[#6D7175] bg-[#F4F4F4] px-3 py-1.5 rounded-full">{c.cta}</span>
              ) : c.id === 'abandoned' ? (
                <button onClick={() => sendAbandonedRecovery(carts[0])} disabled={!carts.length || sending} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#008060] px-3 py-1.5 rounded-full hover:bg-[#00694d] disabled:opacity-40">
                  {sending === carts[0]?.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} {c.cta}
                </button>
              ) : (
                <button onClick={sendNewsletter} disabled={!marketingCustomers.length || sending === 'newsletter'} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#008060] px-3 py-1.5 rounded-full hover:bg-[#00694d] disabled:opacity-40">
                  {sending === 'newsletter' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} {c.cta}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Abandoned carts list */}
      <div className="bg-white rounded-xl border border-[#E1E1E1] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-[#6D7175]" />
          <h2 className="text-sm font-bold text-[#202223]">Paniers abandonn\u00e9s \u00e0 relancer</h2>
        </div>
        {carts.length === 0 ? (
          <p className="text-sm text-[#6D7175] py-6 text-center">Aucun panier abandonn\u00e9. Bravo !</p>
        ) : (
          <div className="space-y-2">
            {carts.slice(0, 8).map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-[#F4F4F4] border border-[#E1E1E1]/50 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#202223] truncate">{(c.items || []).length} article(s) \u00b7 {formatMoney(c.total || 0, store.currency)}</p>
                  <p className="text-[11px] text-[#6D7175]">{c.customer_email || 'Client invit\u00e9'} \u00b7 {new Date(c.created_date).toLocaleDateString()}</p>
                </div>
                <button onClick={() => sendAbandonedRecovery(c)} disabled={sending === c.id} className="flex items-center gap-1.5 text-xs font-semibold text-[#008060] border border-[#008060]/40 rounded-full px-3 py-1.5 hover:bg-[#008060]/5 disabled:opacity-40 shrink-0">
                  {sending === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} Relancer
                </button>
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