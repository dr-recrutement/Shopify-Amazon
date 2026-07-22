import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, DollarSign, Package, Users, TrendingUp, Plus, ArrowRight, Tag } from 'lucide-react';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader, Badge, Button } from './ui';

interface Order { id: string; customer_name: string | null; total_cents: number; status: string; created_at: string; }

export default function Home() {
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0, customers: 0 });
  const [recent, setRecent] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const [{ count: orders }, { count: products }, { count: customers }, { data: orderRows }] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        supabase.from('orders').select('id,customer_name,total_cents,status,created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(5),
      ]);
      const revenue = (orderRows || []).reduce((s: number, o: any) => s + Number(o.total_cents || 0), 0);
      setStats({ orders: orders || 0, revenue, products: products || 0, customers: customers || 0 });
      setRecent((orderRows as Order[]) || []);
      setLoading(false);
    })();
  }, [tenant]);

  const statCards = [
    { label: 'Commandes', value: stats.orders, icon: <ShoppingCart size={20} />, color: 'text-brand-600 bg-brand-50' },
    { label: 'Revenus', value: `${(stats.revenue / 100).toLocaleString('fr-FR')} F`, icon: <DollarSign size={20} />, color: 'text-green-600 bg-green-50' },
    { label: 'Produits', value: stats.products, icon: <Package size={20} />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Clients', value: stats.customers, icon: <Users size={20} />, color: 'text-purple-600 bg-purple-50' },
  ];

  const statusColor = (s: string) => (s === 'paid' ? 'green' : s === 'shipped' ? 'blue' : s === 'cancelled' ? 'red' : 'orange') as any;

  if (loading) return <div className="text-gray-400 text-sm">Chargement…</div>;

  return (
    <div>
      <PageHeader title="Tableau de bord" subtitle={`Bienvenue sur ${tenant?.name || 'votre boutique'}`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">{s.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Commandes récentes</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/orders')}>Voir tout <ArrowRight size={14} /></Button>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Aucune commande pour le moment</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100"><th className="pb-2 font-medium">Client</th><th className="pb-2 font-medium">Total</th><th className="pb-2 font-medium">Statut</th><th className="pb-2 font-medium">Date</th></tr></thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id} className="border-b border-gray-50">
                      <td className="py-2.5 font-medium text-gray-900">{o.customer_name || '—'}</td>
                      <td className="py-2.5 text-gray-900">{(o.total_cents / 100).toLocaleString('fr-FR')} F</td>
                      <td className="py-2.5"><Badge color={statusColor(o.status)}>{o.status}</Badge></td>
                      <td className="py-2.5 text-gray-500 text-xs">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div className="space-y-2">
            <button onClick={() => navigate('/dashboard/products')} className="flex items-center gap-3 w-full p-3 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors text-left">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><Plus size={16} /></div>
              <div><p className="text-sm font-medium text-gray-900">Ajouter un produit</p><p className="text-xs text-gray-400">Créer un nouveau produit</p></div>
            </button>
            <button onClick={() => navigate('/dashboard/discounts')} className="flex items-center gap-3 w-full p-3 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors text-left">
              <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center"><Tag size={16} /></div>
              <div><p className="text-sm font-medium text-gray-900">Créer une promo</p><p className="text-xs text-gray-400">Ajouter un code promo</p></div>
            </button>
            <button onClick={() => navigate('/dashboard/growth')} className="flex items-center gap-3 w-full p-3 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors text-left">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><TrendingUp size={16} /></div>
              <div><p className="text-sm font-medium text-gray-900">Croissance</p><p className="text-xs text-gray-400">Voir vos métriques</p></div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
