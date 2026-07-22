import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Users, Palette, Globe, BarChart3, FileText, Settings, Menu, X, LogOut, Shield, Check, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/hooks';
import { Card, Button, Badge, Modal, Input } from '../dashboard/ui';

interface NavItem { to: string; label: string; icon: React.ReactNode }
const navItems: NavItem[] = [
  { to: '/admin', label: 'Vue d\'ensemble', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/tenants', label: 'Boutiques', icon: <Store size={18} /> },
  { to: '/admin/themes', label: 'Thèmes', icon: <Palette size={18} /> },
  { to: '/admin/users', label: 'Utilisateurs', icon: <Users size={18} /> },
  { to: '/admin/platform-analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
  { to: '/admin/content', label: 'Contenu', icon: <FileText size={18} /> },
  { to: '/admin/settings', label: 'Paramètres', icon: <Settings size={18} /> },
];

export default function SuperAdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const sidebar = (
    <>
      <div className="px-4 py-5">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-brand-500" />
          <span className="text-lg font-bold text-gray-900 tracking-tight">LiAfrikOS Admin</span>
        </div>
      </div>
      <nav className="flex-1 px-2 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/admin'} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 ${isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {item.icon} {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 w-full"><LogOut size={18} /> Déconnexion</button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-60 bg-white border-r border-gray-200">{sidebar}</aside>
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-3">
        <span className="font-bold text-gray-900">LiAfrikOS Admin</span>
        <button onClick={() => setMobileOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"><Menu size={20} /></button>
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-white border-r border-gray-200 flex flex-col">
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="md:pl-60">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6"><Outlet /></main>
      </div>
    </div>
  );
}

// ============ Super Admin Pages ============

export function SuperAdminOverview() {
  const [stats, setStats] = useState({ tenants: 0, products: 0, orders: 0, revenue: 0 });

  useEffect(() => {
    (async () => {
      const [{ count: tenants }, { count: products }, { count: orders }] = await Promise.all([
        supabase.from('tenants').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
      ]);
      setStats({ tenants: tenants || 0, products: products || 0, orders: orders || 0, revenue: 0 });
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Vue d'ensemble</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Boutiques', value: stats.tenants, color: 'text-brand-600' },
          { label: 'Produits', value: stats.products, color: 'text-blue-600' },
          { label: 'Commandes', value: stats.orders, color: 'text-green-600' },
          { label: 'Revenus', value: '0 XOF', color: 'text-purple-600' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SuperAdminTenants() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('tenants').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setTenants(data || []); setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Boutiques</h1>
      <Card className="p-5">
        {loading ? <p className="text-gray-400 text-sm text-center py-4">Chargement…</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Nom</th><th className="pb-3 font-medium">Secteur</th><th className="pb-3 font-medium">Pays</th><th className="pb-3 font-medium">Plan</th><th className="pb-3 font-medium">Statut</th>
              </tr></thead>
              <tbody>
                {tenants.map(t => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{t.name}</td>
                    <td className="py-3 text-gray-600">{t.sector || '—'}</td>
                    <td className="py-3 text-gray-600">{t.country || '—'}</td>
                    <td className="py-3"><Badge color="blue">{t.plan}</Badge></td>
                    <td className="py-3"><Badge color={t.status === 'active' ? 'green' : 'orange'}>{t.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export function SuperAdminThemes() {
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'ecommerce', description: '', is_premium: false, price_cents: 0 });

  const load = useCallback(() => {
    supabase.from('theme_store_themes').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setThemes(data || []); setLoading(false);
    });
  }, []);

  useEffect(load, [load]);

  const create = async () => {
    await supabase.from('theme_store_themes').insert({ ...form, is_published: true });
    setModal(false); setForm({ name: '', category: 'ecommerce', description: '', is_premium: false, price_cents: 0 });
    load();
  };

  const togglePublish = async (id: string, published: boolean) => {
    await supabase.from('theme_store_themes').update({ is_published: !published }).eq('id', id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('theme_store_themes').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Thèmes</h1>
        <Button onClick={() => setModal(true)}><Plus size={16} /> Nouveau thème</Button>
      </div>
      <Card className="p-5">
        {loading ? <p className="text-gray-400 text-sm text-center py-4">Chargement…</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Nom</th><th className="pb-3 font-medium">Catégorie</th><th className="pb-3 font-medium">Premium</th><th className="pb-3 font-medium">Prix</th><th className="pb-3 font-medium">Publié</th><th className="pb-3 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {themes.map(t => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{t.name}</td>
                    <td className="py-3 text-gray-600">{t.category}</td>
                    <td className="py-3">{t.is_premium ? <Badge color="orange">Premium</Badge> : <Badge color="green">Gratuit</Badge>}</td>
                    <td className="py-3 text-gray-600">{t.price_cents ? `${t.price_cents / 100} $` : '—'}</td>
                    <td className="py-3"><Badge color={t.is_published ? 'green' : 'gray'}>{t.is_published ? 'Oui' : 'Non'}</Badge></td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button onClick={() => togglePublish(t.id, t.is_published)} className="p-1 text-gray-400 hover:text-brand-600">{t.is_published ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                        <button onClick={() => remove(t.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="Nouveau thème">
        <div className="space-y-3">
          <Input label="Nom" value={form.name} onChange={v => setForm({ ...form, name: v })} />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400">
              <option value="ecommerce">E-commerce</option><option value="landing">Landing</option><option value="business">Business</option><option value="marketplace">Marketplace</option>
            </select>
          </div>
          <Input label="Description" value={form.description} onChange={v => setForm({ ...form, description: v })} />
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_premium} onChange={e => setForm({ ...form, is_premium: e.target.checked })} className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Thème premium</span></label>
          {form.is_premium && <Input label="Prix (cents)" type="number" value={String(form.price_cents)} onChange={v => setForm({ ...form, price_cents: Number(v) || 0 })} />}
          <div className="flex gap-2 justify-end pt-2"><Button variant="secondary" onClick={() => setModal(false)}>Annuler</Button><Button onClick={create} disabled={!form.name}>Créer</Button></div>
        </div>
      </Modal>
    </div>
  );
}

export function SuperAdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('tenants').select('id, name, owner_id, plan, status, created_at').order('created_at', { ascending: false }).then(({ data }) => {
      setUsers(data || []); setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Utilisateurs</h1>
      <Card className="p-5">
        {loading ? <p className="text-gray-400 text-sm text-center py-4">Chargement…</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Boutique</th><th className="pb-3 font-medium">Plan</th><th className="pb-3 font-medium">Statut</th><th className="pb-3 font-medium">Date</th>
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="py-3"><Badge color="blue">{u.plan}</Badge></td>
                    <td className="py-3"><Badge color={u.status === 'active' ? 'green' : 'orange'}>{u.status}</Badge></td>
                    <td className="py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export function SuperAdminAnalytics() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics plateforme</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Boutiques actives', value: '—', color: 'text-brand-600' },
          { label: 'Commandes totales', value: '—', color: 'text-green-600' },
          { label: 'Taux de conversion', value: '—', color: 'text-blue-600' },
          { label: 'Revenus plateforme', value: '—', color: 'text-purple-600' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <p className="text-sm text-gray-500 text-center py-8">Analytics détaillés en cours de configuration.</p>
      </Card>
    </div>
  );
}

export function SuperAdminContent() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Contenu plateforme</h1>
      <Card className="p-5">
        <p className="text-sm text-gray-500 text-center py-8">Gestion du contenu en cours de configuration.</p>
      </Card>
    </div>
  );
}

export function SuperAdminSettings() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres plateforme</h1>
      <Card className="p-5 space-y-4">
        <Input label="Nom de la plateforme" value="LiAfrikOS" onChange={() => {}} />
        <Input label="Email support" value="" onChange={() => {}} placeholder="support@liafrikos.com" />
        <Button variant="secondary"><Check size={14} /> Sauvegarder</Button>
      </Card>
    </div>
  );
}
