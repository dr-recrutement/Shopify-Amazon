import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import {
  CreditCard, Plus, Pencil, Trash2, Loader2, AlertCircle, ArrowLeft,
  Check, ShieldCheck, Eye, EyeOff, X,
} from 'lucide-react';

const PROVIDERS = [
  { value: 'stripe', label: 'Stripe', fields: ['secret_key', 'public_key', 'webhook_secret'], hint: 'Cartes internationales' },
  { value: 'flutterwave', label: 'Flutterwave', fields: ['secret_key', 'public_key'], hint: 'Cartes + Mobile Money (Afrique)' },
  { value: 'paystack', label: 'Paystack', fields: ['secret_key', 'public_key'], hint: 'Afrique de l’Ouest & du Sud' },
  { value: 'payunit', label: 'Payunit', fields: ['secret_key', 'public_key', 'merchant_id'], hint: 'Mobile Money (CEMAC)' },
];
const FIELD_LABELS = {
  secret_key: 'Clé secrète (secret_key)',
  public_key: 'Clé publique (public_key)',
  webhook_secret: 'Secret webhook',
  merchant_id: 'Identifiant marchand',
};
const inputCls = 'w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]/30';

export default function Payments() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [show, setShow] = useState({});

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const list = await base44.entities.PaymentProvider.filter({ store_id: store.id }, '-created_date', 50);
      setProviders(list);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const blank = () => ({
    provider: 'stripe', display_name: '', mode: 'test', is_active: true,
    credentials: { secret_key: '', public_key: '', webhook_secret: '', merchant_id: '' },
  });
  const [form, setForm] = useState(blank());

  const openNew = () => { setEditing(null); setForm(blank()); setFormOpen(true); setShow({}); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      provider: p.provider, display_name: p.display_name || '', mode: p.mode || 'test', is_active: p.is_active !== false,
      credentials: { secret_key: '', public_key: '', webhook_secret: '', merchant_id: '', ...(p.credentials || {}) },
    });
    setFormOpen(true); setShow({});
  };
  const set = (patch) => setForm({ ...form, ...patch });
  const setCred = (k, v) => set({ credentials: { ...form.credentials, [k]: v } });

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        store_id: store.id,
        provider: form.provider,
        display_name: form.display_name || PROVIDERS.find((p) => p.value === form.provider)?.label || form.provider,
        mode: form.mode,
        is_active: form.is_active,
        credentials: form.credentials,
      };
      // On edit, don't overwrite with empty secret fields (keep existing)
      if (editing) {
        const merged = { ...(editing.credentials || {}), ...form.credentials };
        Object.keys(merged).forEach((k) => { if (merged[k] === '' && form.credentials[k] === '') merged[k] = (editing.credentials || {})[k] || ''; });
        payload.credentials = merged;
        await base44.entities.PaymentProvider.update(editing.id, payload);
      } else {
        await base44.entities.PaymentProvider.create(payload);
      }
      setFormOpen(false);
      load();
    } finally { setSaving(false); }
  };

  const remove = async (p) => {
    if (!confirm(`Supprimer la connexion ${p.provider} ?`)) return;
    await base44.entities.PaymentProvider.delete(p.id);
    setProviders((l) => l.filter((x) => x.id !== p.id));
  };

  const toggleActive = async (p) => {
    await base44.entities.PaymentProvider.update(p.id, { is_active: !p.is_active });
    setProviders((l) => l.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)));
  };

  if (storeLoading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Créez d'abord votre boutique</h1>
        <Link to="/store-setup" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#00694d] mt-3">Configurer ma boutique</Link>
      </div>
    );
  }

  const activeProvider = PROVIDERS.find((p) => p.value === form.provider);

  return (
    <div className="min-h-full bg-[#F4F4F4]">
      <div className="sticky top-0 z-10 bg-white border-b border-[#E1E1E1] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="text-[#6D7175] hover:text-[#202223]"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-[#202223] flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#008060]" /> Paiements</h1>
            <p className="text-xs text-[#6D7175] truncate">Connectez votre fournisseur de paiement — {store.name}</p>
          </div>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-3 sm:px-4 py-2 rounded-md hover:bg-[#00694d] shrink-0">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Connecter un PSP</span>
        </button>
      </div>

      <div className="px-4 sm:px-6 py-4 max-w-3xl mx-auto">
        <div className="mb-4 rounded-lg border border-[#008060]/20 bg-[#008060]/[0.04] p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#008060] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#202223]">Isolation stricte par boutique</p>
            <p className="text-xs text-[#6D7175] mt-0.5 leading-relaxed">Vos identifiants PSP sont rattachés à votre boutique et ne sont visibles que par vous. Ils ne sont jamais exposés au client final — seul un traitement serveur les utilise pour encaisser les paiements.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>
        ) : providers.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E1E1E1] flex flex-col items-center justify-center py-16 text-center">
            <CreditCard className="w-10 h-10 text-[#C9C9C9] mb-2" />
            <p className="text-sm font-medium text-[#202223]">Aucun paiement connecté</p>
            <p className="text-xs text-[#6D7175] mt-1 mb-4">Connectez Stripe, Flutterwave, Paystack ou Payunit pour encaisser vos ventes.</p>
            <button onClick={openNew} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#00694d]"><Plus className="w-4 h-4" /> Connecter un PSP</button>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((p) => {
              const meta = PROVIDERS.find((x) => x.value === p.provider) || { label: p.provider, hint: '' };
              return (
                <div key={p.id} className="bg-white rounded-xl border border-[#E1E1E1] p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#008060]/10 flex items-center justify-center shrink-0"><CreditCard className="w-5 h-5 text-[#008060]" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#202223] flex items-center gap-2">{meta.label} <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.mode === 'live' ? 'bg-[#008060]/10 text-[#008060]' : 'bg-amber-500/10 text-amber-600'}`}>{p.mode === 'live' ? 'Production' : 'Test'}</span></p>
                      <p className="text-xs text-[#6D7175] truncate">{meta.hint}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => toggleActive(p)} className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-md border ${p.is_active ? 'bg-[#008060]/10 text-[#008060] border-[#008060]/30' : 'bg-[#F4F4F4] text-[#6D7175] border-[#E1E1E1]'}`}>{p.is_active ? 'Actif' : 'Inactif'}</button>
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded text-[#6D7175] hover:bg-black/5"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(p)} className="p-1.5 rounded text-[#6D7175] hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setFormOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E1E1E1]">
              <h2 className="text-base font-bold text-[#202223]">{editing ? 'Modifier la connexion' : 'Connecter un PSP'}</h2>
              <button onClick={() => setFormOpen(false)} className="text-[#6D7175] hover:text-[#202223]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1.5">Fournisseur</label>
                <div className="grid grid-cols-2 gap-2">
                  {PROVIDERS.map((p) => (
                    <button key={p.value} type="button" onClick={() => set({ provider: p.value, credentials: { secret_key: '', public_key: '', webhook_secret: '', merchant_id: '' } })} className={`flex flex-col items-start gap-0.5 p-3 rounded-lg border text-left ${form.provider === p.value ? 'border-[#008060] bg-[#008060]/5' : 'border-[#E1E1E1] hover:bg-black/[0.02]'}`}>
                      <span className="text-sm font-semibold text-[#202223]">{p.label}</span>
                      <span className="text-[11px] text-[#6D7175]">{p.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202223] mb-1.5">Nom affiché</label>
                  <input value={form.display_name} onChange={(e) => set({ display_name: e.target.value })} placeholder={activeProvider?.label} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202223] mb-1.5">Mode</label>
                  <select value={form.mode} onChange={(e) => set({ mode: e.target.value })} className={inputCls}>
                    <option value="test">Test</option>
                    <option value="live">Production</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                {activeProvider?.fields.map((f) => (
                  <div key={f}>
                    <label className="block text-xs font-semibold text-[#202223] mb-1.5">{FIELD_LABELS[f]}</label>
                    <div className="relative">
                      <input type={show[f] ? 'text' : 'password'} value={form.credentials[f] || ''} onChange={(e) => setCred(f, e.target.value)} className={inputCls + ' pr-9'} placeholder={editing ? '•••••••• (inchangé si vide)' : ''} />
                      <button type="button" onClick={() => setShow((s) => ({ ...s, [f]: !s[f] }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6D7175] hover:text-[#202223]">{show[f] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-[#202223] cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })} className="w-4 h-4 accent-[#008060]" />
                Activer ce fournisseur pour le checkout
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#E1E1E1]">
              <button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm font-medium rounded-md border border-[#E1E1E1] hover:bg-black/5">Annuler</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-[#008060] text-white hover:bg-[#00694d] disabled:opacity-40">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {editing ? 'Enregistrer' : 'Connecter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}