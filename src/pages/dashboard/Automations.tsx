import { PageHeader, Card, Button, Badge } from './ui';
import { Zap, Plus, ArrowRight, Bell, Users, Tag, X, Trash2, Power } from 'lucide-react';
import { useState } from 'react';

interface Automation {
  title: string; trigger: string; action: string; active: boolean;
}

export default function Automations() {
  const [automations, setAutomations] = useState<Automation[]>([
    { title: 'Alerte stock bas', trigger: 'Si stock < 5', action: 'Envoyer email au vendeur', active: true },
    { title: 'Segment VIP auto', trigger: 'Si client passe 3 commandes', action: 'Ajouter au segment VIP', active: false },
    { title: 'Promo anniversaire', trigger: 'Si anniversaire client', action: 'Envoyer code promo -15%', active: true },
  ]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [form, setForm] = useState({ title: '', triggerField: 'stock', triggerOp: '<', triggerValue: '', actionType: 'email', actionValue: '' });

  const triggers = [
    { value: 'stock', label: 'Stock produit' },
    { value: 'orders_count', label: 'Nombre de commandes client' },
    { value: 'birthday', label: 'Anniversaire client' },
    { value: 'cart_abandoned', label: 'Panier abandonné' },
    { value: 'new_customer', label: 'Nouveau client' },
  ];
  const actions = [
    { value: 'email', label: 'Envoyer un email' },
    { value: 'segment', label: 'Ajouter à un segment' },
    { value: 'promo', label: 'Envoyer un code promo' },
    { value: 'alert', label: 'Créer une alerte' },
    { value: 'tag', label: 'Taguer le client' },
  ];

  const createAutomation = () => {
    if (!form.title) return;
    const trigLabel = triggers.find(t => t.value === form.triggerField)?.label || form.triggerField;
    const actLabel = actions.find(a => a.value === form.actionType)?.label || form.actionType;
    setAutomations([{ title: form.title, trigger: `Si ${trigLabel} ${form.triggerOp} ${form.triggerValue}`, action: actLabel + (form.actionValue ? ` "${form.actionValue}"` : ''), active: true }, ...automations]);
    setShowBuilder(false);
    setForm({ title: '', triggerField: 'stock', triggerOp: '<', triggerValue: '', actionType: 'email', actionValue: '' });
  };

  const toggle = (i: number) => setAutomations(automations.map((a, idx) => idx === i ? { ...a, active: !a.active } : a));
  const remove = (i: number) => setAutomations(automations.filter((_, idx) => idx !== i));

  return (
    <div>
      <PageHeader title="Automations" subtitle="Créez des règles automatiques sans code — façon Shopify Flow." action={<Button onClick={() => setShowBuilder(true)}><Plus size={16} /> Créer une automatisation</Button>} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {automations.map((a, i) => (
          <Card key={i} className="p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center"><Zap size={18} className="text-orange-600" /></div>
              <div className="flex gap-1">
                <button onClick={() => toggle(i)} className={`p-1 rounded ${a.active ? 'text-green-600' : 'text-gray-300'}`}><Power size={14} /></button>
                <button onClick={() => remove(i)} className="p-1 rounded text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
            <h3 className="mt-3 font-semibold text-gray-900">{a.title}</h3>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex items-center gap-1 text-gray-500"><span className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">SI</span> {a.trigger}</div>
              <div className="flex items-center gap-1 text-gray-500"><span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded font-mono">ALORS</span> {a.action}</div>
            </div>
            <div className="mt-3"><Badge color={a.active ? 'green' : 'gray'}>{a.active ? 'Active' : 'Inactive'}</Badge></div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-5 bg-gradient-to-r from-purple-50 to-white">
        <div className="flex items-center gap-3">
          <Zap className="text-purple-600" size={20} />
          <p className="text-sm text-gray-700">Moteur d'automatisation façon Shopify Flow — créez vos règles sans code. Combinez déclencheurs, conditions et actions.</p>
        </div>
      </Card>

      {/* Rule builder modal */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowBuilder(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Créer une automatisation</h3>
              <button onClick={() => setShowBuilder(false)}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Nom de l'automatisation</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Ex. Alerte stock critique" /></div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Déclencheur (SI)</div>
                <div className="grid grid-cols-3 gap-2">
                  <select value={form.triggerField} onChange={e => setForm({ ...form, triggerField: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded text-xs">{triggers.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
                  <select value={form.triggerOp} onChange={e => setForm({ ...form, triggerOp: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded text-xs"><option value="<">&lt;</option><option value=">">&gt;</option><option value="=">=</option><option value="est">est</option></select>
                  <input value={form.triggerValue} onChange={e => setForm({ ...form, triggerValue: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded text-xs" placeholder="valeur" />
                </div>
              </div>

              <div className="flex justify-center"><ArrowRight size={18} className="text-gray-400" /></div>

              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-xs font-semibold text-orange-500 uppercase mb-2">Action (ALORS)</div>
                <div className="grid grid-cols-2 gap-2">
                  <select value={form.actionType} onChange={e => setForm({ ...form, actionType: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded text-xs">{actions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}</select>
                  <input value={form.actionValue} onChange={e => setForm({ ...form, actionValue: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded text-xs" placeholder="paramètre" />
                </div>
              </div>

              <Button onClick={createAutomation} className="w-full">Créer l'automatisation</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
