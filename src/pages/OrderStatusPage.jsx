import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Package, Check, Truck, Home, XCircle, Search } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import ThemeRenderer from '@/components/theme/ThemeRenderer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { cloneTheme, DEFAULT_THEME_ID, isValidTheme, migrateTheme } from '@/lib/themes';
import { applySEO } from '@/lib/seo';
import { formatMoney } from '@/lib/world/currencies';
import { getOrderStatus } from '@/lib/storefrontApi';

// Customer-facing order tracking (Shopify's "order status page"). Reachable
// by full order link (/store/:slug/order/:id - the uuid is the secret) or by
// order number + e-mail on /store/:slug/order. Shows only non-sensitive data
// (no address, phone or e-mail) - see storefront_order_status().
const STEPS = [
  { key: 'received', label: 'Commande reçue', icon: Package },
  { key: 'paid', label: 'Paiement confirmé', icon: Check },
  { key: 'shipped', label: 'Expédiée', icon: Truck },
  { key: 'delivered', label: 'Livrée', icon: Home },
];
const STEP_INDEX = { pending: 0, paid: 1, processing: 1, fulfilled: 2, shipped: 2, delivered: 3 };
const LABEL = { pending: 'En attente de paiement', paid: 'Payée', processing: 'En préparation', fulfilled: 'Préparée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée', refunded: 'Remboursée' };

export default function OrderStatusPage() {
  const { slug, id } = useParams();
  const [store, setStore] = useState(null);
  const [theme, setTheme] = useState(() => cloneTheme(DEFAULT_THEME_ID));
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ref, setRef] = useState('');
  const [email, setEmail] = useState('');
  const [lookupMsg, setLookupMsg] = useState('');
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const { data: tenant, error: tenantError } = await supabase.from('public_tenants').select('*').eq('slug', slug).maybeSingle();
      if (tenantError) throw tenantError;
      if (!tenant) throw new Error('Cette boutique n’existe pas.');
      setStore(tenant);
      const { data: themeRes } = await supabase.from('theme_configs').select('published_config').eq('tenant_id', tenant.id).maybeSingle();
      setTheme(isValidTheme(themeRes?.published_config) ? migrateTheme(themeRes.published_config) : cloneTheme(DEFAULT_THEME_ID));
      if (id) {
        const o = await getOrderStatus(tenant.id, id);
        setOrder(o);
        if (!o) setLookupMsg('Commande introuvable.');
      }
      setError(null);
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally { setLoading(false); }
  }, [slug, id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!store) return;
    applySEO({ title: `Suivi de commande — ${store.name}`, description: `Suivez votre commande chez ${store.name}.`, url: window.location.href, countryCode: store.country, favicon: theme.favicon });
  }, [store, theme]);

  const search = async (e) => {
    e.preventDefault();
    if (!store) return;
    setSearching(true); setLookupMsg('');
    try {
      const o = await getOrderStatus(store.id, ref, email);
      if (!o) setLookupMsg('Aucune commande ne correspond à ce numéro et cet e-mail.');
      setOrder(o);
    } catch (err) { setLookupMsg(err.message || 'Erreur'); } finally { setSearching(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-[#008060]" /></div>;
  if (error) return (
    <div className="max-w-md mx-auto mt-24 text-center px-4">
      <AlertCircle className="w-10 h-10 text-[#6D7175] mx-auto mb-3" />
      <h1 className="text-lg font-bold text-[#202223]">{error}</h1>
      <Link to={`/store/${slug}`} className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full mt-4">Retour à la boutique</Link>
    </div>
  );
  if (!store) return null;

  const p = theme.palette;
  const cancelled = order && (order.status === 'cancelled' || order.status === 'refunded');
  const stepIdx = order ? (STEP_INDEX[order.status] ?? 0) : 0;
  const money = (cents) => formatMoney((cents || 0) / 100, order?.currency || store.currency);
  const subtotal = order ? (order.items || []).reduce((s, i) => s + i.price_cents * i.quantity, 0) : 0;

  return (
    <div className="min-h-screen" style={{ background: p.bg, color: p.text, fontFamily: theme.fonts?.body }}>
      {theme.customCss && <style>{theme.customCss}</style>}
      <ErrorBoundary fallback={
        <header className="flex items-center px-5 sm:px-8 py-4 border-b" style={{ borderColor: p.border }}>
          <Link to={`/store/${slug}`} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: p.dark }}><ArrowLeft className="w-4 h-4" /> {store.name}</Link>
        </header>
      }>
        <ThemeRenderer theme={theme} sections={theme.sections.filter((s) => s.type === 'header')} mode="storefront" storeSlug={slug} tenantId={store.id} />
      </ErrorBoundary>

      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>Suivi de commande</h1>

        {!order && (
          <form onSubmit={search} className="mt-6 rounded-2xl p-5 space-y-3" style={{ background: p.surface, border: `1px solid ${p.border}` }}>
            <p className="text-sm" style={{ color: p.muted }}>Entrez le numéro de commande reçu après votre achat et l'e-mail utilisé.</p>
            <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Numéro de commande (ex. #A1B2C3D4)" required className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none" style={{ borderColor: p.border, background: p.bg, color: p.text }} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail de la commande" required className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none" style={{ borderColor: p.border, background: p.bg, color: p.text }} />
            <button disabled={searching} className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-full disabled:opacity-50" style={{ background: p.primary, color: p.primaryText || '#fff' }}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Suivre ma commande
            </button>
            {lookupMsg && <p className="text-xs text-red-600">{lookupMsg}</p>}
          </form>
        )}

        {order && (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl p-5" style={{ background: p.surface, border: `1px solid ${p.border}` }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs" style={{ color: p.muted }}>Commande</p>
                  <p className="text-lg font-bold" style={{ color: p.dark }}>{order.number}</p>
                  <p className="text-xs mt-0.5" style={{ color: p.muted }}>{new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: cancelled ? '#FEE2E2' : `${p.primary}22`, color: cancelled ? '#B91C1C' : p.primary }}>{LABEL[order.status] || order.status}</span>
              </div>

              {cancelled ? (
                <div className="flex items-center gap-2 mt-5 text-sm" style={{ color: '#B91C1C' }}><XCircle className="w-5 h-5" /> Cette commande a été {order.status === 'refunded' ? 'remboursée' : 'annulée'}.</div>
              ) : (
                <ol className="mt-6 grid grid-cols-4 gap-2">
                  {STEPS.map((s, i) => {
                    const done = i <= stepIdx; const Icon = s.icon;
                    return (
                      <li key={s.key} className="flex flex-col items-center text-center">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: done ? p.primary : p.border, color: done ? (p.primaryText || '#fff') : p.muted }}><Icon className="w-4 h-4" /></div>
                        <span className="text-[11px] mt-1.5 leading-tight" style={{ color: done ? p.text : p.muted }}>{s.label}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
              {order.tracking_number && !cancelled && (
                <p className="text-sm mt-5 rounded-lg px-3 py-2" style={{ background: p.bg, border: `1px solid ${p.border}` }}>Numéro de suivi transporteur : <strong>{order.tracking_number}</strong></p>
              )}
              {order.shipping_city && <p className="text-xs mt-3" style={{ color: p.muted }}>Livraison à : {order.shipping_city}</p>}
            </div>

            <div className="rounded-2xl p-5" style={{ background: p.surface, border: `1px solid ${p.border}` }}>
              <h2 className="text-sm font-bold mb-3" style={{ color: p.dark }}>Articles</h2>
              <ul className="divide-y" style={{ borderColor: p.border }}>
                {(order.items || []).map((i, idx) => (
                  <li key={idx} className="flex justify-between py-2 text-sm" style={{ borderColor: p.border }}>
                    <span>{i.name} <span style={{ color: p.muted }}>× {i.quantity}</span></span>
                    <span className="font-medium">{money(i.price_cents * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 pt-3 space-y-1 text-sm border-t" style={{ borderColor: p.border }}>
                <div className="flex justify-between"><dt style={{ color: p.muted }}>Sous-total</dt><dd>{money(subtotal)}</dd></div>
                {order.discount_amount_cents > 0 && <div className="flex justify-between"><dt style={{ color: p.muted }}>Remise</dt><dd>-{money(order.discount_amount_cents)}</dd></div>}
                <div className="flex justify-between"><dt style={{ color: p.muted }}>Livraison</dt><dd>{order.shipping_cost_cents > 0 ? money(order.shipping_cost_cents) : 'Gratuite'}</dd></div>
                <div className="flex justify-between font-bold pt-1"><dt>Total</dt><dd>{money(order.total_cents)}</dd></div>
              </dl>
            </div>
          </div>
        )}

        <div className="mt-8"><Link to={`/store/${slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: p.primary }}><ArrowLeft className="w-4 h-4" /> Retour à la boutique</Link></div>
      </div>
    </div>
  );
}
