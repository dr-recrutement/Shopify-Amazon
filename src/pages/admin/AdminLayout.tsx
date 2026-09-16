import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../lib/hooks';
import { signOut } from '../../lib/auth';
import {
  LayoutDashboard, Store, Users, CreditCard, Palette, FileText, Shield,
  Settings, BarChart3, Menu, X, LogOut, AlertTriangle, Crown, Sun, Moon
} from 'lucide-react';

const NAV = [
  { to: '/admin', label: 'Vue globale', icon: LayoutDashboard, end: true },
  { to: '/admin/stores', label: 'Boutiques', icon: Store },
  { to: '/admin/users', label: 'Utilisateurs', icon: Users },
  { to: '/admin/billing', label: 'Facturation SaaS', icon: CreditCard },
  { to: '/admin/themes', label: 'Thèmes', icon: Palette },
  { to: '/admin/content', label: 'CMS Plateforme', icon: FileText },
  { to: '/admin/moderation', label: 'Modération', icon: Shield },
  { to: '/admin/analytics', label: 'Statistiques', icon: BarChart3 },
  { to: '/admin/super-admins', label: 'Super Admins', icon: Crown },
  { to: '/admin/audit', label: 'Audit & Logs', icon: AlertTriangle },
  { to: '/admin/settings', label: 'Configuration', icon: Settings },
];

const ADMIN_THEME_KEY = 'sellia_admin_theme';

export default function AdminLayout() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(() => localStorage.getItem(ADMIN_THEME_KEY) === 'light');
  const logout = async () => { await signOut(); nav('/'); };

  useEffect(() => {
    localStorage.setItem(ADMIN_THEME_KEY, light ? 'light' : 'dark');
  }, [light]);

  return (
    <div className={light ? 'min-h-screen bg-gray-50 text-gray-900 flex' : 'min-h-screen bg-gray-900 text-gray-100 flex'}>
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-60 flex flex-col transition-transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${light ? 'bg-white border-r border-gray-200' : 'bg-gray-950 border-r border-gray-800'}`}>
        <div className={`h-16 flex items-center px-5 border-b ${light ? 'border-gray-200' : 'border-gray-800'}`}>
          <Logo white={!light} />
        </div>
        <div className="px-4 py-2">
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium ${light ? 'bg-brand-50 text-brand-700' : 'bg-brand-900/30 text-brand-400'}`}>
            <Crown size={14} /> Master Console
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-3 space-y-0.5">
          {NAV.map(item => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-brand-600 text-white' : light ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <Icon size={16} /> {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className={`p-3 border-t ${light ? 'border-gray-200' : 'border-gray-800'}`}>
          <div className={`text-xs mb-2 truncate ${light ? 'text-gray-500' : 'text-gray-500'}`}>{user?.email}</div>
          <button onClick={logout} className={`w-full text-left px-3 py-2 rounded-full text-sm flex items-center gap-2 ${light ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex-1 min-w-0">
        <header className={`sticky top-0 z-20 h-16 flex items-center px-4 sm:px-6 gap-3 ${light ? 'bg-white border-b border-gray-200' : 'bg-gray-950 border-b border-gray-800'}`}>
          <button className={`lg:hidden p-2 ${light ? 'text-gray-500' : 'text-gray-400'}`} onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className={`text-sm ${light ? 'text-gray-500' : 'text-gray-400'}`}>LiAfrik — Sellia Master Console</div>
          <button
            onClick={() => setLight(l => !l)}
            title={light ? 'Passer en thème sombre' : 'Passer en thème jour'}
            className={`ml-auto p-2 rounded-lg transition-colors ${light ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            {light ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <div className={`text-xs ${light ? 'text-gray-400' : 'text-gray-500'}`}>{new Date().toLocaleDateString('fr-FR')}</div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
