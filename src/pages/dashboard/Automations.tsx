import { PageHeader, Card, Button, Badge } from './ui';
import { Zap, Plus, ArrowRight, X, Trash2, Power } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAutomations, saveAutomations, type Automation, type AutomationTrigger, type AutomationAction } from '../../lib/app-state';

const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  order_created: 'Commande créée', order_paid: 'Commande payée', customer_signup: 'Nouveau client',
  low_stock: 'Stock bas', abandoned_cart: 'Panier abandonné',
};
const ACTION_LABELS: Record<AutomationAction, string> = {
  send_email: 'Envoyer un email', create_discount: 'Créer une réduction', tag_customer: 'Taguer le client',
  notify_staff: 'Notifier le staff', restock_alert: 'Alerte de réapprovisionnement',
};

export default function Automations() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [form, setForm] = useState({ name: '', trigger: 'order_created' as AutomationTrigger, action: 'send_email' as AutomationAction });

  useEffect(() => { setAutomations(getAutomations()); }, []);

  const createAutomation = () => {
    if (!form.name.trim()) return;
    const newAuto: Automation = { id: `a-${Date.now()}`, name: form.name, trigger: form.trigger, action: form.action, enabled: true, runs: 0, createdAt: new Date().toISOString().slice(0, 10) };
    const updated = [newAuto, ...automations];
    setAutomations(updated); saveAutomations(updated);
    setShowBuilder(false);
    setForm({ name: '', trigger: 'order_created', action: 'send_email' });
  };

  const toggle = (id: string) => {
    const updated = automations.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    setAutomations(updated); saveAutomations(updated);
  };
  const remove = (id: string) => {
    const updated = automations.filter(a => a.id !== id);
    setAutomations(updated); saveAutomations(updated);
  };

  return (
    <div>
      <PageHeader title="Automations" subtitle="Créez des règles automatiques sans code — façon Shopify Flow." action={<Button onClick={() => setShowBuilder(true)}><Plus size={16} /> Créer une automatisation</Button>} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {automations.map(a => (
          <Card key={a.id} className="p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center"><Zap size={18} className="text-brand-600" /></div>
              <div className="flex gap-1">
                <button onClick={() => toggle(a.id)} className={`p-1 rounded ${a.enabled ? 'text-green-600' : 'text-gray-300'}`}><Power size={14} /></button>
                <button onClick={() => remove(a.id)} className="p-1 rounded text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
            <h3 className="mt-3 font-semibold text-gray-900">{a.name}</h3>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex items-center gap-1 text-gray-500"><span className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">SI</span> {TRIGGER_LABELS[a.trigger]}</div>
              <div className="flex items-center gap-1 text-gray-500"><span className="px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded font-mono">ALORS</span> {ACTION_LABELS[a.action]}</div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge color={a.enabled ? 'green' : 'gray'}>{a.enabled ? 'Active' : 'Inactive'}</Badge>
              <span className="text-[10px] text-gray-400">{a.runs} exécutions</span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-5 bg-gradient-to-r from-purple-50 to-white">
        <div className="flex items-center gap-3">
          <Zap className="text-purple-600" size={20} />
          <p className="text-sm text-gray-700">Moteur d'automatisation façon Shopify Flow — créez vos règles sans code. Combinez déclencheurs, conditions et actions.</p>
        </div>
      </Card>

      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowBuilder(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Créer une automatisation</h3>
              <button onClick={() => setShowBuilder(false)}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Nom de l'automatisation</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" placeholder="Ex. Alerte stock critique" /></div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Déclencheur (SI)</div>
                <select value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value as AutomationTrigger })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500">
                  {(Object.keys(TRIGGER_LABELS) as AutomationTrigger[]).map(t => <option key={t} value={t}>{TRIGGER_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="flex justify-center"><ArrowRight size={18} className="text-gray-400" /></div>
              <div className="p-3 bg-brand-50 rounded-lg">
                <div className="text-xs font-semibold text-brand-500 uppercase mb-2">Action (ALORS)</div>
                <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value as AutomationAction })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500">
                  {(Object.keys(ACTION_LABELS) as AutomationAction[]).map(a => <option key={a} value={a}>{ACTION_LABELS[a]}</option>)}
                </select>
              </div>
              <Button onClick={createAutomation} className="w-full">Créer l'automatisation</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
