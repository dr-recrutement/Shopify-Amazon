import { PageHeader, Card, Button, LockedFeature } from './ui';
import { Bot, Sparkles, MessageSquare, BarChart3, Image, Video, FileText, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePlanAccess } from '../../lib/plan-access';

export default function Agentic() {
  const planAccess = usePlanAccess();
  // None of these agents have a real backend yet (no AI generation API is
  // wired anywhere in the codebase) — every one is disabled with an honest
  // label rather than a dead 'Lancer' button that does nothing.
  const agents = [
    { icon: MessageSquare, title: 'Chatbot vendeur IA', desc: 'Répond à vos clients 24/7 sur WhatsApp, Messenger, Telegram.', locked: false, plan: 'Premium' },
    { icon: FileText, title: 'Générateur de descriptions', desc: 'Génère des fiches produits optimisées à partir de mots-clés.', locked: false, plan: 'Tous plans' },
    { icon: Image, title: 'Amélioration photos', desc: 'Netteté, luminosité, suppression d\'arrière-plan.', locked: false, plan: 'Tous plans' },
    { icon: Video, title: 'Vidéos TikTok IA', desc: 'Crée des vidéos courtes produit pour TikTok/Facebook.', locked: true, plan: 'Premium' },
    { icon: BarChart3, title: 'Assistant marketing IA', desc: 'Textes, segments, calendrier, publicités FB/IG.', locked: false, plan: 'Tous plans' },
    { icon: Calculator, title: 'Assistant comptable IA', desc: 'Catégorisation, alertes, résumés mensuels.', locked: true, plan: 'Premium' },
  ];
  return (
    <div>
      <PageHeader title="Agentic" subtitle="Vos assistants IA agentiques — en cours de construction." />
      <Card className="mb-6 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center"><Sparkles size={18} className="text-brand-600" /></div>
          <div>
            <p className="text-sm font-medium text-gray-900">Quota IA du plan {planAccess.plan.name}</p>
            <p className="text-xs text-gray-500">
              {planAccess.plan.aiGenerations === -1 ? 'Illimité' : `${planAccess.plan.aiGenerations} générations/mois`} — aucun moteur de génération n'est encore branché, ce quota n'est pas encore consommable.
            </p>
          </div>
        </div>
        {!planAccess.isSuperAdmin && (
          <Link to="/app/settings"><Button variant="secondary" size="sm">Voir mon plan</Button></Link>
        )}
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(a => {
          const Icon = a.icon;
          return a.locked ? (
            <LockedFeature key={a.title} title={a.title} desc={a.desc} plan={a.plan} />
          ) : (
            <Card key={a.title} className="p-5">
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-3"><Icon size={18} className="text-brand-600" /></div>
              <h3 className="font-semibold text-gray-900">{a.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{a.desc}</p>
              <Button variant="secondary" size="sm" className="mt-3" disabled title="Bientôt disponible">Bientôt disponible</Button>
            </Card>
          );
        })}
      </div>
      <Card className="mt-6 p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Bot size={16} /> Historique des actions IA</h3>
        <p className="text-sm text-gray-400">Aucune action IA pour l'instant — cette section s'activera dès qu'un agent aura réellement tourné.</p>
      </Card>
    </div>
  );
}
