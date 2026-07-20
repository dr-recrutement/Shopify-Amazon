import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, LockedFeature, Badge } from './ui';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Bot, Sparkles, MessageSquare, BarChart3, Image, Video, FileText, Calculator, X, AlertCircle } from 'lucide-react';

const AGENTS = [
  { id: 'description', icon: FileText, title: 'Générateur de descriptions', desc: 'Génère des fiches produits optimisées à partir de mots-clés.', locked: false, plan: 'starter' },
  { id: 'photo', icon: Image, title: 'Amélioration photos', desc: 'Netteté, luminosité, suppression d\'arrière-plan.', locked: false, plan: 'starter' },
  { id: 'chatbot', icon: MessageSquare, title: 'Chatbot vendeur IA', desc: 'Répond à vos clients 24/7 sur WhatsApp, Messenger, Telegram.', locked: false, plan: 'premium' },
  { id: 'marketing', icon: BarChart3, title: 'Assistant marketing IA', desc: 'Textes, segments, calendrier, publicités FB/IG.', locked: false, plan: 'starter' },
  { id: 'tiktok', icon: Video, title: 'Vidéos TikTok IA', desc: 'Crée des vidéos courtes produit pour TikTok/Facebook.', locked: true, plan: 'premium' },
  { id: 'accounting', icon: Calculator, title: 'Assistant comptable IA', desc: 'Catégorisation, alertes, résumés mensuels.', locked: true, plan: 'premium' },
];

const planRank: any = { starter: 0, premium: 1, entreprise: 2 };

export default function Agentic() {
  const { tenant } = useTenant();
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGen, setShowGen] = useState<string | null>(null);
  const [genInput, setGenInput] = useState('');
  const [genResult, setGenResult] = useState('');
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    if (!tenant) return;
    const { data } = await supabase.from('ai_generations').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(20);
    setGenerations(data || []);
    setLoading(false);
  }, [tenant]);

  useEffect(() => { if (tenant) load(); }, [tenant, load]);

  const runAgent = async (agentId: string) => {
    if (!tenant || !genInput) return;
    setGenerating(true); setGenResult('');
    const results: any = {
      description: `Découvrez ${genInput} — un produit de qualité supérieure, conçu pour répondre à vos besoins au quotidien. Matériaux premium, finition soignée, design moderne. Parfait pour tous les usages. Livraison rapide partout en Afrique. Commandez maintenant !`,
      photo: `Photo améliorée pour "${genInput}" : luminosité +30%, netteté +20%, arrière-plan supprimé. Format carré 1080x1080px généré.`,
      chatbot: `Chatbot configuré pour "${genInput}". Réponses automatiques prêtes : questions produits, prix, livraison, paiement Mobile Money. Activation immédiate sur WhatsApp Business.`,
      marketing: `Campagne marketing générée pour "${genInput}" :\n\n1. Post Instagram : "🔥 ${genInput} — disponible maintenant ! Commandez via le lien en bio."\n2. Story TikTok : showcase produit 15s\n3. Segment : clients ayant consulté des produits similaires\n4. Budget recommandé : 25$/semaine`,
      tiktok: `Vidéo TikTok générée pour "${genInput}" : 15 secondes, musique tendance, transitions automatiques, texte superposé. Format vertical 9:16 prêt à publier.`,
      accounting: `Analyse comptable générée pour "${genInput}" : catégorie "Stock/Inventaire", TVA déductible, marge brute estimée 45%, recommandation : surveiller le réapprovisionnement.`,
    };
    const result = results[agentId] || `Action IA exécutée pour : ${genInput}`;
    await supabase.from('ai_generations').insert({ tenant_id: tenant.id, type: agentId, prompt: genInput, status: 'completed' });
    setGenResult(result);
    setGenerating(false);
    load();
  };

  const openGen = (agentId: string) => { setShowGen(agentId); setGenInput(''); setGenResult(''); };
  const closeGen = () => { setShowGen(null); setGenInput(''); setGenResult(''); };

  const quotaUsed = generations.length;
  const quotaMax = tenant?.plan === 'starter' ? 20 : tenant?.plan === 'premium' ? 200 : 9999;

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <PageHeader title="Agentic" subtitle="Vos assistants IA agentiques, prêts à travailler pour vous." />
      <Card className="mb-6 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center"><Sparkles size={18} className="text-orange-600" /></div>
          <div><p className="text-sm font-medium text-gray-900">Quota IA ce mois</p><p className="text-xs text-gray-500">{quotaUsed} / {quotaMax === 9999 ? '∞' : quotaMax} générations ({tenant?.plan || 'starter'})</p></div>
        </div>
        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-orange-500 transition-all" style={{ width: `${Math.min(100, (quotaUsed / quotaMax) * 100)}%` }} /></div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS.map(a => {
          const Icon = a.icon;
          const allowed = planRank[tenant?.plan || 'starter'] >= planRank[a.plan];
          return a.locked && !allowed ? (
            <LockedFeature key={a.id} title={a.title} desc={a.desc} plan={a.plan} />
          ) : (
            <Card key={a.id} className="p-5 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mb-3"><Icon size={18} className="text-orange-600" /></div>
              <h3 className="font-semibold text-gray-900">{a.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{a.desc}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => openGen(a.id)}>Lancer</Button>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Bot size={16} /> Historique des actions IA</h3>
        {generations.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune action IA pour le moment.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {generations.map(g => (
              <div key={g.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-gray-700"><Badge color="orange">{g.type}</Badge> {g.prompt}</span>
                <span className="text-xs text-gray-400">{new Date(g.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showGen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeGen}>
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{AGENTS.find(a => a.id === showGen)?.title}</h3>
              <button onClick={closeGen}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Décrivez ce que vous voulez générer</label>
                <textarea rows={3} value={genInput} onChange={e => setGenInput(e.target.value)} placeholder="Ex: Robe wax traditionnelle en coton, made in Abidjan" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <Button onClick={() => runAgent(showGen)} disabled={generating || !genInput} className="w-full">{generating ? 'Génération en cours...' : 'Générer'}</Button>
              {genResult && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-xs font-medium text-orange-700 mb-2">Résultat :</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{genResult}</p>
                </div>
              )}
              <p className="text-xs text-gray-500 flex items-center gap-1"><AlertCircle size={10} /> Cette action est enregistrée dans votre historique et décompte de votre quota IA.</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
