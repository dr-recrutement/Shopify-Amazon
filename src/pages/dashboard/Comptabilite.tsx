import { useEffect, useState } from 'react';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader, Badge } from './ui';
import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

interface OrderRow { id: string; order_number: string; total: number; status: string; created_at: string; }

export default function Comptabilite() {
  const { tenant } = useTenant();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    supabase.from('orders').select('id,order_number,total,status,created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false })
      .then(({ data }) => { setOrders((data as OrderRow[]) || []); setLoading(false); });
  }, [tenant]);

  const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0);
  const expenses = revenue * 0.3; // mock 30% cost ratio
  const net = revenue - expenses;
  const pending = orders.filter(o => o.status === 'pending').reduce((s, o) => s + Number(o.total), 0);

  const cards = [
    { label: 'Total Revenue', value: `$${revenue.toFixed(2)}`, icon: <DollarSign size={18} />, color: 'text-green-600 bg-green-50' },
    { label: 'Expenses', value: `$${expenses.toFixed(2)}`, icon: <TrendingDown size={18} />, color: 'text-red-600 bg-red-50' },
    { label: 'Net Profit', value: `$${net.toFixed(2)}`, icon: <TrendingUp size={18} />, color: 'text-brand-600 bg-brand-50' },
    { label: 'Pending', value: `$${pending.toFixed(2)}`, icon: <Wallet size={18} />, color: 'text-blue-600 bg-blue-50' },
  ];

  const statusColor = (s: string) => (s === 'paid' ? 'green' : s === 'shipped' ? 'blue' : s === 'cancelled' ? 'red' : 'orange') as any;

  if (loading) return <div className="text-gray-400 text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader title="Comptabilité" subtitle="Track your revenue, expenses and transactions" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">{c.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.color}`}>{c.icon}</div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Transactions</h2>
        {orders.length === 0 ? <p className="text-sm text-gray-400 py-8 text-center">No transactions yet</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Transaction</th><th className="pb-3 font-medium">Date</th><th className="pb-3 font-medium">Amount</th><th className="pb-3 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{o.order_number}</td>
                    <td className="py-3 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="py-3 text-gray-900">${Number(o.total).toFixed(2)}</td>
                    <td className="py-3"><Badge color={statusColor(o.status)}>{o.status}</Badge></td>
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
