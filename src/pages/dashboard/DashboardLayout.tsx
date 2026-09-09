import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../lib/hooks';
import { signOut } from '../../lib/auth';
import { getOrders, getProducts, getCustomers } from '../../lib/app-state';
import { fetchCloudOrders, fetchCloudProducts, fetchCloudCustomers } from '../../lib/tenant-sync';
import {
  Home, ShoppingCart, Package, Users, TrendingUp, Tag, FileText, Globe,
  BarChart3, Store, Megaphone, Calculator, UserCog, MessageSquare,
  FileBarChart, Zap, Settings, Menu, X, LogOut, ChevronDown, Bell, Search, Grid3x3,
} from 'lucide-react';

const NAV = [
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
    {
      to: '/app/online-store', label: 'Online Store', icon: Store, end: false,
      children: [
        { to: '/app/online-store', label: 'Thèmes', end: true },
        { to: '/app/online-store/advanced', label: 'Réglages avancés', end: false },
      ],
    },
  ]},
  { group: 'Croissance', items: [
    { to: '/app/marketing', label: 'Marketing', icon: Megaphone },
    { to: '/app/accounting', label: 'Comptabilité', icon: Calculator },
    { to: '/app/team', label: 'Équipe', icon: UserCog },
    { to: '/app/chat', label: 'Chat', icon: MessageSquare },
    { to: '/app/reports', label: 'Reports', icon: FileBarChart },
    { to: '/app/automations', label: 'Automations', icon: Zap },
    { to: '/app/apps', label: 'Apps', icon: Grid3x3 },
    { to: '/app/settings', label: 'Paramètres', icon: Settings },
  ]},
];

export default function DashboardLayout() {
  const { user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);

  // Real global search — client-side over the merchant's own real
  // products/orders/customers (fetched once, cached), not a placeholder.
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchIndex, setSearchIndex] = useState<{
    products: Array<{ id: string; name: string }>;
    orders: Array<{ id: string; orderNumber?: string; customer: string }>;
    customers: Array<{ id: string; name: string; email: string }>;
  }>({ products: [], orders: [], customers: [] });

  useEffect(() => {
    setSearchIndex({
      products: getProducts().map(p => ({ id: p.id, name: p.name })),
      orders: getOrders().map(o => ({ id: o.id, orderNumber: o.orderNumber, customer: o.customer })),
      customers: getCustomers().map(c => ({ id: c.id, name: c.name, email: c.email })),
    });
    Promise.all([fetchCloudProducts(), fetchCloudOrders(), fetchCloudCustomers()]).then(([products, orders, customers]) => {
      setSearchIndex({
        products: (products || []).map(p => ({ id: p.id, name: p.name })),
        orders: (orders || []).map(o => ({ id: o.id, orderNumber: o.orderNumber, customer: o.customer })),
        customers: (customers || []).map(c => ({ id: c.id, name: c.name, email: c.email })),
      });
    });
  }, []);

  const q = searchQuery.trim().toLowerCase();
  const searchResults = q.length < 2 ? { products: [], orders: [], customers: [] } : {
    products: searchIndex.products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 5),
    orders: searchIndex.orders.filter(o => (o.orderNumber || o.id).toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)).slice(0, 5),
    customers: searchIndex.customers.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)).slice(0, 5),
  };
  const hasSearchResults = searchResults.products.length + searchResults.orders.length + searchResults.customers.length > 0;

  useEffect(() => {
    const count = () => setPendingOrderCount(getOrders().filter(o => o.status === 'pending').length);
    count();
    fetchCloudOrders().then(cloud => {
      if (cloud) setPendingOrderCount(cloud.filter(o => o.status === 'pending').length);
    });
  }, []);

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
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isInSection = location.pathname.startsWith(item.to);
                  return (
                    <div key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                      >
                        <Icon size={16} /> {item.label}
                      </NavLink>
                      {'children' in item && item.children && isInSection && (
                        <div className="ml-6 mt-0.5 mb-1 space-y-0.5 border-l border-gray-100 pl-3">
                          {item.children.map(child => (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              end={child.end}
                              onClick={() => setSidebarOpen(false)}
                              className={({ isActive }) => `block px-2 py-1.5 rounded-md text-xs font-medium transition-all ${isActive ? 'text-brand-700 font-bold' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                              {child.label}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
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
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              placeholder="Rechercher un produit, une commande, un client..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
            {searchOpen && q.length >= 2 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-lg max-h-80 overflow-y-auto z-30">
                {!hasSearchResults ? (
                  <p className="p-3 text-xs text-gray-400 text-center">Aucun résultat pour "{searchQuery}"</p>
                ) : (
                  <>
                    {searchResults.products.length > 0 && (
                      <div className="p-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1">Produits</p>
                        {searchResults.products.map(p => (
                          <button key={p.id} onClick={() => { nav('/app/products'); setSearchOpen(false); setSearchQuery(''); }} className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-sm text-gray-700">{p.name}</button>
                        ))}
                      </div>
                    )}
                    {searchResults.orders.length > 0 && (
                      <div className="p-2 border-t border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1">Commandes</p>
                        {searchResults.orders.map(o => (
                          <button key={o.id} onClick={() => { nav('/app/orders'); setSearchOpen(false); setSearchQuery(''); }} className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-sm text-gray-700">{o.orderNumber || o.id} — {o.customer}</button>
                        ))}
                      </div>
                    )}
                    {searchResults.customers.length > 0 && (
                      <div className="p-2 border-t border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1">Clients</p>
                        {searchResults.customers.map(c => (
                          <button key={c.id} onClick={() => { nav('/app/customers'); setSearchOpen(false); setSearchQuery(''); }} className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-sm text-gray-700">{c.name} — {c.email}</button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <button onClick={() => nav('/app/orders')} className="p-2 rounded-full hover:bg-gray-50 relative" title={pendingOrderCount > 0 ? `${pendingOrderCount} commande(s) en attente` : 'Aucune notification'}>
            <Bell size={18} className="text-gray-600" />
            {pendingOrderCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-brand-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">{pendingOrderCount}</span>
            )}
          </button>
          <div className="relative">
            <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center font-semibold text-brand-700 text-sm">
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
