import { useEffect, useState } from 'react';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader } from './ui';
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';

export default function Reports() {
  const { tenant } = useTenant();
  const [data, setData] = useState({ revenue: 0, orders: 0, customers: 0, avgOrder: 0 });
  const [monthly, setMonthly] = useState<{ month: string; revenue: number; orders: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const { data: orderRows } = await supabase.from('orders').select('total,created_at').eq('tenant_id', tenant.id);
      const { count: customers } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id);
      const orders = orderRows || [];
      const revenue = orders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
      setData({ revenue, orders: orders.length, customers: customers || 0, avgOrder: orders.length > 0 ? revenue / orders.length : 0 });

      const now = new Date();
      const months: { month: string; revenue: number; orders: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = d.toLocaleDateString('en', { month: 'short' });
        const monthOrders = orders.filter((o: any) => { const od = new Date(o.created_at); return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear(); });
        months.push({ month, revenue: monthOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0), orders: monthOrders.length });
      }
      setMonthly(months);
      setLoading(false);
    })();
  }, [tenant]);

  const cards = [
    { label: 'Revenue', value: `$${data.revenue.toFixed(0)}`, icon: <DollarSign size={18} />, color: 'text-green-600 bg-green-50' },
    { label: 'Orders', value: data.orders, icon: <ShoppingCart size={18} />, color: 'text-brand-600 bg-brand-50' },
    { label: 'Customers', value: data.customers, icon: <Users size={18} />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Avg Order', value: `$${data.avgOrder.toFixed(0)}`, icon: <TrendingUp size={18} />, color: 'text-purple-600 bg-purple-50' },
  ];

  if (loading) return <div className="text-gray-400 text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader title="Reports" subtitle="Monthly performance reports and summaries" />
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
        <h2 className="font-semibold text-gray-900 mb-4">Monthly Report</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-3 font-medium">Month</th><th className="pb-3 font-medium">Revenue</th><th className="pb-3 font-medium">Orders</th><th className="pb-3 font-medium">Avg Order</th>
            </tr></thead>
            <tbody>
              {monthly.map((m, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{m.month}</td>
                  <td className="py-3 text-gray-900">${m.revenue.toFixed(2)}</td>
                  <td className="py-3 text-gray-600">{m.orders}</td>
                  <td className="py-3 text-gray-600">${m.orders > 0 ? (m.revenue / m.orders).toFixed(2) : '0.00'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
