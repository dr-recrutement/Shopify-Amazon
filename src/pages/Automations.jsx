import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Loader2, AlertCircle, Plus, Trash2, Pencil, X, Power,
  ShoppingCart, UserPlus, PackageCheck, Truck, Box, Hand,
  Mail, Tag, TicketPercent, Bell, RefreshCw, Clock,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';

const TRIGGERS = [
  { id: 'cart_abandoned', label: 'Panier abandonné', icon: ShoppingCart },
  { id: 'order_created', label: 'Commande créée', icon: PackageCheck },
  { id: 'customer_signup', label: 'Nouveau client', icon: UserPlus },
  { id: 'order_delivered', label: 'Commande livrée', icon: Truck },
  { id: 'low_stock', label: 'Stock faible', icon: Box },
  { id: 'manual', label: 'Manuel', icon: Hand },
];

const ACTIONS = [
  { id: 'send_email', label: 'Envoyer un e-mail', icon: Mail },
  { id: 'add_tag', label: 'Ajouter un tag', icon: Tag },
  { id: 'create_discount', label: 'Créer un code promo', icon: TicketPercent },
  { id: 'notify', label: 'Me notifier', icon: Bell },
  { id: 'update_status', label: 'Mettre à jour le statut', icon: RefreshCw },
];

const TEMPLATES = [
  { name: 'Relance panier abandonné', trigger: 'cart_abandoned', action: 'send_email', config: { delay_hours: 2, email_subject: 'Vous avez oublié quelque chose', email_template: 'rappel_panier' } },
  { name: 'Bienvenue nouveau client', trigger: 'customer_signup', action: 'send_email', config: { delay_hours: 0, email_subject: 'Bienvenue chez nous !', email_template: 'bienvenue' } },
  { name: 'Merci après livraison', trigger: 'order_delivered', action: 'send_email', config: { delay_hours: 24, email_subject: 'Merci pour votre commande !', email_template: 'merci' } },
  { name: 'Alerte stock faible', trigger: 'low_stock', action: 'notify', config: { delay_hours: 0 } },
];

function Editor({ automation, onSave, onClose, saving }) {
  const [form, setForm] = useState(automation || { name: '', trigger: 'cart_abandoned', action: 'send_email', config: { delay_hours: 0 }, enabled: true });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setCfg = (k, v) => setForm((f) => ({ ...f, config: { ...(f.config || {}), [k]: v } }));
  const trigger = TRIGGERS.find((t) => t.id === form.trigger);
  const action = ACTIONS.find((a) => a.id === form.action);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-[#E1E1E1] px-5 py-3 flex items-center justify-between">
          <h2 className="font-bold text-[#202223]">{automation ? 'Modifier l\u2019automatisation' : 'Nouvelle automatisation'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-black/5 text-[#6D7175]"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#6D7175] mb-1">Nom</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm" placeholder="Ex : Relance panier 2h" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6D7175] mb-2">Déclencheur (QUAND)</label>
            <div className="grid grid-cols-2 gap-2">
              {TRIGGERS.map((t) => (
                <button key={t.id} onClick={() => set('trigger', t.id)} className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs ${form.trigger === t.id ? 'border-[#008060] bg-[#008060]/5 text-[#008060]' : 'border-[#E1E1E1] text-[#6D7175] hover:bg-black/[0.02]'}`}>
                  <t.icon className="w-4 h-4 shrink-0" /> {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6D7175] mb-2">Action (ALORS)</label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIONS.map((a) => (
                <button key={a.id} onClick={() => set('action', a.id)} className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs ${form.action === a.id ? 'border-[#008060] bg-[#008060]/5 text-[#008060]' : 'border-[#E1E1E1] text-[#6D7175] hover:bg-black/[0.02]'}`}>
                  <a.icon className="w-4 h-4 shrink-0" /> {a.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#6D7175]" />
            <label className="text-xs text-[#6D7175]">Délai avant exécution :</label>
            <input type="number" min={0} value={form.config?.delay_hours || 0} onChange={(e) => setCfg('delay_hours', +e.target.value)} className="w-20 px-2 py-1.5 border border-[#E1E1E1] rounded-md text-sm" />
            <span className="text-xs text-[#6D7175]">heures</span>
          </div>
          {form.action === 'send_email' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#6D7175] mb-1">Sujet de l'e-mail</label>
                <input value={form.config?.email_subject || ''} onChange={(e) => setCfg('email_subject', e.target.value)} className="w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm" placeholder="Objet de l'e-mail" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6D7175] mb-1">Message</label>
                <textarea value={form.config?.email_template || ''} onChange={(e) => setCfg('email_template', e.target.value)} rows={3} className="w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm" placeholder="Contenu de l'e-mail…" />
              </div>
            </>
          )}
          {form.action === 'add_tag' && (
            <div>
              <label className="block text-xs font-semibold text-[#6D7175] mb-1">Tag à ajouter</label>
              <input value={form.config?.tag || ''} onChange={(e) => setCfg('tag', e.target.value)} className="w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm" placeholder="Ex : VIP" />
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-white border-t border-[#E1E1E1] px-5 py-3 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[#6D7175] hover:bg-black/5 rounded-md">Annuler</button>
          <button onClick={() => form.name.trim() && onSave({ ...form, config: form.config || {} })} disabled={saving || !form.name.trim()} className="px-4 py-2 text-sm font-medium text-white bg-[#008060] rounded-md hover:bg-[#00694d] disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Automations() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      setAutomations(await base44.entities.Automation.filter({ store_id: store.id }, '-created_date', 100));
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const save = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Automation.update(editing.id, data);
      } else {
        await base44.entities.Automation.create({ ...data, store_id: store.id });
      }
      setShowEditor(false); setEditing(null); load();
    } catch (e) { alert('Erreur : ' + (e.message)); } finally { setSaving(false); }
  };

  const toggle = async (a) => {
    await base44.entities.Automation.update(a.id, { enabled: !a.enabled });
    load();
  };

  const remove = async (a) => {
    if (!confirm(`Supprimer l'automatisation \u00ab ${a.name} \u00bb ?`)) return;
    await base44.entities.Automation.delete(a.id);
    load();
  };

  const applyTemplate = (tpl) => {
    setEditing({ ...tpl, config: tpl.config });
    setShowEditor(true);
  };

  if (storeLoading || loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Configurez votre boutique</h1>
        <Link to="/store-setup" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-3">Configurer</Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#6D7175]" />
          <div>
            <h1 className="text-xl font-bold text-[#202223]">Automatisations</h1>
            <p className="text-xs text-[#6D7175]">Automatisez vos e-mails, relances et notifications.</p>
          </div>
        </div>
        <button onClick={() => { setEditing(null); setShowEditor(true); }} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d]">
          <Plus className="w-4 h-4" /> Créer
        </button>
      </div>

      {automations.length === 0 && (
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-[#008060]" />
            <h2 className="text-sm font-bold text-[#202223]">Modèles prêts à l'emploi</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEMPLATES.map((tpl) => (
              <button key={tpl.name} onClick={() => applyTemplate(tpl)} className="text-left p-4 rounded-xl border border-[#E1E1E1] hover:border-[#008060]/40 hover:bg-[#008060]/5 transition group">
                <p className="text-sm font-semibold text-[#202223]">{tpl.name}</p>
                <p className="text-xs text-[#6D7175] mt-1">QUAND {TRIGGERS.find((t) => t.id === tpl.trigger)?.label} → ALORS {ACTIONS.find((a) => a.id === tpl.action)?.label}</p>
                <span className="text-xs font-semibold text-[#008060] mt-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">Utiliser ce modèle →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {automations.length > 0 && (
        <div className="space-y-2">
          {automations.map((a) => {
            const trigger = TRIGGERS.find((t) => t.id === a.trigger);
            const action = ACTIONS.find((x) => x.id === a.action);
            return (
              <div key={a.id} className="bg-white rounded-xl border border-[#E1E1E1] p-4 flex items-center gap-3 group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${a.enabled ? 'bg-[#008060]/10' : 'bg-[#F4F4F4]'}`}>
                  {trigger && <trigger.icon className={`w-5 h-5 ${a.enabled ? 'text-[#008060]' : 'text-[#6D7175]'}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#202223] truncate">{a.name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${a.enabled ? 'bg-[#008060]/10 text-[#008060]' : 'bg-[#F4F4F4] text-[#6D7175]'}`}>{a.enabled ? 'Actif' : 'Désactivé'}</span>
                  </div>
                  <p className="text-xs text-[#6D7175] mt-0.5">QUAND {trigger?.label} → ALORS {action?.label}{a.config?.delay_hours ? ` · +${a.config.delay_hours}h` : ''}</p>
                  {a.runs_count > 0 && <p className="text-[11px] text-[#6D7175] mt-0.5">{a.runs_count} exécution(s)</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggle(a)} title={a.enabled ? 'Désactiver' : 'Activer'} className="p-2 rounded-md text-[#6D7175] hover:bg-black/5"><Power className={`w-4 h-4 ${a.enabled ? 'text-[#008060]' : ''}`} /></button>
                  <button onClick={() => { setEditing(a); setShowEditor(true); }} className="p-2 rounded-md text-[#6D7175] hover:bg-black/5"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(a)} className="p-2 rounded-md text-[#6D7175] hover:bg-red-50 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
          <button onClick={() => { setEditing(null); setShowEditor(true); }} className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#008060] border border-dashed border-[#008060]/40 rounded-xl py-3 hover:bg-[#008060]/5"><Plus className="w-4 h-4" /> Ajouter une automatisation</button>
        </div>
      )}

      {showEditor && <Editor automation={editing} onSave={save} onClose={() => { setShowEditor(false); setEditing(null); }} saving={saving} />}
    </div>
  );
}