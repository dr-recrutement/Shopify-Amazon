import { useState, useEffect, useCallback } from 'react';
import { Loader2, CreditCard, Check, AlertCircle, Trash2, PlugZap, XCircle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

// Real gap found in a platform-wide audit: platform-billing (used for
// domain purchases AND subscription upgrades, via PlatformPaymentPicker)
// already fully supports 6 providers, checking their availability from
// platform_secrets - but nothing anywhere in the admin UI could write
// those secrets. A Super Admin had no way at all to enter Sellia's own
// real credentials for platform-level billing, short of direct database
// access. This is that missing piece.

// field = [key, label, input type, optional?]. Optional fields do not count
// toward "Configuré" (platform-billing has a default for them).
const PLAN_IDS = ['starter', 'growth', 'pro', 'enterprise'];
const PROVIDERS = [
  { id: 'stripe', label: 'Stripe', fields: [['platform_stripe_secret_key', 'Clé secrète (sk_live_...)', 'password'], ['platform_stripe_publishable_key', 'Clé publique (pk_live_...)', 'text']] },
  { id: 'flutterwave', label: 'Flutterwave', fields: [['platform_flutterwave_secret_key', 'Secret Key (FLWSECK-...)', 'password'], ['platform_flutterwave_public_key', 'Public Key (FLWPUBK-...)', 'text']] },
  { id: 'paystack', label: 'Paystack', fields: [['platform_paystack_secret_key', 'Secret Key (sk_live_...)', 'password'], ['platform_paystack_public_key', 'Public Key (pk_live_...)', 'text']] },
  { id: 'payunit', label: 'Payunit', fields: [['payunit_api_key', 'API Key', 'password'], ['payunit_api_username', 'API Username', 'text'], ['payunit_api_password', 'API Password', 'password'], ['payunit_mode', "Mode ('live' ou 'sandbox', défaut : live)", 'text', true]] },
  { id: 'korapay', label: 'Korapay', fields: [['platform_korapay_secret_key', 'Secret Key', 'password'], ['platform_korapay_public_key', 'Public Key', 'text']] },
  { id: 'paddle', label: 'Paddle', fields: [['platform_paddle_api_key', 'API Key', 'password'], ['platform_paddle_client_token', 'Client-side Token', 'text'], ...PLAN_IDS.map((pl) => [`platform_paddle_price_${pl}`, `ID de prix Paddle — plan ${pl} (pri_...)`, 'text', true])] },
  { id: 'cloudflare', label: 'Cloudflare (achat de domaines)', fields: [['cloudflare_account_id', 'Account ID', 'text'], ['cloudflare_api_token', 'API Token (Registrar)', 'password']] },
  { id: 'ai', label: 'IA de la plateforme (Gemini)', fields: [['platform_gemini_api_key', 'Clé API Gemini', 'password']] },
];

export default function PlatformPaymentProviders() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openProvider, setOpenProvider] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(null);
  const [results, setResults] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase.functions.invoke('platform-payment-providers-admin', { body: { action: 'list' } });
    if (!err) setStatus(data?.status || {});
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (p) => {
    setOpenProvider(p.id);
    setForm({});
    setError('');
  };

  const save = async (p) => {
    setSaving(true);
    setError('');
    try {
      const { data, error: err } = await supabase.functions.invoke('platform-payment-providers-admin', { body: { action: 'set', provider: p.id, values: form } });
      if (err) throw new Error((await err.context?.json?.())?.error || err.message);
      if (data?.error) throw new Error(data.error);
      setOpenProvider(null);
      await load();
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const test = async (p) => {
    setTesting(p.id);
    try {
      const { data, error: err } = await supabase.functions.invoke('platform-payment-providers-admin', { body: { action: 'test', provider: p.id } });
      if (err) throw new Error((await err.context?.json?.())?.error || err.message);
      setResults((r) => ({ ...r, [p.id]: data }));
    } catch (e) {
      setResults((r) => ({ ...r, [p.id]: { ok: false, message: e.message || 'Erreur' } }));
    } finally {
      setTesting(null);
    }
  };

  const remove = async (p) => {
    if (!confirm(`Retirer les identifiants ${p.label} ? La facturation de la plateforme via ce fournisseur cessera de fonctionner.`)) return;
    await supabase.functions.invoke('platform-payment-providers-admin', { body: { action: 'remove', provider: p.id } });
    await load();
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">Ce sont les comptes PSP de <strong>Sellia elle-même</strong> (pas ceux des marchands) — utilisés pour facturer les achats de domaine et les abonnements. Les clés sont enregistrées côté serveur (table protégée, accessible uniquement à ce panneau Super Admin) : aucune manipulation dans Supabase n'est nécessaire. Les valeurs saisies ne sont jamais réaffichées une fois enregistrées.</p>
      </div>

      {PROVIDERS.map((p) => {
        const keyStatus = status?.[p.id] || {};
        const configured = p.fields.filter((f) => !f[3]).every(([key]) => keyStatus[key]);
        const partiallyConfigured = !configured && p.fields.some(([key]) => keyStatus[key]);
        const result = results[p.id];
        return (
          <div key={p.id} className="bg-white rounded-xl border border-[#E1E1E1] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#6D7175]" />
                <span className="text-sm font-semibold text-[#202223]">{p.label}</span>
                {configured && <span className="text-[10px] font-bold text-[#008060] bg-[#008060]/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Configuré</span>}
                {partiallyConfigured && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Incomplet</span>}
              </div>
              <div className="flex items-center gap-2">
                {configured && <button onClick={() => test(p)} disabled={testing === p.id} className="text-xs font-semibold px-3 py-1.5 rounded-md border border-[#E1E1E1] hover:bg-black/5 flex items-center gap-1 disabled:opacity-50">{testing === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlugZap className="w-3 h-3" />} Tester la connexion</button>}
                {configured && <button onClick={() => remove(p)} className="p-1.5 rounded text-[#6D7175] hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>}
                <button onClick={() => openEdit(p)} className="text-xs font-semibold px-3 py-1.5 rounded-md border border-[#E1E1E1] hover:bg-black/5">{configured ? 'Modifier' : 'Configurer'}</button>
              </div>
            </div>

            {result && (
              <p className={`mt-2 text-xs flex items-start gap-1.5 ${result.ok ? 'text-[#008060]' : 'text-red-600'}`}>{result.ok ? <Check className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}{result.message}</p>
            )}

            {openProvider === p.id && (
              <div className="mt-3 pt-3 border-t border-[#E1E1E1] space-y-2.5">
                {p.fields.map(([key, label, type]) => (
                  <div key={key}>
                    <label className="block text-[11px] font-semibold text-[#6D7175] mb-1">{label} {keyStatus[key] && <span className="text-[#008060]">(déjà configuré — laisser vide pour ne pas changer)</span>}</label>
                    <input
                      type={type}
                      value={form[key] || ''}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={keyStatus[key] ? '••••••••••••' : ''}
                      className="w-full px-2.5 py-1.5 border border-[#E1E1E1] rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]/30"
                    />
                  </div>
                ))}
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => save(p)} disabled={saving} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[#008060] text-white hover:bg-[#00694d] disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
                  <button onClick={() => setOpenProvider(null)} className="text-xs font-semibold px-3 py-1.5 rounded-md border border-[#E1E1E1] hover:bg-black/5">Annuler</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
