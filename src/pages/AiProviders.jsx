import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { Loader2, Save, Check, Bot, Cpu, Sparkles, KeyRound, AlertCircle, Trash2 } from 'lucide-react';

const PROVIDERS = [
  { id: 'gemini', name: 'Gemini', desc: 'Google — rapide et économique', color: '#4285F4', icon: Sparkles },
  { id: 'claude', name: 'Claude', desc: 'Anthropic — qualité rédactionnelle', color: '#D97757', icon: Bot },
  { id: 'openai', name: 'ChatGPT', desc: 'OpenAI — polyvalent', color: '#10A37F', icon: Cpu },
];

// Real per-merchant AI key storage: tenant_ai_providers (encrypted, same
// AES-256-GCM scheme as vendor_payment_gateways), used by Sellia Assistant
// via the real ai-assistant Edge Function.
export default function AiProviders() {
  const { store } = useCurrentStore();
  const [status, setStatus] = useState({ gemini: false, claude: false, openai: false });
  const [keys, setKeys] = useState({ gemini: '', claude: '', openai: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(null);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('tenant_ai_providers').select('provider').eq('tenant_id', store.id);
      if (error) throw error;
      const s = { gemini: false, claude: false, openai: false };
      (data || []).forEach((r) => { s[r.provider] = true; });
      setStatus(s);
    } catch (e) {
      console.error('Failed to load AI providers:', e);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const save = async (id) => {
    if (!store?.id || !keys[id]) return;
    setSaving(id); setSaved(null);
    try {
      const { data: enc, error: encError } = await supabase.functions.invoke('encrypt-gateway-credentials', { body: { api_key: keys[id] } });
      if (encError) throw encError;
      if (enc.error) throw new Error(enc.error);
      const { error } = await supabase.from('tenant_ai_providers').upsert(
        { tenant_id: store.id, provider: id, api_key_encrypted: enc.api_key_encrypted },
        { onConflict: 'tenant_id,provider' }
      );
      if (error) throw error;
      setStatus((s) => ({ ...s, [id]: true }));
      setKeys((k) => ({ ...k, [id]: '' }));
      setSaved(id);
      setTimeout(() => setSaved(null), 2500);
    } catch (e) {
      alert(e.message || "Échec de l'enregistrement");
    } finally { setSaving(null); }
  };

  const remove = async (id) => {
    if (!store?.id || !confirm(`Retirer la clé ${id} ?`)) return;
    const { error } = await supabase.from('tenant_ai_providers').delete().eq('tenant_id', store.id).eq('provider', id);
    if (error) { alert(error.message); return; }
    setStatus((s) => ({ ...s, [id]: false }));
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#202223] flex items-center gap-2"><KeyRound className="w-5 h-5 text-[#008060]" /> Fournisseurs IA</h1>
        <p className="text-xs text-[#6D7175] mt-1">Configurez vos propres clés API. Sellia Assistant utilise automatiquement le premier fournisseur disponible.</p>
      </div>

      <div className="flex items-center gap-2 mb-5 p-3 rounded-xl bg-[#008060]/5 border border-[#008060]/20">
        <AlertCircle className="w-4 h-4 text-[#008060] shrink-0" />
        <p className="text-xs text-[#202223]">Ordre de priorité : Gemini → Claude → ChatGPT. Clés chiffrées côté serveur (AES-256), jamais stockées en clair ni renvoyées au navigateur.</p>
      </div>

      <div className="space-y-4">
        {PROVIDERS.map((p) => (
          <section key={p.id} className="bg-white rounded-2xl border border-[#E1E1E1] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${p.color}15` }}>
                  <p.icon className="w-5 h-5" style={{ color: p.color }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#202223]">{p.name}</h2>
                  <p className="text-xs text-[#6D7175]">{p.desc}</p>
                </div>
              </div>
              {status[p.id] && <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Configuré</span>}
            </div>
            <div className="flex gap-2">
              <input type="password" placeholder={status[p.id] ? '•••••••• (déjà configurée)' : `Clé API ${p.name}`} value={keys[p.id]} onChange={(e) => setKeys({ ...keys, [p.id]: e.target.value })} className="flex-1 px-3 py-2.5 rounded-lg border border-[#E1E1E1] bg-white text-sm outline-none focus:ring-2 focus:ring-[#008060]/30 font-mono" />
              <button onClick={() => save(p.id)} disabled={saving === p.id || !keys[p.id]} className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-[#00694d] disabled:opacity-50 shrink-0">
                {saving === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : saved === p.id ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} {saved === p.id ? 'OK' : 'Enregistrer'}
              </button>
              {status[p.id] && <button onClick={() => remove(p.id)} className="text-[#6D7175] hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
