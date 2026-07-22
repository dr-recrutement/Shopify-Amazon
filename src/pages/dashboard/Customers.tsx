import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader } from './ui';

interface Customer { id: string; name: string; email: string; phone: string | null; orders_count: number; total_spent: number; }

export default function Customers() {
  const { tenant } = useTenant();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    supabase.from('customers').select('id,name,email,phone,orders_count,total_spent').eq('tenant_id', tenant.id).order('name')
      .then(({ data }) => { setCustomers((data as Customer[]) || []); setFiltered((data as Customer[]) || []); setLoading(false); });
  }, [tenant]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(customers.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)));
  }, [search, customers]);

  return (
    <div>
      <PageHeader title="Customers" subtitle="View and manage your customer base" />
      <Card className="p-5">
        <div className="relative mb-4 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" />
        </div>
        {loading ? <div className="text-gray-400 text-sm py-8 text-center">Loading…</div> : filtered.length === 0 ? (
          <div className="text-center py-12"><Users size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No customers found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Name</th><th className="pb-3 font-medium">Email</th><th className="pb-3 font-medium">Phone</th>
                <th className="pb-3 font-medium">Orders</th><th className="pb-3 font-medium">Total Spent</th>
              </tr></thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="py-3 text-gray-600">{c.email}</td>
                    <td className="py-3 text-gray-600">{c.phone || '—'}</td>
                    <td className="py-3 text-gray-900">{c.orders_count || 0}</td>
                    <td className="py-3 text-gray-900">${Number(c.total_spent || 0).toFixed(2)}</td>
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
