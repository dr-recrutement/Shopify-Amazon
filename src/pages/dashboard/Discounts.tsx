import { useEffect, useState } from 'react';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader, Badge, Button, Input, Modal } from './ui';
import { Plus, Tag } from 'lucide-react';

interface Discount { id: string; code: string; discount_type: string; value: number; min_amount: number | null; max_uses: number | null; uses: number; active: boolean; }

export default function Discounts() {
  const { tenant } = useTenant();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ code: '', discount_type: 'percent', value: '', min_amount: '', max_uses: '' });

  const load = () => {
    if (!tenant) return;
    supabase.from('discount_codes').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false })
      .then(({ data }) => { setDiscounts((data as Discount[]) || []); setLoading(false); });
  };
  useEffect(load, [tenant]);

  const create = async () => {
    if (!tenant || !form.code) return;
    await supabase.from('discount_codes').insert({
      tenant_id: tenant.id, code: form.code.toUpperCase(), discount_type: form.discount_type,
      value: Number(form.value) || 0, min_amount: form.min_amount ? Number(form.min_amount) : null,
      max_uses: form.max_uses ? Number(form.max_uses) : null, uses: 0, active: true,
    });
    setModal(false); setForm({ code: '', discount_type: 'percent', value: '', min_amount: '', max_uses: '' });
    load();
  };

  const toggle = async (d: Discount) => {
    await supabase.from('discount_codes').update({ active: !d.active }).eq('id', d.id);
    load();
  };

  return (
    <div>
      <PageHeader title="Discounts" subtitle="Create and manage discount codes" action={<Button onClick={() => setModal(true)}><Plus size={16} /> New Code</Button>} />
      <Card className="p-5">
        {loading ? <div className="text-gray-400 text-sm py-8 text-center">Loading…</div> : discounts.length === 0 ? (
          <div className="text-center py-12"><Tag size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No discount codes yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Code</th><th className="pb-3 font-medium">Type</th><th className="pb-3 font-medium">Value</th>
                <th className="pb-3 font-medium">Min Amount</th><th className="pb-3 font-medium">Uses</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium"></th>
              </tr></thead>
              <tbody>
                {discounts.map((d) => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-mono font-medium text-gray-900">{d.code}</td>
                    <td className="py-3 text-gray-600">{d.discount_type}</td>
                    <td className="py-3 text-gray-900">{d.discount_type === 'percent' ? `${d.value}%` : `$${d.value}`}</td>
                    <td className="py-3 text-gray-600">{d.min_amount ? `$${d.min_amount}` : '—'}</td>
                    <td className="py-3 text-gray-600">{d.uses}/{d.max_uses || '∞'}</td>
                    <td className="py-3"><Badge color={d.active ? 'green' : 'gray'}>{d.active ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="py-3"><Button variant="ghost" size="sm" onClick={() => toggle(d)}>{d.active ? 'Disable' : 'Enable'}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="Create Discount Code">
        <div className="space-y-4">
          <Input label="Code" value={form.code} onChange={v => setForm({ ...form, code: v })} placeholder="SUMMER20" />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400">
              <option value="percent">Percentage</option><option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <Input label="Value" type="number" value={form.value} onChange={v => setForm({ ...form, value: v })} placeholder="20" />
          <Input label="Min Amount (optional)" type="number" value={form.min_amount} onChange={v => setForm({ ...form, min_amount: v })} placeholder="50" />
          <Input label="Max Uses (optional)" type="number" value={form.max_uses} onChange={v => setForm({ ...form, max_uses: v })} placeholder="100" />
          <div className="flex gap-2 justify-end pt-2"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={create} disabled={!form.code}>Create</Button></div>
        </div>
      </Modal>
    </div>
  );
}
