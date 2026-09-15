import { useEffect, useState } from 'react';
import { Sparkles, Copy, RefreshCw, Wand2, FileText, Type, Megaphone, PenLine, AlertTriangle } from 'lucide-react';
import { PageHeader, Card, Button, Spinner, EmptyState } from './ui';
import { generateAIContent, type AiAction } from '../../lib/ai';
import { getProducts, type StoreProduct } from '../../lib/app-state';
import { useToast } from '../../lib/toast';

const ACTIONS: Array<{ id: AiAction; label: string; icon: any; desc: string }> = [
  { id: 'product-description', label: 'Description produit', icon: FileText, desc: 'Génère une description e-commerce complète à partir du nom du produit.' },
  { id: 'improve-text', label: 'Améliorer un texte', icon: PenLine, desc: 'Corrige et rend plus vendeur un texte que vous avez déjà écrit.' },
  { id: 'seo-title', label: 'Titre SEO', icon: Type, desc: 'Génère un titre optimisé pour les moteurs de recherche (60 car. max).' },
  { id: 'marketing-tagline', label: 'Accroches marketing', icon: Megaphone, desc: '3 accroches courtes prêtes pour vos réseaux sociaux.' },
];

const TONES = ['chaleureux et professionnel', 'luxueux et raffiné', 'jeune et dynamique', 'sobre et factuel'];

export default function AIStudio() {
  const { showToast } = useToast();
  const [action, setAction] = useState<AiAction>('product-description');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [keywords, setKeywords] = useState('');
  const [existingText, setExistingText] = useState('');
  const [tone, setTone] = useState(TONES[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [notConfigured, setNotConfigured] = useState(false);
  const [products, setProducts] = useState<StoreProduct[]>([]);

  useEffect(() => { setProducts(getProducts()); }, []);

  const needsProductName = action === 'product-description' || action === 'seo-title' || action === 'marketing-tagline';
  const needsExistingText = action === 'improve-text';
  const canGenerate = needsProductName ? productName.trim().length > 0 : existingText.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate || loading) return;
    setLoading(true);
    setNotConfigured(false);
    const res = await generateAIContent({ action, productName, category, keywords, existingText, tone });
    setLoading(false);

    if (!res.ok && res.notConfigured) {
      setNotConfigured(true);
      setResult('');
      return;
    }
    if (!res.ok) {
      showToast(res.error, 'error');
      return;
    }
    setResult(res.text);
    showToast('Contenu généré ✓', 'success');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      showToast('Copié dans le presse-papiers', 'success');
    } catch {
      showToast('Impossible de copier — sélectionnez et copiez manuellement.', 'error');
    }
  };

  const selectProduct = (p: StoreProduct) => {
    setProductName(p.name);
    setCategory(p.category || '');
    if (action === 'improve-text') setExistingText(p.description || '');
  };

  return (
    <div>
      <PageHeader
        title="Assistant IA"
        subtitle="Générez ou améliorez vos textes produits, titres SEO et accroches marketing — gratuit, illimité."
      />

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: form */}
        <Card className="lg:col-span-2 p-5 space-y-5 h-fit">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Type de contenu</label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIONS.map(a => (
                <button
                  key={a.id}
                  onClick={() => { setAction(a.id); setResult(''); setNotConfigured(false); }}
                  className={`text-left p-3 rounded-lg border transition-colors ${action === a.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <a.icon size={16} className={action === a.id ? 'text-brand-600' : 'text-gray-400'} />
                  <p className={`mt-1.5 text-xs font-bold ${action === a.id ? 'text-brand-700' : 'text-gray-800'}`}>{a.label}</p>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">{ACTIONS.find(a => a.id === action)?.desc}</p>
          </div>

          {products.length > 0 && needsProductName && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Pré-remplir depuis un produit</label>
              <select
                onChange={e => { const p = products.find(x => x.id === e.target.value); if (p) selectProduct(p); }}
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="" disabled>Choisir un produit existant…</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {needsProductName && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Nom du produit *</label>
                <input
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="Ex: Robe Wax Kente Royale"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Catégorie (optionnel)</label>
                <input
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Ex: Mode femme"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Points clés (optionnel)</label>
                <input
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  placeholder="Ex: coton 100%, fait main, livraison rapide"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </>
          )}

          {needsExistingText && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Texte à améliorer *</label>
              <textarea
                value={existingText}
                onChange={e => setExistingText(e.target.value)}
                rows={5}
                placeholder="Collez ici votre description actuelle…"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {(action === 'product-description' || action === 'improve-text' || action === 'marketing-tagline') && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Ton</label>
              <select
                value={tone}
                onChange={e => setTone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {TONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          <Button onClick={handleGenerate} disabled={!canGenerate || loading} className="w-full justify-center flex items-center gap-2">
            {loading ? <Spinner size={16} /> : <Wand2 size={16} />}
            {loading ? 'Génération…' : 'Générer'}
          </Button>
        </Card>

        {/* Right: result */}
        <Card className="lg:col-span-3 p-5 min-h-[420px] flex flex-col">
          {notConfigured ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={24} className="text-amber-500" />
              </div>
              <h3 className="font-semibold text-gray-900">Assistant IA pas encore activé</h3>
              <p className="mt-1.5 text-sm text-gray-500 max-w-sm">
                Cette fonctionnalité nécessite une clé API Gemini configurée côté serveur.
                Ajoutez la variable d'environnement <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">GEMINI_API_KEY</code> dans
                les paramètres Cloudflare Pages du projet, puis réessayez.
              </p>
            </div>
          ) : loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Spinner size={28} />
              <p className="mt-3 text-sm font-medium">L'IA rédige votre contenu…</p>
            </div>
          ) : result ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-brand-500" /> Résultat
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleGenerate} className="flex items-center gap-1.5">
                    <RefreshCw size={13} /> Régénérer
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleCopy} className="flex items-center gap-1.5">
                    <Copy size={13} /> Copier
                  </Button>
                </div>
              </div>
              <div className="flex-1 p-4 bg-gray-50 rounded-lg border border-gray-100 whitespace-pre-line text-sm text-gray-800 leading-relaxed">
                {result}
              </div>
              <p className="mt-3 text-xs text-gray-400">Astuce : ouvrez la fiche produit correspondante dans Products pour coller ce texte directement dans la description.</p>
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="Prêt à générer votre premier contenu"
              desc="Remplissez le formulaire à gauche et cliquez sur Générer. Le résultat apparaîtra ici, prêt à copier."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
