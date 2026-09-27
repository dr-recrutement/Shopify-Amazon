import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
// supabase-js's own error object only ever carries a generic "Edge
// Function returned a non-2xx status code" - the real message is in the
// function's own JSON error body, same pattern used everywhere else this
// session (Domains.jsx, PlatformPaymentPicker.jsx, etc).
async function functionErrorMessage(error) {
  try {
    const body = await error.context?.json?.();
    if (body?.error) return body.error;
  } catch { /* fall through to the generic message below */ }
  return error.message || 'Erreur inconnue';
}
import { useCurrentStore } from '@/hooks/useCurrentStore';
import {
  CreditCard, Plus, Pencil, Trash2, Loader2, AlertCircle, ArrowLeft,
  Check, ShieldCheck, Eye, EyeOff, X,
} from 'lucide-react';

const PROVIDERS = [
  { value: 'stripe', label: 'Stripe', logo: 'stripe.png', region: 'Mondial', fields: ['api_secret', 'api_key'], labels: { api_secret: 'Clé secrète (sk_live_...)', api_key: 'Clé publique (pk_live_...)' }, hint: 'Cartes internationales', live: true , integrated: true },
  { value: 'flutterwave', label: 'Flutterwave', logo: 'flutterwave.png', region: 'Afrique', fields: ['api_secret', 'api_key'], labels: { api_secret: 'Secret Key (FLWSECK-...)', api_key: 'Public Key (FLWPUBK-...)' }, hint: 'Cartes + Mobile Money', live: true , integrated: true },
  { value: 'paystack', label: 'Paystack', logo: 'paystack.png', region: 'Afrique', fields: ['api_secret', 'api_key'], labels: { api_secret: 'Secret Key (sk_live_...)', api_key: 'Public Key (pk_live_...)' }, hint: 'Afrique de l’Ouest & du Sud', live: true , integrated: true },
  { value: 'paypal', label: 'PayPal', logo: 'paypal.png', region: 'Mondial', fields: ['api_secret', 'api_key'], labels: { api_secret: 'Client Secret', api_key: 'Client ID' }, hint: 'Portefeuille international' },
  { value: 'adyen', label: 'Adyen', logo: 'adyen.png', region: 'Mondial', fields: ['api_secret', 'api_key', 'client_id'], labels: { api_secret: 'API Key', api_key: 'Client Key', client_id: 'Merchant Account' }, hint: 'Entreprise, multi-devises' },
  { value: 'braintree', label: 'Braintree', logo: 'braintree.jpg', region: 'Mondial', fields: ['api_secret', 'api_key', 'client_id'], labels: { api_secret: 'Private Key', api_key: 'Public Key', client_id: 'Merchant ID' }, hint: 'Groupe PayPal' },
  { value: 'square', label: 'Square', logo: 'square.jpg', region: 'Mondial', fields: ['api_secret', 'client_id'], labels: { api_secret: 'Access Token', client_id: 'Location ID' }, hint: 'Cartes & point de vente' },
  { value: 'klarna', label: 'Klarna', logo: 'klarna.jpg', region: 'Europe', fields: ['api_key', 'api_secret'], labels: { api_key: 'Username (UID)', api_secret: 'Password (API key)' }, hint: 'Paiement en plusieurs fois' },
  { value: 'alipay', label: 'Alipay', logo: 'alipay.png', region: 'Asie', fields: ['client_id', 'api_secret', 'api_key'], labels: { client_id: 'App ID', api_secret: 'Clé privée de l’application', api_key: 'Clé publique Alipay' }, hint: 'Portefeuille chinois' },
  { value: 'grabpay', label: 'GrabPay', logo: 'grabpay.webp', region: 'Asie', fields: ['client_id', 'api_secret', 'api_key'], labels: { client_id: 'Partner ID', api_secret: 'Partner Secret', api_key: 'Merchant ID' }, hint: 'Asie du Sud-Est' },
  { value: 'payunit', label: 'Payunit', logo: 'payunit.png', region: 'Afrique', fields: ['api_key', 'client_id', 'api_secret'], labels: { api_key: 'API Key', client_id: 'API Username', api_secret: 'API Password' }, hint: 'Mobile Money (CEMAC)' , integrated: true },
  { value: 'wave', label: 'Wave', logo: 'wave.png', region: 'Afrique', fields: ['api_secret'], labels: { api_secret: 'API Key (Bearer token)' }, hint: 'Mobile Money (Afrique de l’Ouest)' },
  { value: 'mtn-momo', label: 'MTN MoMo', logo: 'mtn-momo.png', region: 'Afrique', fields: ['api_key', 'client_id', 'api_secret'], labels: { api_key: 'Subscription Key', client_id: 'API User (UUID)', api_secret: 'API Key' }, hint: 'Mobile Money (Open API)' },
  { value: 'orange-money', label: 'Orange Money', logo: 'orange-money.png', region: 'Afrique', fields: ['client_id', 'api_secret', 'api_key'], labels: { client_id: 'Client ID', api_secret: 'Client Secret', api_key: 'Merchant Key' }, hint: 'Mobile Money' },
  { value: 'airtel-money', label: 'Airtel Money', logo: 'airtel-money.jpg', region: 'Afrique', fields: ['client_id', 'api_secret'], labels: { client_id: 'Client ID', api_secret: 'Client Secret' }, hint: 'Mobile Money' },
  { value: 'mpesa', label: 'M-Pesa', logo: 'mpesa.png', region: 'Afrique', fields: ['client_id', 'api_secret', 'api_key'], labels: { client_id: 'Consumer Key', api_secret: 'Consumer Secret', api_key: 'Shortcode / Passkey' }, hint: 'Mobile Money (Daraja API)' },
  { value: 'cellulant', label: 'Cellulant', logo: 'cellulant.png', region: 'Afrique', fields: ['client_id', 'api_secret'], labels: { client_id: 'Client ID', api_secret: 'Client Secret' }, hint: 'Agrégateur panafricain (Tingg)' },
  { value: 'cinetpay', label: 'CinetPay', logo: 'cinetpay.webp', region: 'Afrique', fields: ['api_key', 'client_id', 'api_secret'], labels: { api_key: 'API Key', client_id: 'Site ID', api_secret: 'Clé secrète' }, hint: 'Agrégateur (CEMAC/UEMOA)' },
  { value: 'kkiapay', label: 'Kkiapay', logo: 'kkiapay.png', region: 'Afrique', fields: ['api_key', 'client_id', 'api_secret'], labels: { api_key: 'Public Key', client_id: 'Private Key', api_secret: 'Secret Key' }, hint: 'Agrégateur (Bénin & région)' },
  { value: 'azipay', label: 'AziPay', logo: 'azipay.png', region: 'Afrique', fields: ['api_key', 'api_secret'], labels: { api_key: 'API Key', api_secret: 'Clé secrète' }, hint: 'Mobile Money' },
  { value: 'touchpay', label: 'TouchPay', logo: 'touchpay.png', region: 'Afrique', fields: ['client_id', 'api_secret'], labels: { client_id: 'ID Agent / Marchand', api_secret: 'Clé API' }, hint: 'Mobile Money' },
  { value: 'pesapal', label: 'Pesapal', logo: 'pesapal.png', region: 'Afrique', fields: ['client_id', 'api_secret'], labels: { client_id: 'Consumer Key', api_secret: 'Consumer Secret' }, hint: 'Afrique de l’Est' },
  { value: 'payfast', label: 'PayFast', logo: 'payfast.png', region: 'Afrique', fields: ['client_id', 'api_key', 'api_secret'], labels: { client_id: 'Merchant ID', api_key: 'Merchant Key', api_secret: 'Passphrase' }, hint: 'Afrique du Sud' },
  { value: 'yoco', label: 'Yoco', logo: 'yoco.png', region: 'Afrique', fields: ['api_secret', 'api_key'], labels: { api_secret: 'Secret Key', api_key: 'Public Key' }, hint: 'Afrique du Sud' },
  { value: 'mercadopago', label: 'Mercado Pago', logo: 'mercadopago.png', region: 'Amérique latine', fields: ['api_secret', 'api_key'], labels: { api_secret: 'Access Token', api_key: 'Public Key' }, hint: 'Amérique latine' },
  { value: 'pagseguro', label: 'PagSeguro', logo: 'pagseguro.png', region: 'Amérique latine', fields: ['api_secret', 'api_key'], labels: { api_secret: 'Token', api_key: 'E-mail du compte' }, hint: 'Brésil' },
  { value: 'ebanx', label: 'EBANX', logo: 'ebanx.jpg', region: 'Amérique latine', fields: ['api_secret', 'api_key'], labels: { api_secret: 'Integration Key', api_key: 'Public Integration Key' }, hint: 'Amérique latine' },
];
const REGIONS = ['Tous', 'Mondial', 'Afrique', 'Europe', 'Asie', 'Amérique latine'];
const FIELD_LABELS = { api_secret: 'Clé secrète', api_key: 'Clé publique / API key', client_id: 'Identifiant client / marchand' };
const inputCls = 'w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]/30';

// Native vendor_payment_gateways: gateway/status/is_active/display_order +
// api_key_encrypted/api_secret_encrypted/client_id_encrypted - the column
// names themselves say these must never be plaintext. Encryption happens
// server-side (Edge Function encrypt-gateway-credentials, AES-256-GCM with
// a key only that function can read) - this page only ever sends
// plaintext over HTTPS to get it encrypted, and never fetches it back.
export default function Payments() {
  const { store, loading: storeLoading, staffRole } = useCurrentStore();
  const [providers, setProviders] = useState([]);
  const [testing, setTesting] = useState(null);
  const [testResults, setTestResults] = useState({});

  const testConnection = async (p) => {
    setTesting(p.id);
    try {
      const { data, error } = await supabase.functions.invoke('test-gateway-connection', { body: { tenant_id: store.id, gateway: p.gateway } });
      if (error) throw new Error(await functionErrorMessage(error));
      setTestResults((r) => ({ ...r, [p.id]: data }));
    } catch (e) {
      setTestResults((r) => ({ ...r, [p.id]: { ok: false, message: e.message || "Échec du test" } }));
    } finally { setTesting(null); }
  };
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [regionFilter, setRegionFilter] = useState('Tous');
  const [editing, setEditing] = useState(null);
  const [show, setShow] = useState({});

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('vendor_payment_gateways').select('*').eq('tenant_id', store.id).order('display_order', { ascending: true });
      if (error) throw new Error(await functionErrorMessage(error));
      setProviders(data || []);
    } catch (e) {
      console.error('Failed to load payment gateways:', e);
      setProviders([]);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const blank = () => ({ provider: 'stripe', is_active: true, credentials: { api_secret: '', api_key: '', client_id: '' } });
  const [form, setForm] = useState(blank());

  const openNew = () => { setEditing(null); setForm(blank()); setFormOpen(true); setShow({}); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ provider: p.gateway, is_active: p.is_active !== false, credentials: { api_secret: '', api_key: '', client_id: '' } });
    setFormOpen(true); setShow({});
  };
  const set = (patch) => setForm({ ...form, ...patch });
  const setCred = (k, v) => set({ credentials: { ...form.credentials, [k]: v } });

  const save = async () => {
    setSaving(true);
    try {
      const toEncrypt = Object.fromEntries(Object.entries(form.credentials).filter(([, v]) => v));
      let encrypted = {};
      if (Object.keys(toEncrypt).length > 0) {
        const { data, error } = await supabase.functions.invoke('encrypt-gateway-credentials', { body: toEncrypt });
        if (error) throw error;
        if (data.error) throw new Error(data.error);
        encrypted = data;
      }
      const payload = { tenant_id: store.id, gateway: form.provider, is_active: form.is_active, status: 'configured', ...encrypted };
      const { error: writeError } = editing
        ? await supabase.from('vendor_payment_gateways').update(payload).eq('id', editing.id)
        : await supabase.from('vendor_payment_gateways').insert(payload);
      if (writeError) throw writeError;
      setFormOpen(false);
      await load();
    } catch (e) {
      alert(e.message || "Échec de l'enregistrement");
    } finally { setSaving(false); }
  };

  const remove = async (p) => {
    if (!confirm(`Supprimer la connexion ${p.gateway} ?`)) return;
    const { error } = await supabase.from('vendor_payment_gateways').delete().eq('id', p.id);
    if (error) { alert(error.message); return; }
    setProviders((l) => l.filter((x) => x.id !== p.id));
  };

  const toggleActive = async (p) => {
    const { error } = await supabase.from('vendor_payment_gateways').update({ is_active: !p.is_active }).eq('id', p.id);
    if (error) { alert(error.message); return; }
    setProviders((l) => l.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)));
  };

  if (storeLoading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Créez d'abord votre boutique</h1>
        <Link to="/onboarding" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#00694d] mt-3">Configurer ma boutique</Link>
      </div>
    );
  }
  if (staffRole === 'user') {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#6D7175] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Accès réservé</h1>
        <p className="text-sm text-[#6D7175] mt-1">Les paiements sont réservés au propriétaire et aux administrateurs de la boutique.</p>
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
            <p className="text-sm font-semibold text-[#202223]">Chiffrées, propres à votre boutique</p>
            <p className="text-xs text-[#6D7175] mt-0.5 leading-relaxed">Vos identifiants sont chiffrés côté serveur avant d'être enregistrés et ne sont jamais renvoyés en clair — même à vous, une fois saisis. Un traitement de paiement réel côté checkout n'est pas encore branché (voir la note ci-dessous) ; ceci enregistre déjà la connexion en toute sécurité.</p>
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
              const meta = PROVIDERS.find((x) => x.value === p.gateway) || { label: p.gateway, hint: '' };
              return (
                <div key={p.id}>
                <div className="bg-white rounded-xl border border-[#E1E1E1] p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#E1E1E1] flex items-center justify-center shrink-0 overflow-hidden">
                      {meta.logo ? <img src={`/payment-logos/${meta.logo}`} alt="" className="w-full h-full object-contain p-1" /> : <CreditCard className="w-5 h-5 text-[#008060]" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#202223] flex items-center gap-1.5">{meta.label}{meta.integrated ? <span className="text-[9px] font-bold text-[#008060] bg-[#008060]/10 px-1.5 py-0.5 rounded-full">Paiement client réel</span> : <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">Config. seulement</span>}</p>
                      <p className="text-xs text-[#6D7175] truncate">{meta.hint}</p>
                      {!meta.integrated && <p className="text-[10px] text-amber-700 mt-0.5">Vos identifiants sont enregistrés, mais vos clients ne peuvent pas encore payer par ce moyen au paiement — l'intégration au checkout n'existe pas encore.</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => testConnection(p)} disabled={testing === p.id} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md border border-[#E1E1E1] text-[#6D7175] hover:bg-black/5 disabled:opacity-50">
                      {testing === p.id ? 'Test…' : 'Tester'}
                    </button>
                    <button onClick={() => toggleActive(p)} className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-md border ${p.is_active ? 'bg-[#008060]/10 text-[#008060] border-[#008060]/30' : 'bg-[#F4F4F4] text-[#6D7175] border-[#E1E1E1]'}`}>{p.is_active ? 'Actif' : 'Inactif'}</button>
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded text-[#6D7175] hover:bg-black/5"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(p)} className="p-1.5 rounded text-[#6D7175] hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {testResults[p.id] && (
                  <p className={`text-[11px] mt-2 px-1 ${testResults[p.id].ok ? 'text-[#008060]' : 'text-red-600'}`}>
                    {testResults[p.id].ok ? '✓' : '✗'} {testResults[p.id].message}
                  </p>
                )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setFormOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E1E1E1]">
              <h2 className="text-base font-bold text-[#202223]">{editing ? 'Mettre à jour la connexion' : 'Connecter un PSP'}</h2>
              <button onClick={() => setFormOpen(false)} className="text-[#6D7175] hover:text-[#202223]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {!editing && (
                <div>
                  <label className="block text-xs font-semibold text-[#202223] mb-1.5">Fournisseur</label>
                  <div className="flex gap-1.5 flex-wrap mb-2.5">
                    {REGIONS.map((r) => (
                      <button key={r} type="button" onClick={() => setRegionFilter(r)} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${regionFilter === r ? 'bg-[#202223] text-white border-[#202223]' : 'border-[#E1E1E1] text-[#6D7175] hover:bg-black/5'}`}>{r}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {PROVIDERS.filter((p) => regionFilter === 'Tous' || p.region === regionFilter).map((p) => (
                      <button key={p.value} type="button" onClick={() => set({ provider: p.value })} className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left ${form.provider === p.value ? 'border-[#008060] bg-[#008060]/5' : 'border-[#E1E1E1] hover:bg-black/[0.02]'}`}>
                        <div className="w-8 h-8 rounded-md bg-white border border-[#E1E1E1] flex items-center justify-center shrink-0 overflow-hidden">
                          <img src={`/payment-logos/${p.logo}`} alt="" className="w-full h-full object-contain p-0.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-[#202223] flex items-center gap-1 truncate">{p.label}{!p.integrated && <span className="text-[8px] font-bold text-amber-700 bg-amber-100 px-1 rounded-full shrink-0">Config.</span>}</span>
                          <span className="text-[10px] text-[#6D7175] block truncate">{p.hint}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {!activeProvider?.integrated && (
                    <p className="text-[11px] text-[#6D7175] mt-2 flex items-start gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Ce PSP enregistre vos identifiants chiffrés en toute sécurité, mais l'encaissement réel via ce fournisseur n'est pas encore branché au checkout (seuls Stripe, Flutterwave, Paystack et Payunit le sont actuellement).</p>
                  )}
                </div>
              )}
              <div className="space-y-3">
                {activeProvider?.fields.map((f) => (
                  <div key={f}>
                    <label className="block text-xs font-semibold text-[#202223] mb-1.5">{activeProvider?.labels?.[f] || FIELD_LABELS[f]}</label>
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
