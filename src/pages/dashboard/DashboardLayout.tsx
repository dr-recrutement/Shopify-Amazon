import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../lib/hooks';
import { signOut } from '../../lib/auth';
import {
  Home, ShoppingCart, Package, Users, TrendingUp, Tag, FileText, Globe,
  BarChart3, Bot, Store, Megaphone, Calculator, UserCog, MessageSquare,
  FileBarChart, Zap, Settings, Menu, X, LogOut, ChevronDown, Bell, Search, Shield
} from 'lucide-react';

type NavItem = { to: string; label: string; icon: any; end?: boolean; superAdminOnly?: boolean };

const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Vendre', items: [
    { to: '/app', label: 'Home', icon: Home, end: true },
    { to: '/app/orders', label: 'Orders', icon: ShoppingCart },
    { to: '/app/products', label: 'Products', icon: Package },
    { to: '/app/customers', label: 'Customers', icon: Users },
    { to: '/app/growth', label: 'Growth', icon: TrendingUp },
    { to: '/app/discounts', label: 'Discounts', icon: Tag },
  ]},
  { group: 'Contenu', items: [
    { to: '/app/content', label: 'Content', icon: FileText },
    { to: '/app/markets', label: 'Markets', icon: Globe },
    { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/app/agentic', label: 'Agentic', icon: Bot },
    { to: '/app/online-store', label: 'Online Store', icon: Store },
  ]},
  { group: 'Croissance', items: [
    { to: '/app/marketing', label: 'Marketing', icon: Megaphone },
    { to: '/app/accounting', label: 'Comptabilité', icon: Calculator },
    { to: '/app/team', label: 'Équipe', icon: UserCog },
    { to: '/app/chat', label: 'Chat', icon: MessageSquare },
    { to: '/app/reports', label: 'Reports', icon: FileBarChart },
    { to: '/app/automations', label: 'Automations', icon: Zap },
    { to: '/app/settings', label: 'Paramètres', icon: Settings },
  ]},
  { group: 'Administration', items: [
    { to: '/admin', label: 'Super Admin', icon: Shield, superAdminOnly: true },
  ]},
];

export default function DashboardLayout() {
  const { user, isSuperAdmin } = useAuth();
  const nav = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const logout = async () => { await signOut(); nav('/'); };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center px-5 border-b border-gray-100 flex-shrink-0">
          <Logo />
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-6">
          {NAV.map(section => (
            <div key={section.group}>
              <div className="px-3 mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">{section.group}</div>
              <div className="space-y-0.5">
                {section.items.filter(item => !item.superAdminOnly || isSuperAdmin).map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      <Icon size={16} /> {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center px-4 sm:px-6 gap-3">
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1 max-w-md relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Rechercher..." className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-gray-200" />
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-50 relative">
            <Bell size={18} className="text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
          </button>
          <div className="relative">
            <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-semibold text-orange-700 text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'V'}
              </div>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {userMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-100 shadow-lg z-20 py-1">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900 truncate">{user?.email}</div>
                    <div className="text-xs text-gray-500">Vendeur</div>
                  </div>
                  <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <LogOut size={14} /> Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
