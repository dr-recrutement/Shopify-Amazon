import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../lib/hooks';
import { signOut } from '../../lib/auth';
import {
  LayoutDashboard, Store, Users, CreditCard, Palette, FileText, Shield,
  Settings, BarChart3, Menu, X, LogOut, AlertTriangle, Crown, Tag, UsersRound, TrendingUp
} from 'lucide-react';

const NAV = [
  { to: '/admin', label: 'Vue globale', icon: LayoutDashboard, end: true },
  { to: '/admin/stores', label: 'Boutiques', icon: Store },
  { to: '/admin/users', label: 'Utilisateurs', icon: Users },
  { to: '/admin/billing', label: 'Facturation SaaS', icon: CreditCard },
  { to: '/admin/commercial-codes', label: 'Codes commerciaux', icon: Tag },
  { to: '/admin/custom-roles', label: 'Rôles & Staff', icon: UsersRound },
  { to: '/admin/staff-performance', label: 'Performance Staff', icon: TrendingUp },
  { to: '/admin/themes', label: 'Thèmes', icon: Palette },
  { to: '/admin/content', label: 'CMS Plateforme', icon: FileText },
  { to: '/admin/moderation', label: 'Modération', icon: Shield },
  { to: '/admin/analytics', label: 'Statistiques', icon: BarChart3 },
  { to: '/admin/super-admins', label: 'Super Admins', icon: Crown },
  { to: '/admin/audit', label: 'Audit & Logs', icon: AlertTriangle },
  { to: '/admin/settings', label: 'Configuration', icon: Settings },
];

export default function AdminLayout() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const logout = async () => { await signOut(); nav('/'); };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-60 bg-gray-950 border-r border-gray-800 flex flex-col transition-transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center px-5 border-b border-gray-800">
          <Logo white />
        </div>
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 px-2 py-1.5 bg-orange-900/30 text-orange-400 rounded-lg text-xs font-medium">
            <Crown size={14} /> Master Console
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-3 space-y-0.5">
          {NAV.map(item => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <Icon size={16} /> {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-2 truncate">{user?.email}</div>
          <button onClick={logout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white flex items-center gap-2">
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-gray-950 border-b border-gray-800 flex items-center px-4 sm:px-6 gap-3">
          <button className="lg:hidden p-2 text-gray-400" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="text-sm text-gray-400">LIYAH GROUP — LiAfrikOS Master Console</div>
          <div className="ml-auto text-xs text-gray-500">{new Date().toLocaleDateString('fr-FR')}</div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
