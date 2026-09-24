import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, Loader2, AlertCircle, Sparkles, Copy, Check,
  Package, Search, Megaphone, Mail, Share2, Store, Lightbulb, ShoppingCart,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { hasFeature } from '@/lib/plans';
import PaywallCard from '@/components/admin/PaywallCard';

// supabase-js's own error object only ever carries a generic "Edge
// Function returned a non-2xx status code" - the real message lives in
// the function's own JSON error body, read here the same way this
// pattern is used everywhere else this session (Domains.jsx,
// PlatformPaymentPicker.jsx, etc).
async function functionErrorMessage(error) {
  try {
    const body = await error.context?.json?.();
    if (body?.error) return body.error;
  } catch { /* fall through to the generic message below */ }
  return error.message || 'Erreur inconnue';
}

const TASKS = [
  { id: 'product_description', label: 'Description produit', icon: Package, placeholder: 'Ex : Sac \u00e0 main en cuir v\u00e9ritable, fait main \u00e0 Dakar, doublure satin\u00e9e\u2026', hint: 'G\u00e9n\u00e8re titre, description, r\u00e9sum\u00e9 et tags' },
  { id: 'seo', label: 'Optimisation SEO', icon: Search, placeholder: 'Ex : Page collection Robes wax \u00e9t\u00e9', hint: 'Titre SEO, m\u00e9ta-description et mots-cl\u00e9s' },
  { id: 'ad_copy', label: 'Annonce publicitaire', icon: Megaphone, placeholder: 'Ex : Promotion -20% sur toute la collection mode', hint: 'Accroche, corps et CTA pour Facebook/Instagram' },
  { id: 'email_campaign', label: 'Campagne e-mail', icon: Mail, placeholder: 'Ex : Lancement nouvelle collection automne', hint: 'Objet et corps HTML de l\u2019e-mail' },
  { id: 'social_post', label: 'Post r\u00e9seaux sociaux', icon: Share2, placeholder: 'Ex : Nouveau produit disponible en pr\u00e9commande', hint: 'L\u00e9gende + hashtags' },
  { id: 'business_name', label: 'Noms de marque', icon: Store, placeholder: 'Ex : Boutique de cosm\u00e9tiques naturels africains', hint: '10 id\u00e9es de noms de marque' },
  { id: 'product_ideas', label: 'Id\u00e9es de produits', icon: Lightbulb, placeholder: 'Ex : Mode et accessoires pour jeunes urbains \u00e0 Lagos', hint: '8 id\u00e9es de produits \u00e0 vendre' },
  { id: 'abandoned_email', label: 'E-mail panier abandonn\u00e9', icon: ShoppingCart, placeholder: 'Ex : Boutique de mode premium AfriStyle', hint: 'E-mail de r\u00e9cup\u00e9ration de panier' },
];

function ResultCard({ result, provider }) {
  const [copied, setCopied] = useState(false);
  const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const providerLabel = { gemini: 'votre cl\u00e9 Gemini', claude: 'votre cl\u00e9 Claude', openai: 'votre cl\u00e9 ChatGPT', sellia: "l'IA int\u00e9gr\u00e9e Sellia" }[provider];
  return (
    <div className="mt-4 rounded-xl border border-[#E1E1E1] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#F4F4F4] border-b border-[#E1E1E1]">
        <span className="flex items-center gap-1.5 text-xs font-bold text-[#008060]"><Sparkles className="w-3.5 h-3.5" /> R\u00e9sultat{providerLabel ? ` \u2014 g\u00e9n\u00e9r\u00e9 via ${providerLabel}` : ''}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs font-semibold text-[#6D7175] hover:text-[#008060]">
          {copied ? <><Check className="w-3.5 h-3.5 text-[#008060]" /> Copi\u00e9</> : <><Copy className="w-3.5 h-3.5" /> Copier</>}
        </button>
      </div>
      <pre className="p-4 text-sm text-[#202223] whitespace-pre-wrap font-body max-h-96 overflow-y-auto">{text}</pre>
    </div>
  );
}

export default function AssistantIA() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [task, setTask] = useState('product_description');
  const [input, setInput] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [result, setResult] = useState(null);
  const [resultProvider, setResultProvider] = useState(null);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);

  const run = async () => {
    if (!input.trim()) { inputRef.current?.focus(); return; }
    setLoadingAI(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', { body: { tenant_id: store.id, task, input, context: store?.name || '' } });
      if (error) throw new Error(await functionErrorMessage(error));
      if (data.error) throw new Error(data.error);
      setResult(data.result);
      setResultProvider(data.provider);
      setHistory((h) => [{ task, input, result: data.result, at: Date.now() }, ...h].slice(0, 8));
    } catch (e) {
      setResult({ erreur: e.message });
    } finally { setLoadingAI(false); }
  };

  if (storeLoading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Configurez votre boutique</h1>
        <Link to="/onboarding" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-3">Configurer</Link>
      </div>
    );
  }
  if (!hasFeature(store.plan, 'ai_assistant')) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <PaywallCard requiredPlan="pro" title="Sellia Assistant nécessite le plan Pro" description="Générez descriptions produit, SEO, campagnes e-mail et plus avec l'IA intégrée Sellia ou votre propre clé. Passez au plan Pro pour y accéder." />
      </div>
    );
  }

  const activeTask = TASKS.find((t) => t.id === task);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#008060] to-[#0EA5E9] flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#202223]">Sellia Assistant</h1>
          <p className="text-xs text-[#6D7175]">G\u00e9n\u00e9rez du contenu premium pour votre boutique en quelques secondes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-[#E1E1E1] p-4">
            <p className="text-xs font-semibold text-[#6D7175] mb-3">Choisissez une t\u00e2che</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TASKS.map((t) => (
                <button key={t.id} onClick={() => { setTask(t.id); setResult(null); }} className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition text-center ${task === t.id ? 'border-[#008060] bg-[#008060]/5' : 'border-[#E1E1E1] hover:border-[#008060]/40 hover:bg-black/[0.02]'}`}>
                  <t.icon className={`w-5 h-5 ${task === t.id ? 'text-[#008060]' : 'text-[#6D7175]'}`} />
                  <span className={`text-[11px] font-medium leading-tight ${task === t.id ? 'text-[#008060]' : 'text-[#6D7175]'}`}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E1E1E1] p-4">
            <p className="text-sm font-bold text-[#202223] mb-1">{activeTask.label}</p>
            <p className="text-xs text-[#6D7175] mb-3">{activeTask.hint}</p>
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} rows={4} placeholder={activeTask.placeholder} className="w-full px-3 py-2.5 border border-[#E1E1E1] rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#008060]/30" />
            <div className="flex items-center justify-between mt-3">
              <p className="text-[11px] text-[#6D7175]">Boutique : <span className="font-semibold text-[#202223]">{store.name}</span></p>
              <button onClick={run} disabled={loadingAI || !input.trim()} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[#00694d] disabled:opacity-40">
                {loadingAI ? <><Loader2 className="w-4 h-4 animate-spin" /> G\u00e9n\u00e9ration\u2026</> : <><Sparkles className="w-4 h-4" /> G\u00e9n\u00e9rer</>}
              </button>
            </div>
          </div>

          {loadingAI && (
            <div className="bg-white rounded-xl border border-[#E1E1E1] p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#008060] mx-auto mb-3" />
              <p className="text-sm text-[#6D7175]">L\u2019IA r\u00e9dige votre contenu\u2026</p>
            </div>
          )}
          {!loadingAI && result && <ResultCard result={result} provider={resultProvider} />}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E1E1E1] p-4">
            <p className="text-xs font-semibold text-[#6D7175] uppercase tracking-wide mb-3">Historique</p>
            {history.length === 0 ? (
              <p className="text-xs text-[#6D7175] text-center py-6">Vos g\u00e9n\u00e9rations appara\u00eetront ici.</p>
            ) : (
              <div className="space-y-2">
                {history.map((h, i) => {
                  const t = TASKS.find((x) => x.id === h.task);
                  return (
                    <button key={i} onClick={() => { setTask(h.task); setInput(h.input); setResult(h.result); }} className="w-full text-left p-2.5 rounded-lg border border-[#E1E1E1] hover:border-[#008060]/40 hover:bg-[#008060]/5 transition">
                      <div className="flex items-center gap-2 mb-1">
                        {t && <t.icon className="w-3.5 h-3.5 text-[#008060]" />}
                        <span className="text-xs font-semibold text-[#202223]">{t?.label}</span>
                      </div>
                      <p className="text-[11px] text-[#6D7175] truncate">{h.input}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-[#008060]/5 to-[#0EA5E9]/5 rounded-xl border border-[#008060]/20 p-4">
            <Sparkles className="w-5 h-5 text-[#008060] mb-2" />
            <p className="text-xs font-semibold text-[#202223] mb-1">Astuce</p>
            <p className="text-[11px] text-[#6D7175] leading-relaxed">Plus votre description est pr\u00e9cise, meilleur est le r\u00e9sultat. Mentionnez le produit, le public cible et le ton souhait\u00e9.</p>
          </div>
        </div>
      </div>
    </div>
  );
}