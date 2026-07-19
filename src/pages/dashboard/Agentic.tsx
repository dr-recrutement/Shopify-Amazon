import { PageHeader, Card, Button, LockedFeature } from './ui';
import { Bot, Sparkles, MessageSquare, BarChart3, Image, Video, FileText, Calculator } from 'lucide-react';

export default function Agentic() {
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
      <PageHeader title="Agentic" subtitle="Vos assistants IA agentiques, prêts à travailler pour vous." />
      <Card className="mb-6 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center"><Sparkles size={18} className="text-orange-600" /></div>
          <div>
            <p className="text-sm font-medium text-gray-900">Quota IA ce mois</p>
            <p className="text-xs text-gray-500">12 / 20 générations utilisées (Starter)</p>
          </div>
        </div>
        <Button variant="secondary" size="sm">Passer au plan Premium</Button>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(a => {
          const Icon = a.icon;
          return a.locked ? (
            <LockedFeature key={a.title} title={a.title} desc={a.desc} plan={a.plan} />
          ) : (
            <Card key={a.title} className="p-5 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mb-3"><Icon size={18} className="text-orange-600" /></div>
              <h3 className="font-semibold text-gray-900">{a.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{a.desc}</p>
              <Button variant="secondary" size="sm" className="mt-3">Lancer</Button>
            </Card>
          );
        })}
      </div>
      <Card className="mt-6 p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Bot size={16} /> Historique des actions IA</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
            <span className="text-gray-700">Description générée : "Robe wax traditionnelle"</span>
            <span className="text-xs text-gray-400">Il y a 2h</span>
          </div>
          <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
            <span className="text-gray-700">Logo de boutique généré</span>
            <span className="text-xs text-gray-400">Hier</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
