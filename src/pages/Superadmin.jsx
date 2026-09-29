import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { checkIsSuperAdmin } from '@/lib/superadmin';
import SubscriptionManager from '@/components/superadmin/SubscriptionManager';
import IconLibraryManager from '@/components/superadmin/IconLibraryManager';
import CommunicationsManager from '@/components/superadmin/CommunicationsManager';
import CouponsOverview from '@/components/superadmin/CouponsOverview';
import AuditLogViewer from '@/components/superadmin/AuditLogViewer';
import MarketplaceModeration from '@/components/superadmin/MarketplaceModeration';
import PlatformAnalytics from '@/components/superadmin/PlatformAnalytics';
import PaymentsCommissions from '@/components/superadmin/PaymentsCommissions';
import PlatformPaymentProviders from '@/components/superadmin/PlatformPaymentProviders';
import HelpCenterVideoManager from '@/components/superadmin/HelpCenterVideoManager';
import CommandCenterManager from '@/components/superadmin/CommandCenterManager';
import { formatMoney } from '@/lib/world/currencies';
import {
  ShieldCheck, Loader2, Store, ShoppingCart, Package, Ban, CheckCircle2, ArrowLeft, RefreshCw, Lock,
  UserPlus, Trash2, Clock, Mail, LayoutGrid, Sparkles, Tag, MessageSquare, ScrollText, ShoppingBag,
  BarChart3, CreditCard, Wallet, PlayCircle, Radio,
} from 'lucide-react';

const SIDEBAR_GROUPS = [
  { label: 'Général', items: [
    { id: 'overview', label: "Vue d'ensemble", icon: LayoutGrid },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ] },
  { label: 'Boutiques & ventes', items: [
    { id: 'subscriptions', label: 'Abonnements', icon: Sparkles },
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  ] },
  { label: 'Paiements', items: [
    { id: 'payments', label: 'Commissions', icon: Wallet },
    { id: 'payment-providers', label: 'Fournisseurs de paiement', icon: CreditCard },
  ] },
  { label: 'Contenu & support', items: [
    { id: 'icons', label: "Bibliothèque d'icônes", icon: LayoutGrid },
    { id: 'help-video', label: 'Tutoriel vidéo', icon: PlayCircle },
    { id: 'comms', label: 'Communications', icon: MessageSquare },
  ] },
  { label: 'Système', items: [
    { id: 'audit', label: "Journal d'audit", icon: ScrollText },
    { id: 'command-center', label: 'Command Center', icon: Radio },
  ] },
];

const PLAN_LABELS = { starter: 'Starter', growth: 'Growth', pro: 'Pro', enterprise: 'Enterprise' };
const STATUS_STYLE = {
  active: 'bg-[#008060]/10 text-[#008060]', draft: 'bg-[#6D7175]/10 text-[#6D7175]',
  trial: 'bg-amber-500/10 text-amber-600', suspended: 'bg-red-500/10 text-red-600',
};

export default function Superadmin() {
  const { user } = useAuth();
  const [amSuperadmin, setAmSuperadmin] = useState(null); // null = checking
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('overview');
  const [busy, setBusy] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    checkIsSuperAdmin(user.id).then(setAmSuperadmin);
  }, [user?.id]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, o, p, a, i] = await Promise.all([
        supabase.from('tenants').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('products').select('id').limit(1000),
        supabase.from('super_admins').select('*').order('promoted_at', { ascending: true }),
        supabase.from('super_admin_invites').select('*').order('created_at', { ascending: true }),
      ]);
      setStores(s.data || []);
      setOrders(o.data || []);
      setProducts(p.data || []);
      setAdmins(a.data || []);
      setInvites(i.data || []);
    } catch (e) {
      console.error('Superadmin load failed:', e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (amSuperadmin) load(); }, [amSuperadmin, load]);

  const toggleStore = async (s) => {
    setBusy(s.id);
    try {
      const next = s.status === 'suspended' ? 'trial' : 'suspended';
      // Routed through the same audited RPC as the Abonnements tab, instead
      // of a plain update - this action is now logged (who, when, old/new
      // status) instead of being the one super-admin action that silently
      // wasn't.
      const { error } = await supabase.rpc('super_admin_update_subscription', {
        p_tenant_id: s.id,
        p_action: next === 'suspended' ? 'suspend' : 'reactivate',
        p_status: next,
        p_suspended_reason: next === 'suspended' ? 'Suspendu depuis la vue d’ensemble' : null,
      });
      if (error) throw error;
      setStores((l) => l.map((x) => (x.id === s.id ? { ...x, status: next } : x)));
    } catch (e) {
      alert(e.message || "Échec de l'action");
    } finally { setBusy(null); }
  };

  const activeAdminCount = admins.filter((a) => a.status === 'active').length;

  const inviteAdmin = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setInviting(true); setInviteMsg('');
    try {
      const { error } = await supabase.from('super_admin_invites').insert({ email, invited_by: user.id });
      if (error && error.code !== '23505') throw error; // 23505 = already invited, fine
      setInviteEmail('');
      setInviteMsg(`Invitation enregistrée pour ${email}. Le compte sera promu automatiquement à sa prochaine connexion (ou immédiatement s'il est déjà connecté ailleurs).`);
      await load();
    } catch (e) {
      setInviteMsg(e.message || "Échec de l'invitation");
    } finally { setInviting(false); }
  };

  const cancelInvite = async (email) => {
    if (!confirm(`Annuler l'invitation pour ${email} ?`)) return;
    const { error } = await supabase.from('super_admin_invites').delete().eq('email', email);
    if (error) { alert(error.message); return; }
    await load();
  };

  const removeAdmin = async (a) => {
    if (activeAdminCount <= 2) {
      alert('Impossible : au moins 2 super admins actifs doivent rester en place.');
      return;
    }
    if (!confirm(`Retirer les droits super admin de ${a.email} ?`)) return;
    setBusy(a.id);
    try {
      const { error } = await supabase.from('super_admins').delete().eq('id', a.id);
      if (error) throw error;
      await load();
    } catch (e) {
      alert(e.message || 'Échec — la protection des 2 derniers super admins a peut-être bloqué cette action.');
    } finally { setBusy(null); }
  };

  if (amSuperadmin === null) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  if (!amSuperadmin) {
    return (
      <div className="max-w-md mx-auto mt-24 text-center px-4">
        <Lock className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Accès refusé</h1>
        <p className="text-sm text-[#6D7175] mt-1">Le module Superadmin est réservé aux administrateurs de la plateforme.</p>
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-[#008060] hover:underline"><ArrowLeft className="w-4 h-4" /> Retour au tableau de bord</Link>
      </div>
    );
  }

  const paidOrders = orders.filter((o) => ['paid', 'processing', 'fulfilled', 'shipped', 'delivered'].includes(o.status));
  const recentOrders = orders.slice(0, 8);

  return (
    <div className="min-h-full bg-[#F4F4F4]">
      <div className="sticky top-0 z-10 bg-black text-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <ShieldCheck className="w-5 h-5 text-[#2EE6A8] shrink-0" />
          <div className="min-w-0">
            <h1 className="text-base font-bold flex items-center gap-2">Superadmin <span className="text-[10px] font-bold bg-[#2EE6A8]/20 text-[#2EE6A8] px-2 py-0.5 rounded-full">Accès plateforme</span></h1>
            <p className="text-xs text-white/60 truncate">Vue consolidée — toutes les boutiques, sans restriction</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/10 shrink-0"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> <span className="hidden sm:inline">Actualiser</span></button>
      </div>

      <div className="px-4 sm:px-6 py-5 max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Store, label: 'Boutiques', value: stores.length, color: 'text-[#008060]' },
            { icon: ShoppingCart, label: 'Commandes', value: orders.length, color: 'text-purple-600' },
            { icon: Package, label: 'Produits', value: products.length, color: 'text-amber-600' },
            { icon: CheckCircle2, label: 'Commandes payées', value: paidOrders.length, color: 'text-[#008060]' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-[#E1E1E1] p-4">
              <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
              <p className="text-2xl font-bold text-[#202223]">{s.value}</p>
              <p className="text-xs text-[#6D7175]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Navigation + content: a sidebar instead of a 12-item horizontal
            tab bar, which had no wrap/scroll and was overflowing the
            page on any real screen width - especially now, with the
            payment-providers tab this session just added making it
            worse. Grouped into logical sections, matching how a real
            admin panel with this many areas is organized (Shopify's own
            Settings, for one), rather than one long flat row. */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          <nav className="w-full lg:w-56 shrink-0 bg-white rounded-xl border border-[#E1E1E1] p-2 lg:sticky lg:top-20">
            {SIDEBAR_GROUPS.map((group) => (
              <div key={group.label} className="mb-1 last:mb-0">
                <p className="px-2.5 pt-2.5 pb-1 text-[10px] font-bold text-[#6D7175] uppercase tracking-wide">{group.label}</p>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-left transition ${tab === item.id ? 'bg-[#008060]/10 text-[#008060]' : 'text-[#42474B] hover:bg-[#F4F4F4]'}`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="flex-1 min-w-0 space-y-6 w-full">
        {tab === 'subscriptions' ? <SubscriptionManager /> : tab === 'icons' ? <IconLibraryManager /> : tab === 'coupons' ? <CouponsOverview /> : tab === 'comms' ? <CommunicationsManager /> : tab === 'audit' ? <AuditLogViewer /> : tab === 'marketplace' ? <MarketplaceModeration /> : tab === 'analytics' ? <PlatformAnalytics /> : tab === 'payments' ? <PaymentsCommissions /> : tab === 'payment-providers' ? <PlatformPaymentProviders /> : tab === 'help-video' ? <HelpCenterVideoManager /> : tab === 'command-center' ? <CommandCenterManager /> : (
        <>
        {/* Super admins */}
        <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E1E1E1] flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#2EE6A8]" /><h2 className="text-sm font-bold text-[#202223]">Super admins</h2></div>
          <div className="px-4 py-3 border-b border-[#F4F4F4] bg-[#FAFAFA]">
            <div className="flex flex-col sm:flex-row gap-2">
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" placeholder="email@exemple.com" className="flex-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" />
              <button onClick={inviteAdmin} disabled={inviting || !inviteEmail.trim()} className="flex items-center justify-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#00694d] disabled:opacity-40"><UserPlus className="w-4 h-4" /> Ajouter</button>
            </div>
            {inviteMsg && <p className="text-xs text-[#6D7175] mt-2">{inviteMsg}</p>}
          </div>
          <div className="divide-y divide-[#F0F0F0]">
            {admins.filter((a) => a.status === 'active').map((a) => (
              <div key={a.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0"><ShieldCheck className="w-4 h-4 text-[#2EE6A8] shrink-0" /><span className="text-sm font-medium text-[#202223] truncate">{a.email}</span>{a.user_id === user?.id && <span className="text-[10px] font-bold text-[#6D7175]">(vous)</span>}</div>
                <button onClick={() => removeAdmin(a)} disabled={busy === a.id || activeAdminCount <= 2} title={activeAdminCount <= 2 ? 'Au moins 2 super admins doivent rester actifs' : 'Retirer'} className="p-1.5 rounded-md text-[#6D7175] hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {invites.map((i) => (
              <div key={i.email} className="px-4 py-2.5 flex items-center justify-between gap-3 bg-amber-50/50">
                <div className="flex items-center gap-2 min-w-0"><Clock className="w-4 h-4 text-amber-600 shrink-0" /><span className="text-sm font-medium text-[#202223] truncate">{i.email}</span><span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> En attente</span></div>
                <button onClick={() => cancelInvite(i.email)} className="p-1.5 rounded-md text-[#6D7175] hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <p className="px-4 py-2.5 text-[11px] text-[#6D7175] border-t border-[#F0F0F0]">Au moins 2 super admins actifs doivent toujours rester en place — le retrait est bloqué en dessous de ce seuil.</p>
        </div>

        {/* Stores */}
        <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E1E1E1] flex items-center gap-2"><Store className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Boutiques</h2></div>
          {loading ? <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-[#008060] mx-auto" /></div> : stores.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#6D7175]">Aucune boutique.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F4F4F4] text-left text-xs text-[#6D7175]"><tr><th className="px-4 py-2.5 font-semibold">Boutique</th><th className="px-4 py-2.5 font-semibold">Pays</th><th className="px-4 py-2.5 font-semibold">Plan</th><th className="px-4 py-2.5 font-semibold">Statut</th><th className="px-4 py-2.5 font-semibold text-right">Action</th></tr></thead>
                <tbody>
                  {stores.map((s) => (
                    <tr key={s.id} className="border-t border-[#E1E1E1] hover:bg-[#F4F4F4]">
                      <td className="px-4 py-2.5"><p className="font-medium text-[#202223]">{s.name}</p></td>
                      <td className="px-4 py-2.5 text-[#6D7175]">{s.country || '—'}</td>
                      <td className="px-4 py-2.5"><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F4F4F4] text-[#202223]">{PLAN_LABELS[s.plan] || s.plan || '—'}</span></td>
                      <td className="px-4 py-2.5"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[s.status] || 'bg-[#F4F4F4] text-[#6D7175]'}`}>{s.status || '—'}</span></td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => toggleStore(s)} disabled={busy === s.id} className={`text-xs font-semibold px-2.5 py-1.5 rounded-md disabled:opacity-40 ${s.status === 'suspended' ? 'bg-[#008060]/10 text-[#008060] hover:bg-[#008060]/20' : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'}`}>
                          {busy === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : s.status === 'suspended' ? <CheckCircle2 className="w-3.5 h-3.5 inline" /> : <Ban className="w-3.5 h-3.5 inline" />} {s.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E1E1E1] flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-purple-600" /><h2 className="text-sm font-bold text-[#202223]">Commandes récentes</h2></div>
          {loading ? <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-[#008060] mx-auto" /></div> : recentOrders.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#6D7175]">Aucune commande.</p>
          ) : (
            <div className="divide-y divide-[#E1E1E1]">
              {recentOrders.map((o) => (
                <div key={o.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0"><p className="font-medium text-[#202223] truncate">{o.order_number || o.id.slice(0, 8)}</p><p className="text-[11px] text-[#6D7175]">Boutique : {stores.find((s) => s.id === o.tenant_id)?.name || o.tenant_id?.slice(0, 6) || '—'}</p></div>
                  <div className="text-right shrink-0"><p className="font-semibold text-[#202223]">{formatMoney((o.total_cents || 0) / 100, o.currency)}</p><p className="text-[11px] text-[#6D7175]">{o.status}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
        </>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
