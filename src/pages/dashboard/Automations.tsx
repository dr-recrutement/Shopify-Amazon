import { useEffect, useState } from 'react';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader, Button, Input, Modal, Badge } from './ui';
import { Plus, Zap } from 'lucide-react';

interface Automation { id: string; name: string; trigger: string; action: string; active: boolean; }

export default function Automations() {
  const { tenant } = useTenant();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', trigger: 'order_created', action: 'send_email' });

  const load = () => {
    if (!tenant) return;
    supabase.from('automations').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false })
      .then(({ data }) => { setAutomations((data as Automation[]) || []); setLoading(false); });
  };
  useEffect(load, [tenant]);

  const create = async () => {
    if (!tenant || !form.name) return;
    await supabase.from('automations').insert({ tenant_id: tenant.id, name: form.name, trigger: form.trigger, action: form.action, active: true });
    setModal(false); setForm({ name: '', trigger: 'order_created', action: 'send_email' }); load();
  };

  const toggle = async (a: Automation) => { await supabase.from('automations').update({ active: !a.active }).eq('id', a.id); load(); };

  return (
    <div>
      <PageHeader title="Automations" subtitle="Automate repetitive tasks with triggers and actions" action={<Button onClick={() => setModal(true)}><Plus size={16} /> New Automation</Button>} />
      <Card className="p-5">
        {loading ? <div className="text-gray-400 text-sm py-8 text-center">Loading…</div> : automations.length === 0 ? (
          <div className="text-center py-12"><Zap size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No automations yet</p></div>
        ) : (
          <div className="space-y-3">
            {automations.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${a.active ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-400'}`}><Zap size={18} /></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-400">When <span className="font-medium text-gray-600">{a.trigger.replace(/_/g, ' ')}</span> → <span className="font-medium text-gray-600">{a.action.replace(/_/g, ' ')}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge color={a.active ? 'green' : 'gray'}>{a.active ? 'On' : 'Off'}</Badge>
                  <button onClick={() => toggle(a)} className={`relative w-11 h-6 rounded-full transition-colors ${a.active ? 'bg-brand-500' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${a.active ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="New Automation">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Welcome email" />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Trigger</label>
            <select value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400">
              <option value="order_created">Order Created</option><option value="customer_signup">Customer Signup</option><option value="low_stock">Low Stock</option><option value="abandoned_cart">Abandoned Cart</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Action</label>
            <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400">
              <option value="send_email">Send Email</option><option value="send_sms">Send SMS</option><option value="create_task">Create Task</option><option value="update_inventory">Update Inventory</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={create} disabled={!form.name}>Create</Button></div>
        </div>
      </Modal>
    </div>
  );
}
