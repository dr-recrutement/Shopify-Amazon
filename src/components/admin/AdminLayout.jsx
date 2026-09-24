import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Bell, ChevronDown, Home, ShoppingCart, Package, Users, TrendingUp,
  Tag, FileText, BarChart3, Store, Settings as SettingsIcon, Globe, Bot, Megaphone,
  FileBarChart, Zap, Calculator, LayoutGrid, Palette,
  Star, Truck, Boxes, Image as ImageIcon, BookOpen, Menu, X, LogOut, User as UserIcon, ShieldCheck, Eye, Activity, Loader2, AlertCircle,
} from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { useAuth } from '@/lib/AuthContext';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { checkIsSuperAdmin } from '@/lib/superadmin';

const NAV_GROUPS = [
  {
    items: [
      { label: 'Accueil', to: '/dashboard', icon: Home, end: true },
    ],
  },
  {
    title: 'Vendre',
    items: [
      { label: 'Commandes', to: '/orders', icon: ShoppingCart, children: [
        { label: 'Récupération panier', to: '/abandoned-checkouts', icon: ShoppingCart },
      ] },
      { label: 'Produits', to: '/products', icon: Package },
      { label: 'Clients', to: '/customers', icon: Users },
      { label: 'Collections', to: '/collections', icon: LayoutGrid },
      { label: 'Avis clients', to: '/reviews', icon: Star },
      { label: 'Croissance', to: '/growth', icon: TrendingUp },
      { label: 'Réductions', to: '/discounts', icon: Tag },
      { label: 'Contenu', to: '/content', icon: FileText, children: [
        { label: 'Blog', to: '/blog', icon: BookOpen },
        { label: 'Médias', to: '/media-library', icon: ImageIcon },
      ] },
    ],
  },
  {
    title: 'Canaux de vente',
    items: [
      { label: 'Marchés', to: '/markets', icon: Globe },
      { label: 'Boutique en ligne', to: '/theme-editor', icon: Store, children: [
        { label: 'Thèmes', to: '/theme-gallery', icon: Palette },
      ] },
      { label: 'Domaines', to: '/domains', icon: Globe },
      { label: 'Analytics', to: '/analytics', icon: BarChart3 },
      { label: 'Aperçu boutique', to: '/store-preview', icon: Eye },
    ],
  },
  {
    title: 'IA & Croissance',
    items: [
      { label: 'Sellia Assistant', to: '/assistant-ia', icon: Bot },
      { label: 'Marketing', to: '/marketing', icon: Megaphone },
      { label: 'Rapports', to: '/reports', icon: FileBarChart },
      { label: 'Analyses produits', to: '/product-analytics', icon: TrendingUp },
      { label: 'Automations', to: '/automations', icon: Zap },
      { label: 'SEO IA', to: '/seo-ia', icon: Search },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { label: 'Comptabilité', to: '/accounting', icon: Calculator },
      { label: 'Inventaire', to: '/inventory', icon: Boxes },
      { label: 'Livraison', to: '/shipping-settings', icon: Truck },
    ],
  },
  {
    title: 'Système',
    items: [
      { label: 'Apps', to: '/apps', icon: LayoutGrid },
      { label: 'Activité', to: '/activity-logs', icon: Activity },
      { label: 'Paramètres', to: '/settings', icon: SettingsIcon },
    ],
  },
];

function NavItem({ item, onNavigate }) {
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  const childActive = hasChildren && item.children.some((c) => location.pathname.startsWith(c.to));
  const [open, setOpen] = useState(!!childActive);
  const expanded = open || childActive;
  return (
    <div className="mx-2">
      <div className="flex items-center">
        <NavLink
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 flex-1 px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
              isActive || childActive ? 'bg-white text-[#202223] font-medium shadow-sm' : 'text-[#202223] hover:bg-black/5'
            }`
          }
        >
          <item.icon className="w-4 h-4 opacity-70" />
          {item.label}
        </NavLink>
        {hasChildren && (
          <button onClick={() => setOpen((o) => !o)} className="p-1 rounded hover:bg-black/5 text-[#6D7175]">
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? '' : '-rotate-90'}`} />
          </button>
        )}
      </div>
      {hasChildren && expanded && (
        <div className="mt-0.5 ml-2 border-l border-[#E1E1E1]">
          {item.children.map((c) => (
            <NavLink
              key={c.label}
              to={c.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 ml-3 rounded-md text-[13px] transition-colors ${
                  isActive ? 'bg-white text-[#202223] font-medium shadow-sm' : 'text-[#6D7175] hover:bg-black/5'
                }`
              }
            >
              <c.icon className="w-4 h-4 opacity-60" />
              {c.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function NavContent({ onNavigate, superadmin }) {
  return (
    <>
      {NAV_GROUPS.map((g, gi) => (
        <div key={gi} className="mb-1">
          {g.title && (
            <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-[#6D7175] uppercase tracking-wide">{g.title}</p>
          )}
          {g.items.map((item) => (
            <NavItem key={item.label} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
      {superadmin && (
        <div className="mb-1">
          <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-[#6D7175] uppercase tracking-wide">Superadmin</p>
          <div className="mx-2">
            <NavLink to="/superadmin" onClick={onNavigate} className={({ isActive }) => `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] ${isActive ? 'bg-white text-[#202223] font-medium shadow-sm' : 'text-[#202223] hover:bg-black/5'}`}>
              <ShieldCheck className="w-4 h-4 opacity-70" /> Superadmin
            </NavLink>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [q, setQ] = useState('');
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { store, loading: storeLoading } = useCurrentStore();
  const [superadmin, setSuperadmin] = useState(false);
  const [superadminChecked, setSuperadminChecked] = useState(false);
  useEffect(() => {
    if (!user?.id) { setSuperadminChecked(true); return; }
    checkIsSuperAdmin(user.id).then((v) => { setSuperadmin(v); setSuperadminChecked(true); });
  }, [user?.id]);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Close every open overlay (drawer, dropdowns) on every route change - a
  // Link inside a page (not routed through NavContent's onNavigate, e.g. a
  // "Voir les commandes" link elsewhere) could otherwise leave the mobile
  // drawer or a dropdown open on top of the new page.
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  // Lock background scroll while the mobile drawer is open - without this,
  // a long nav list scrolls independently while the page underneath also
  // scrolls, a real double-scroll bug on mobile.
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileOpen]);

  // A logged-in user with no store yet (fresh signup, or one who bailed out
  // of onboarding before creating it) has nothing for any of these admin
  // pages to show - send them to set up their store first. Super admins are
  // exempt: they manage the whole platform, not one tenant, and have no
  // reason to be funneled through store creation at all.
  useEffect(() => {
    if (!storeLoading && superadminChecked && !superadmin && !store && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [storeLoading, superadminChecked, superadmin, store, location.pathname, navigate]);

  if (storeLoading || !superadminChecked || (!superadmin && !store && location.pathname !== '/onboarding')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F4F4]">
        <Loader2 className="w-6 h-6 animate-spin text-[#008060]" />
      </div>
    );
  }

  const displayName = user?.user_metadata?.full_name || user?.email || 'Utilisateur';
  const initials = displayName.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  const doLogout = () => { logout(); };
  const submitSearch = (e) => { e.preventDefault(); navigate(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : '/products'); };

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-[#202223] flex flex-col">
      {/* Top bar */}
      <header className="h-[52px] bg-black text-white flex items-center px-3 sm:px-4 gap-3 shrink-0 sticky top-0 z-30">
        <button onClick={() => setMobileOpen(true)} className="md:hidden p-1.5 rounded-md hover:bg-white/10 text-white">
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="bg-white rounded-md p-1 inline-flex items-center"><img src={BRAND.logo} alt="Sellia" className="h-6 w-6 object-contain" /></span>
          <span className="flex flex-col leading-none">
            <span className="font-bold text-base tracking-tight text-white">Sellia</span>
            <span className="text-[9px] font-medium text-white/55">by Liafrik</span>
          </span>
        </Link>
        <form onSubmit={submitSearch} className="hidden md:flex items-center gap-2 bg-white/10 rounded-md px-3 py-1.5 w-80 max-w-full">
          <Search className="w-4 h-4 opacity-60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit…"
            className="bg-transparent outline-none text-sm placeholder:text-white/50 w-full"
          />
          <kbd className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded">⏎</kbd>
        </form>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="relative" ref={notifRef}>
            <button onClick={() => setNotifOpen((o) => !o)} className="relative p-1.5 rounded-md hover:bg-white/10">
              <Bell className="w-5 h-5 opacity-80" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#2EE6A8]" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-[#E1E1E1] py-2 text-[#202223] z-50">
                <p className="px-4 py-2 text-xs font-bold uppercase text-[#6D7175]">Notifications</p>
                <div className="px-4 py-8 text-center">
                  <Bell className="w-7 h-7 text-[#C9C9C9] mx-auto mb-2" />
                  <p className="text-sm text-[#6D7175]">Aucune notification pour le moment.</p>
                </div>
                <Link to="/orders" onClick={() => setNotifOpen(false)} className="block px-4 py-2 text-xs font-semibold text-[#008060] hover:bg-black/5 border-t border-[#F4F4F4]">Voir les commandes</Link>
              </div>
            )}
          </div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-1.5 cursor-pointer p-1 rounded-md hover:bg-white/10">
              <div className="w-7 h-7 rounded-full bg-[#008060] flex items-center justify-center text-xs font-bold">{initials}</div>
              <ChevronDown className="w-4 h-4 opacity-60" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-2xl border border-[#E1E1E1] py-2 text-[#202223] z-50">
                <div className="px-4 py-2 border-b border-[#F4F4F4]">
                  <p className="text-sm font-bold truncate">{displayName}</p>
                  <p className="text-xs text-[#6D7175] truncate">{user?.email || ''}</p>
                </div>
                <Link to="/store-settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/5"><SettingsIcon className="w-4 h-4 opacity-60" /> Paramètres de la boutique</Link>
                <Link to="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/5"><UserIcon className="w-4 h-4 opacity-60" /> Mes paramètres</Link>
                <button onClick={doLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-[#F4F4F4]"><LogOut className="w-4 h-4" /> Déconnexion</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="w-60 bg-[#F4F4F4] border-r border-[#E1E1E1] overflow-y-auto py-3 shrink-0 hidden md:block">
          <NavContent superadmin={superadmin} />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <>
            <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setMobileOpen(false)} />
            <aside className="md:hidden fixed inset-y-0 left-0 w-72 max-w-[85%] bg-[#F4F4F4] border-r border-[#E1E1E1] overflow-y-auto py-3 z-50 shadow-2xl">
              <div className="flex items-center justify-between px-4 pb-2 mb-1 border-b border-[#E1E1E1]">
                <div className="flex items-center gap-2">
                  <img src={BRAND.logo} alt="Sellia" className="h-7 w-7 object-contain" />
                  <span className="font-bold text-sm text-[#202223]">Sellia</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-md hover:bg-black/5 text-[#6D7175]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <NavContent onNavigate={() => setMobileOpen(false)} superadmin={superadmin} />
            </aside>
          </>
        )}

        {/* Content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {store?.suspended_at && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span><strong>Boutique suspendue.</strong> {store.suspended_reason || 'Votre vitrine publique est actuellement indisponible pour vos clients.'} Contactez le support pour résoudre la situation.</span>
            </div>
          )}
          {!store?.suspended_at && store?.plan_status === 'trial' && store?.trial_ends_at && (() => {
            const daysLeft = Math.ceil((new Date(store.trial_ends_at) - new Date()) / 86400000);
            const expired = daysLeft <= 0;
            return (
              <div className={`border-b px-4 py-2.5 flex items-center gap-2 text-sm ${expired ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {expired
                    ? <><strong>Essai gratuit terminé.</strong> Votre vitrine publique est actuellement indisponible pour vos clients.</>
                    : <><strong>Essai gratuit</strong> — {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}.</>}{' '}
                  <Link to="/settings" className="underline font-medium">Choisir un plan</Link>
                </span>
              </div>
            );
          })()}
          {!store?.suspended_at && store?.plan_status !== 'trial' && store?.subscription_ends_at && (() => {
            const daysLeft = Math.ceil((new Date(store.subscription_ends_at) - new Date()) / 86400000);
            const expired = daysLeft <= 0;
            if (daysLeft > 7) return null;
            return (
              <div className={`border-b px-4 py-2.5 flex items-center gap-2 text-sm ${expired ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {expired
                    ? <><strong>Abonnement expiré.</strong> Votre vitrine publique est actuellement indisponible pour vos clients.</>
                    : <><strong>Abonnement</strong> — expire dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}.</>}{' '}
                  <Link to="/billing" className="underline font-medium">Renouveler</Link>
                </span>
              </div>
            );
          })()}
          <Outlet />
        </main>
      </div>
    </div>
  );
}