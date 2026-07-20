import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Badge, Button, EmptyState, Table } from './ui';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { ShoppingCart, X, Eye } from 'lucide-react';

type Order = {
  id: string; customer_email: string | null; customer_name: string | null;
  total_cents: number; currency: string; status: string; tracking_number: string | null;
  shipping_address: string | null; shipping_cost_cents: number; discount_code: string | null;
  created_at: string;
};

const statusColors: any = { pending: 'orange', paid: 'green', shipped: 'blue', delivered: 'gray', cancelled: 'red' };
const statusLabels: any = { pending: 'En attente', paid: 'Payée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée' };

export default function Orders() {
  const { tenant } = useTenant();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewing, setViewing] = useState<Order | null>(null);
  const [items, setItems] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!tenant) return;
    const { data } = await supabase.from('orders').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }, [tenant]);

  useEffect(() => { if (tenant) load(); }, [tenant, load]);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const view = async (o: Order) => {
    setViewing(o);
    const { data } = await supabase.from('order_items').select('*').eq('order_id', o.id);
    setItems(data || []);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    setViewing(null); load();
  };

  const fmt = (cents: number, currency: string) => `${(cents / 100).toLocaleString('fr-FR')} ${currency}`;

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <PageHeader title="Commandes" subtitle="Gérez toutes vos commandes." />
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { id: 'all', label: 'Toutes' }, { id: 'pending', label: 'En attente' },
          { id: 'paid', label: 'Payées' }, { id: 'shipped', label: 'Expédiées' },
          { id: 'delivered', label: 'Livrées' }, { id: 'cancelled', label: 'Annulées' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f.id ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}>{f.label}</button>
        ))}
      </div>
      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Aucune commande" desc="Vos commandes apparaîtront ici dès qu'un client passera commande." />
        ) : (
          <Table headers={['Date', 'Client', 'Total', 'Paiement/Livraison', 'Statut', '']}>
            {filtered.map(o => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-500">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{o.customer_name || o.customer_email || 'Client'}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{fmt(o.total_cents, o.currency)}</td>
                <td className="py-3 px-4 text-gray-500">{o.shipping_address ? o.shipping_address.slice(0, 30) : '—'}</td>
                <td className="py-3 px-4"><Badge color={statusColors[o.status]}>{statusLabels[o.status] || o.status}</Badge></td>
                <td className="py-3 px-4"><button onClick={() => view(o)} className="text-orange-600 text-sm font-medium hover:underline flex items-center gap-1"><Eye size={12} /> Voir</button></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Commande du {new Date(viewing.created_at).toLocaleDateString('fr-FR')}</h3>
              <button onClick={() => setViewing(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-500">Client:</span> <span className="font-medium">{viewing.customer_name || '—'}</span></div>
                <div><span className="text-gray-500">Email:</span> <span className="font-medium">{viewing.customer_email || '—'}</span></div>
                <div><span className="text-gray-500">Total:</span> <span className="font-medium">{fmt(viewing.total_cents, viewing.currency)}</span></div>
                <div><span className="text-gray-500">Livraison:</span> <span className="font-medium">{fmt(viewing.shipping_cost_cents || 0, viewing.currency)}</span></div>
                <div><span className="text-gray-500">Adresse:</span> <span className="font-medium">{viewing.shipping_address || '—'}</span></div>
                <div><span className="text-gray-500">Code promo:</span> <span className="font-medium">{viewing.discount_code || '—'}</span></div>
                <div><span className="text-gray-500">Suivi:</span> <span className="font-medium">{viewing.tracking_number || '—'}</span></div>
                <div><span className="text-gray-500">Statut:</span> <Badge color={statusColors[viewing.status]}>{statusLabels[viewing.status] as React.ReactNode}</Badge></div>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <h4 className="font-medium mb-2">Articles</h4>
                {items.length === 0 ? <p className="text-gray-400 text-xs">Aucun article enregistré.</p> : (
                  <div className="space-y-1">
                    {items.map(it => (
                      <div key={it.id} className="flex justify-between text-xs">
                        <span>{it.product_name} × {it.quantity}</span>
                        <span className="font-medium">{fmt(it.price_cents * it.quantity, viewing.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-gray-100">
                <h4 className="font-medium mb-2">Changer le statut</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusLabels).map(([k, label]) => (
                    <button key={k} onClick={() => updateStatus(viewing.id, k)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${viewing.status === k ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{label as string}</button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
