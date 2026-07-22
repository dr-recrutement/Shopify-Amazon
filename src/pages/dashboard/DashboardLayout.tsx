import { useState, ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Users, TrendingUp, Tag, Megaphone,
  FileText, Globe, BarChart3, Store, Bot, Calculator, UserCog, FileBarChart,
  Zap, Settings, Menu, X, LogOut,
} from 'lucide-react';
import { useAuth, useTenant } from '../../lib/hooks';

interface NavItem { to: string; label: string; icon: ReactNode; }

const main: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: <LayoutDashboard size={18} /> },
  { to: '/dashboard/orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
  { to: '/dashboard/products', label: 'Products', icon: <Package size={18} /> },
  { to: '/dashboard/customers', label: 'Customers', icon: <Users size={18} /> },
];
const growth: NavItem[] = [
  { to: '/dashboard/growth', label: 'Growth', icon: <TrendingUp size={18} /> },
  { to: '/dashboard/discounts', label: 'Discounts', icon: <Tag size={18} /> },
  { to: '/dashboard/marketing', label: 'Marketing', icon: <Megaphone size={18} /> },
  { to: '/dashboard/content', label: 'Content', icon: <FileText size={18} /> },
];
const settings: NavItem[] = [
  { to: '/dashboard/markets', label: 'Markets', icon: <Globe size={18} /> },
  { to: '/dashboard/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
  { to: '/dashboard/online-store', label: 'Online Store', icon: <Store size={18} /> },
  { to: '/dashboard/agentic', label: 'Agentic', icon: <Bot size={18} /> },
];
const bottom: NavItem[] = [
  { to: '/dashboard/comptabilite', label: 'Comptabilite', icon: <Calculator size={18} /> },
  { to: '/dashboard/team', label: 'Team', icon: <UserCog size={18} /> },
  { to: '/dashboard/reports', label: 'Reports', icon: <FileBarChart size={18} /> },
  { to: '/dashboard/automations', label: 'Automations', icon: <Zap size={18} /> },
  { to: '/dashboard/settings', label: 'Settings', icon: <Settings size={18} /> },
];

function NavGroup({ items, title }: { items: NavItem[]; title?: string }) {
  return (
    <div className="mb-4">
      {title && <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{title}</p>}
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/dashboard'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
              isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

export default function DashboardLayout() {
  const { tenant } = useTenant();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const sidebarContent = (
    <>
      <div className="px-4 py-5">
        <span className="text-lg font-bold text-gray-900 tracking-tight">{tenant?.name || 'Store'}</span>
      </div>
      <nav className="flex-1 px-2 overflow-y-auto">
        <NavGroup items={main} />
        <NavGroup items={growth} title="Growth" />
        <NavGroup items={settings} title="Settings" />
        <NavGroup items={bottom} />
      </nav>
      <div className="p-3 border-t border-gray-100">
        <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 w-full">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-60 bg-white border-r border-gray-200">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3">
        <span className="font-bold text-gray-900">{tenant?.name || 'Store'}</span>
        <button onClick={() => setMobileOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-white border-r border-gray-200 flex flex-col">
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="md:pl-60">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
