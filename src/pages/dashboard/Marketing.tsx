import { useEffect, useState } from 'react';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader, Button, Input, Modal, Badge } from './ui';
import { Plus, Megaphone } from 'lucide-react';

interface Campaign { id: string; name: string; channel: string; audience: string; status: string; }

export default function Marketing() {
  const { tenant } = useTenant();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', channel: 'email', audience: 'all' });

  const load = () => {
    if (!tenant) return;
    supabase.from('marketing_campaigns').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false })
      .then(({ data }) => { setCampaigns((data as Campaign[]) || []); setLoading(false); });
  };
  useEffect(load, [tenant]);

  const create = async () => {
    if (!tenant || !form.name) return;
    await supabase.from('marketing_campaigns').insert({ tenant_id: tenant.id, name: form.name, channel: form.channel, audience: form.audience, status: 'draft' });
    setModal(false); setForm({ name: '', channel: 'email', audience: 'all' }); load();
  };

  const statusColor = (s: string) => (s === 'active' ? 'green' : s === 'completed' ? 'blue' : 'gray') as any;

  return (
    <div>
      <PageHeader title="Marketing" subtitle="Create and manage your marketing campaigns" action={<Button onClick={() => setModal(true)}><Plus size={16} /> New Campaign</Button>} />
      <Card className="p-5">
        {loading ? <div className="text-gray-400 text-sm py-8 text-center">Loading…</div> : campaigns.length === 0 ? (
          <div className="text-center py-12"><Megaphone size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No campaigns yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Name</th><th className="pb-3 font-medium">Channel</th><th className="pb-3 font-medium">Audience</th><th className="pb-3 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="py-3 text-gray-600 capitalize">{c.channel}</td>
                    <td className="py-3 text-gray-600 capitalize">{c.audience}</td>
                    <td className="py-3"><Badge color={statusColor(c.status)}>{c.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="New Campaign">
        <div className="space-y-4">
          <Input label="Campaign Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Summer Sale" />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Channel</label>
            <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400">
              <option value="email">Email</option><option value="sms">SMS</option><option value="social">Social Media</option><option value="push">Push</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Audience</label>
            <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400">
              <option value="all">All Customers</option><option value="vip">VIP Only</option><option value="new">New Customers</option><option value="inactive">Inactive Customers</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={create} disabled={!form.name}>Create</Button></div>
        </div>
      </Modal>
    </div>
  );
}
