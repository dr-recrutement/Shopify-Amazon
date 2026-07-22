import { useEffect, useState } from 'react';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader } from './ui';
import { TrendingUp, Users, Eye, ShoppingCart } from 'lucide-react';

export default function Growth() {
  const { tenant } = useTenant();
  const [metrics, setMetrics] = useState({ visitors: 0, conversion: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const { count: orders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id);
      const { data: orderRows } = await supabase.from('orders').select('total').eq('tenant_id', tenant.id);
      const revenue = (orderRows || []).reduce((s: number, o: any) => s + Number(o.total || 0), 0);
      const visitors = 1000 + (orders || 0) * 15;
      const conversion = visitors > 0 ? ((orders || 0) / visitors) * 100 : 0;
      setMetrics({ visitors, conversion: Number(conversion.toFixed(1)), orders: orders || 0, revenue });
      setLoading(false);
    })();
  }, [tenant]);

  const cards = [
    { label: 'Visitors', value: metrics.visitors.toLocaleString(), icon: <Eye size={18} />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Conversion Rate', value: `${metrics.conversion}%`, icon: <TrendingUp size={18} />, color: 'text-brand-600 bg-brand-50' },
    { label: 'Orders', value: metrics.orders, icon: <ShoppingCart size={18} />, color: 'text-green-600 bg-green-50' },
    { label: 'Revenue', value: `$${metrics.revenue.toFixed(0)}`, icon: <Users size={18} />, color: 'text-purple-600 bg-purple-50' },
  ];

  const bars = [
    { label: 'Mon', value: 45 }, { label: 'Tue', value: 62 }, { label: 'Wed', value: 38 },
    { label: 'Thu', value: 75 }, { label: 'Fri', value: 90 }, { label: 'Sat', value: 55 }, { label: 'Sun', value: 42 },
  ];
  const maxBar = Math.max(...bars.map(b => b.value));

  if (loading) return <div className="text-gray-400 text-sm">Loading…</div>;

  return (
    <div>
      <PageHeader title="Growth" subtitle="Track your store performance and growth metrics" />
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
        <h2 className="font-semibold text-gray-900 mb-4">Weekly Traffic</h2>
        <div className="flex items-end justify-between gap-2 h-48">
          {bars.map((b) => (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end" style={{ height: '150px' }}>
                <div className="w-full bg-brand-500 rounded-t-md transition-all hover:bg-brand-600" style={{ height: `${(b.value / maxBar) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-400">{b.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
