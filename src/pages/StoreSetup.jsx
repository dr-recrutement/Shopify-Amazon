import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Save, Check, Loader2, Store as StoreIcon, Upload, Image as ImageIcon } from 'lucide-react';
import { CountryCurrencyField } from '@/components/world/Selects';

const BUSINESS_TYPES = ['Mode', 'Beauté', 'Électronique', 'Maison & Déco', 'Alimentation', 'Artisanat', 'Santé', 'Services', 'Autre'];

function LogoField({ value, onSet }) {
  const [busy, setBusy] = useState(false);
  const ref = (e) => { if (e?.files?.[0]) upload(e.files[0]); };
  const upload = async (file) => {
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onSet(file_url);
    } finally { setBusy(false); }
  };
  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-lg border border-[#E1E1E1] bg-[#F4F4F4] overflow-hidden flex items-center justify-center">
        {value ? <img src={value} alt="logo" className="w-full h-full object-contain" /> : <ImageIcon className="w-5 h-5 text-[#C9C9C9]" />}
      </div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-[#008060] border border-[#008060]/40 rounded-md px-3 py-2 cursor-pointer hover:bg-[#008060]/5">
        {busy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Téléversement…</> : <><Upload className="w-3.5 h-3.5" /> {value ? 'Remplacer' : 'Téléverser un logo'}</>}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => ref(e.target)} />
      </label>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#202223] mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[#6D7175] mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]/30';

export default function StoreSetup() {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const list = await base44.entities.Store.filter({ created_by_id: user.id });
        setStore(list[0] || null);
      } finally { setLoading(false); }
    })();
  }, []);

  const form = store || {
    name: '', slug: '', business_name: '', business_type: 'Mode',
    country: 'SN', currency: 'XOF', callingCode: '+221',
    phone: '', email: '', address: '', description: '', logo: '', status: 'draft', is_marketplace_seller: false,
  };

  const set = (patch) => setStore({ ...form, ...patch });

  const slugify = (s) => s.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        business_name: form.business_name || form.name,
        business_type: form.business_type,
        country: form.country,
        currency: form.currency,
        phone: (form.callingCode || '') + (form.phone || ''),
        email: form.email,
        address: form.address,
        description: form.description,
        logo: form.logo,
        status: form.status || 'draft',
        is_marketplace_seller: !!form.is_marketplace_seller,
      };
      if (form.id) {
        await base44.entities.Store.update(form.id, payload);
      } else {
        const created = await base44.entities.Store.create(payload);
        setStore({ ...form, ...created });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  }

  const isNew = !form.id;

  return (
    <div className="min-h-full bg-[#F4F4F4]">
      <div className="sticky top-0 z-10 bg-white border-b border-[#E1E1E1] px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-[#6D7175] hover:text-[#202223]"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-base font-bold text-[#202223] flex items-center gap-2"><StoreIcon className="w-4 h-4 text-[#008060]" /> {isNew ? 'Créer ma boutique' : 'Paramètres de la boutique'}</h1>
            <p className="text-xs text-[#6D7175]">Informations de base, devise et localisation de votre point de vente.</p>
          </div>
        </div>
        <button onClick={save} disabled={saving || !form.name} className="flex items-center gap-1.5 bg-[#202223] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-black disabled:opacity-40">
          {saved ? <><Check className="w-4 h-4" /> Enregistré</> : saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</> : <><Save className="w-4 h-4" /> Enregistrer</>}
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#202223]">Identité</h2>
          <Field label="Nom de la boutique *">
            <input value={form.name || ''} onChange={(e) => set({ name: e.target.value, slug: slugify(e.target.value), business_name: e.target.value })} placeholder="Ex : Liafrik Mode" className={inputCls} />
          </Field>
          <Field label="Slug (URL)" hint="Identifiant unique de votre boutique.">
            <input value={form.slug || ''} onChange={(e) => set({ slug: e.target.value })} placeholder="liafrik-mode" className={`${inputCls} font-mono`} />
          </Field>
          <Field label="Logo">
            <LogoField value={form.logo || ''} onSet={(u) => set({ logo: u })} />
          </Field>
          <Field label="Description">
            <textarea value={form.description || ''} onChange={(e) => set({ description: e.target.value })} rows={3} placeholder="Décrivez votre boutique en une phrase…" className={inputCls} />
          </Field>
        </div>

        <div className="bg-white rounded-xl border border-[#E1E1E1] p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#202223]">Activité</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Raison sociale"><input value={form.business_name || ''} onChange={(e) => set({ business_name: e.target.value })} className={inputCls} /></Field>
            <Field label="Type d'activité">
              <select value={form.business_type || 'Mode'} onChange={(e) => set({ business_type: e.target.value })} className={inputCls}>
                {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#202223] cursor-pointer pt-1">
            <input type="checkbox" checked={!!form.is_marketplace_seller} onChange={(e) => set({ is_marketplace_seller: e.target.checked })} className="accent-[#008060]" />
            Vendre aussi sur la marketplace Sellia (vendeur marketplace)
          </label>
        </div>

        <div className="bg-white rounded-xl border border-[#E1E1E1] p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#202223]">Localisation & devise</h2>
          <CountryCurrencyField
            country={form.country} currency={form.currency} callingCode={form.callingCode}
            onChange={(patch) => set(patch)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Téléphone"><input value={form.phone || ''} onChange={(e) => set({ phone: e.target.value })} placeholder="77 123 45 67" className={inputCls} /></Field>
            <Field label="E-mail"><input type="email" value={form.email || ''} onChange={(e) => set({ email: e.target.value })} placeholder="contact@boutique.com" className={inputCls} /></Field>
          </div>
          <Field label="Adresse"><input value={form.address || ''} onChange={(e) => set({ address: e.target.value })} placeholder="Dakar, Sénégal" className={inputCls} /></Field>
        </div>
      </div>
    </div>
  );
}