import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader, Badge, Input } from './ui';

interface Order { id: string; order_number: string; customer_name: string | null; total: number; status: string; created_at: string; }

export default function Orders() {
  const { tenant } = useTenant();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtered, setFiltered] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    supabase.from('orders').select('id,order_number,customer_name,total,status,created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false })
      .then(({ data }) => { setOrders((data as Order[]) || []); setFiltered((data as Order[]) || []); setLoading(false); });
  }, [tenant]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(orders.filter(o => o.order_number.toLowerCase().includes(q) || (o.customer_name || '').toLowerCase().includes(q)));
  }, [search, orders]);

  const statusColor = (s: string) => (s === 'paid' ? 'green' : s === 'shipped' ? 'blue' : s === 'cancelled' ? 'red' : 'orange') as any;

  return (
    <div>
      <PageHeader title="Orders" subtitle="Manage and track all your store orders" />
      <Card className="p-5">
        <div className="relative mb-4 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" />
        </div>
        {loading ? <div className="text-gray-400 text-sm py-8 text-center">Loading…</div> : filtered.length === 0 ? (
          <div className="text-center py-12"><p className="text-sm text-gray-400">No orders found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Order #</th><th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Total</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Date</th>
              </tr></thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{o.order_number}</td>
                    <td className="py-3 text-gray-600">{o.customer_name || '—'}</td>
                    <td className="py-3 text-gray-900">${Number(o.total).toFixed(2)}</td>
                    <td className="py-3"><Badge color={statusColor(o.status)}>{o.status}</Badge></td>
                    <td className="py-3 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
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
