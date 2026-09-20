import { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import {
  Search, Bell, ChevronDown, Home, ShoppingCart, Package, Users, TrendingUp,
  Tag, FileText, BarChart3, Store, Settings as SettingsIcon, Globe, Bot, Megaphone,
  FileBarChart, Zap, Calculator, LayoutGrid, Palette,
  Star, Truck, Boxes, Image as ImageIcon, BookOpen, Menu, X,
} from 'lucide-react';
import { BRAND } from '@/lib/brand';

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
    ],
  },
  {
    title: 'IA & Croissance',
    items: [
      { label: 'Assistant IA', to: '/assistant-ia', icon: Bot },
      { label: 'Marketing', to: '/marketing', icon: Megaphone },
      { label: 'Rapports', to: '/reports', icon: FileBarChart },
      { label: 'Analyses produits', to: '/product-analytics', icon: TrendingUp },
      { label: 'Automations', to: '/automations', icon: Zap },
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
              isActive ? 'bg-white text-[#202223] font-medium shadow-sm' : 'text-[#202223] hover:bg-black/5'
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

function NavContent({ onNavigate }) {
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
    </>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-[#202223] flex flex-col">
      {/* Top bar */}
      <header className="h-[52px] bg-black text-white flex items-center px-3 sm:px-4 gap-3 shrink-0 sticky top-0 z-30">
        <button onClick={() => setMobileOpen(true)} className="md:hidden p-1.5 rounded-md hover:bg-white/10 text-white">
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <img src={BRAND.logo} alt="Sellia" className="h-8 w-8 object-contain" />
          <span className="flex flex-col leading-none">
            <span className="font-bold text-base tracking-tight text-white">Sellia</span>
            <span className="text-[9px] font-medium text-white/55">by Liafrik</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-md px-3 py-1.5 w-80 max-w-full">
          <Search className="w-4 h-4 opacity-60" />
          <input
            placeholder="Rechercher"
            className="bg-transparent outline-none text-sm placeholder:text-white/50 w-full"
          />
          <kbd className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded">⌘K</kbd>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Bell className="w-5 h-5 opacity-80" />
          <div className="flex items-center gap-1.5 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-[#008060] flex items-center justify-center text-xs font-bold">SM</div>
            <ChevronDown className="w-4 h-4 opacity-60" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="w-60 bg-[#F4F4F4] border-r border-[#E1E1E1] overflow-y-auto py-3 shrink-0 hidden md:block">
          <NavContent />
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
              <NavContent onNavigate={() => setMobileOpen(false)} />
            </aside>
          </>
        )}

        {/* Content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}