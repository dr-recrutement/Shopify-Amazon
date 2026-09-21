import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Save, Check, Bot, Cpu, Sparkles, KeyRound, AlertCircle } from 'lucide-react';

const PROVIDERS = [
  { id: 'gemini', name: 'Gemini', desc: 'Google — rapide et économique', color: '#4285F4', icon: Sparkles },
  { id: 'claude', name: 'Claude', desc: 'Anthropic — qualité rédactionnelle', color: '#D97757', icon: Bot },
  { id: 'openai', name: 'ChatGPT', desc: 'OpenAI — polyvalent', color: '#10A37F', icon: Cpu },
];

export default function AiProviders() {
  const [status, setStatus] = useState({ gemini: false, claude: false, openai: false });
  const [keys, setKeys] = useState({ gemini: '', claude: '', openai: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(null);

  const load = async () => {
    try {
      const res = await base44.functions.invoke('aiSettings', {});
      if (res?.status) setStatus(res.status);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (id) => {
    setSaving(id); setSaved(null);
    try {
      await base44.functions.invoke('aiSettings', { provider: id, api_key: keys[id] });
      setStatus((s) => ({ ...s, [id]: !!keys[id] }));
      setSaved(id);
      setTimeout(() => setSaved(null), 2500);
    } finally { setSaving(null); }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#202223] flex items-center gap-2"><KeyRound className="w-5 h-5 text-[#008060]" /> Fournisseurs IA</h1>
        <p className="text-xs text-[#6D7175] mt-1">Configurez vos clés API. L'assistant utilise automatiquement le premier fournisseur disponible, puis l'IA intégrée par défaut.</p>
      </div>

      <div className="flex items-center gap-2 mb-5 p-3 rounded-xl bg-[#008060]/5 border border-[#008060]/20">
        <AlertCircle className="w-4 h-4 text-[#008060] shrink-0" />
        <p className="text-xs text-[#202223]">Ordre de secours : Gemini → Claude → ChatGPT → IA intégrée. Clés chiffrées et stockées de façon sécurisée.</p>
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
              <input type="password" placeholder={`Clé API ${p.name}`} value={keys[p.id]} onChange={(e) => setKeys({ ...keys, [p.id]: e.target.value })} className="flex-1 px-3 py-2.5 rounded-lg border border-[#E1E1E1] bg-white text-sm outline-none focus:ring-2 focus:ring-[#008060]/30 font-mono" />
              <button onClick={() => save(p.id)} disabled={saving === p.id || !keys[p.id]} className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-[#00694d] disabled:opacity-50 shrink-0">
                {saving === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : saved === p.id ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} {saved === p.id ? 'OK' : 'Enregistrer'}
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}