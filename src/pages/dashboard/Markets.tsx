import { useEffect, useState } from 'react';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader, Button, Input, Modal, Badge } from './ui';
import { Plus, Globe } from 'lucide-react';

interface Market { id: string; country: string; currency: string; language: string; active: boolean; }

export default function Markets() {
  const { tenant } = useTenant();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ country: '', currency: 'USD', language: 'English' });

  const load = () => {
    if (!tenant) return;
    supabase.from('markets').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false })
      .then(({ data }) => { setMarkets((data as Market[]) || []); setLoading(false); });
  };
  useEffect(load, [tenant]);

  const create = async () => {
    if (!tenant || !form.country) return;
    await supabase.from('markets').insert({ tenant_id: tenant.id, country: form.country, currency: form.currency, language: form.language, active: true });
    setModal(false); setForm({ country: '', currency: 'USD', language: 'English' }); load();
  };

  const toggle = async (m: Market) => { await supabase.from('markets').update({ active: !m.active }).eq('id', m.id); load(); };

  return (
    <div>
      <PageHeader title="Markets" subtitle="Manage your international markets" action={<Button onClick={() => setModal(true)}><Plus size={16} /> Add Market</Button>} />
      <Card className="p-5">
        {loading ? <div className="text-gray-400 text-sm py-8 text-center">Loading…</div> : markets.length === 0 ? (
          <div className="text-center py-12"><Globe size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No markets configured yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Country</th><th className="pb-3 font-medium">Currency</th><th className="pb-3 font-medium">Language</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium"></th>
              </tr></thead>
              <tbody>
                {markets.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{m.country}</td>
                    <td className="py-3 text-gray-600">{m.currency}</td>
                    <td className="py-3 text-gray-600">{m.language}</td>
                    <td className="py-3"><Badge color={m.active ? 'green' : 'gray'}>{m.active ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="py-3"><Button variant="ghost" size="sm" onClick={() => toggle(m)}>{m.active ? 'Disable' : 'Enable'}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="Add Market">
        <div className="space-y-4">
          <Input label="Country" value={form.country} onChange={v => setForm({ ...form, country: v })} placeholder="United States" />
          <Input label="Currency" value={form.currency} onChange={v => setForm({ ...form, currency: v })} placeholder="USD" />
          <Input label="Language" value={form.language} onChange={v => setForm({ ...form, language: v })} placeholder="English" />
          <div className="flex gap-2 justify-end pt-2"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={create} disabled={!form.country}>Create</Button></div>
        </div>
      </Modal>
    </div>
  );
}
