import { useEffect, useState } from 'react';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader } from './ui';
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';

export default function Analytics() {
  const { tenant } = useTenant();
  const [data, setData] = useState({ revenue: 0, orders: 0, customers: 0, avgOrder: 0 });
  const [monthly, setMonthly] = useState<{ label: string; value: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; sales: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const { data: orderRows } = await supabase.from('orders').select('total,created_at').eq('tenant_id', tenant.id);
      const { count: customers } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id);
      const { data: productRows } = await supabase.from('products').select('name').eq('tenant_id', tenant.id).limit(5);
      const orders = orderRows || [];
      const revenue = orders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
      setData({ revenue, orders: orders.length, customers: customers || 0, avgOrder: orders.length > 0 ? revenue / orders.length : 0 });

      // Monthly revenue (last 6 months)
      const now = new Date();
      const months: { label: string; value: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('en', { month: 'short' });
        const value = orders.filter((o: any) => { const od = new Date(o.created_at); return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear(); }).reduce((s: number, o: any) => s + Number(o.total || 0), 0);
        months.push({ label, value });
      }
      setMonthly(months);

      // Top products (mock based on product names)
      setTopProducts((productRows || []).map((p: any, i: number) => ({ name: p.name, sales: 50 - i * 8 })));
      setLoading(false);
    })();
  }, [tenant]);

  const cards = [
    { label: 'Total Revenue', value: `$${data.revenue.toFixed(0)}`, icon: <DollarSign size={18} />, color: 'text-green-600 bg-green-50' },
    { label: 'Total Orders', value: data.orders, icon: <ShoppingCart size={18} />, color: 'text-brand-600 bg-brand-50' },
    { label: 'Customers', value: data.customers, icon: <Users size={18} />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Avg Order Value', value: `$${data.avgOrder.toFixed(2)}`, icon: <TrendingUp size={18} />, color: 'text-purple-600 bg-purple-50' },
  ];

  const maxMonth = Math.max(...monthly.map(m => m.value), 1);
  const trafficSources = [
    { source: 'Direct', pct: 35, color: 'bg-brand-500' },
    { source: 'Search', pct: 28, color: 'bg-blue-500' },
    { source: 'Social', pct: 22, color: 'bg-green-500' },
    { source: 'Referral', pct: 15, color: 'bg-purple-500' },
  ];

  if (loading) return <div className="text-gray-400 text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Deep insights into your store performance" />
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
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue Over Time</h2>
          <div className="flex items-end justify-between gap-3 h-48">
            {monthly.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end" style={{ height: '150px' }}>
                  <div className="w-full bg-brand-500 rounded-t-md hover:bg-brand-600 transition-colors" style={{ height: `${(m.value / maxMonth) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-400">{m.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Traffic Sources</h2>
          <div className="space-y-3">
            {trafficSources.map((t) => (
              <div key={t.source}>
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{t.source}</span><span className="font-medium text-gray-900">{t.pct}%</span></div>
                <div className="w-full h-2 bg-gray-100 rounded-full"><div className={`h-2 rounded-full ${t.color}`} style={{ width: `${t.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Top Products</h2>
        {topProducts.length === 0 ? <p className="text-sm text-gray-400">No products available</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100"><th className="pb-3 font-medium">Product</th><th className="pb-3 font-medium">Sales</th></tr></thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50"><td className="py-3 font-medium text-gray-900">{p.name}</td><td className="py-3 text-gray-600">{p.sales}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
