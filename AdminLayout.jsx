import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  Search, Bell, ChevronDown, Home, ShoppingCart, Package, Users, TrendingUp,
  Tag, FileText, BarChart3, Store, Settings, Globe, Bot, Megaphone,
  FileBarChart, Zap, Calculator, UsersRound, MessageSquare, LayoutGrid, Palette,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    items: [
      { label: 'Accueil', to: '/dashboard', icon: Home, end: true },
    ],
  },
  {
    title: 'Vendre',
    items: [
      { label: 'Commandes', soon: true, icon: ShoppingCart },
      { label: 'Produits', soon: true, icon: Package },
      { label: 'Clients', soon: true, icon: Users },
      { label: 'Croissance', soon: true, icon: TrendingUp },
      { label: 'Réductions', soon: true, icon: Tag },
      { label: 'Contenu', soon: true, icon: FileText },
    ],
  },
  {
    title: 'Canaux de vente',
    items: [
      { label: 'Marchés', soon: true, icon: Globe },
      { label: 'Boutique en ligne', to: '/theme-editor', icon: Store },
      { label: 'Thèmes', to: '/theme-gallery', icon: Palette },
      { label: 'Analytics', to: '/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'IA & Croissance',
    items: [
      { label: 'Assistant IA', soon: true, icon: Bot },
      { label: 'Marketing', soon: true, icon: Megaphone },
      { label: 'Rapports', soon: true, icon: FileBarChart },
      { label: 'Automations', soon: true, icon: Zap },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { label: 'Comptabilité', soon: true, icon: Calculator },
      { label: 'Équipe', soon: true, icon: UsersRound },
      { label: 'Chat', soon: true, icon: MessageSquare },
    ],
  },
  {
    title: 'Système',
    items: [
      { label: 'Apps', soon: true, icon: LayoutGrid },
      { label: 'Paramètres', to: '/dashboard', icon: Settings },
    ],
  },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#F4F4F4] text-[#202223] flex flex-col">
      {/* Top bar */}
      <header className="h-[52px] bg-black text-white flex items-center px-4 gap-4 shrink-0">
        <Link to="/dashboard" className="font-bold text-lg tracking-tight">sellia</Link>
        <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-md px-3 py-1.5 w-80 max-w-full">
          <Search className="w-4 h-4 opacity-60" />
          <input
            placeholder="Rechercher"
            className="bg-transparent outline-none text-sm placeholder:text-white/50 w-full"
          />
          <kbd className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded">⌘K</kbd>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md">Voir en tant que</button>
          <Bell className="w-5 h-5 opacity-80" />
          <div className="flex items-center gap-1.5 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-[#008060] flex items-center justify-center text-xs font-bold">SM</div>
            <ChevronDown className="w-4 h-4 opacity-60" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-60 bg-[#F4F4F4] border-r border-[#E1E1E1] overflow-y-auto py-3 shrink-0 hidden md:block">
          {NAV_GROUPS.map((g, gi) => (
            <div key={gi} className="mb-1">
              {g.title && (
                <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-[#6D7175] uppercase tracking-wide">{g.title}</p>
              )}
              {g.items.map((item) =>
                item.to ? (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 mx-2 px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
                        isActive ? 'bg-white text-[#202223] font-medium shadow-sm' : 'text-[#202223] hover:bg-black/5'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 opacity-70" />
                    {item.label}
                  </NavLink>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    title="Bientôt disponible"
                    className="w-full flex items-center gap-2.5 mx-2 px-2.5 py-1.5 rounded-md text-[13px] text-[#6D7175] hover:bg-black/5 cursor-default"
                  >
                    <item.icon className="w-4 h-4 opacity-40" />
                    {item.label}
                  </button>
                )
              )}
            </div>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}