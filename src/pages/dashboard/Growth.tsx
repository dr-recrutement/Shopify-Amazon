import { PageHeader, Card, Button } from './ui';
import { TrendingUp, Sparkles, ArrowRight, Target, Mail, Package } from 'lucide-react';

export default function Growth() {
  const recs = [
    { icon: Mail, title: 'Relancer les paniers abandonnés', desc: '3 paniers en attente. Lancez une campagne email pour les récupérer.', cta: 'Créer la campagne' },
    { icon: Package, title: 'Ajouter plus de produits', desc: 'Les boutiques avec 10+ produits vendent 2x plus. Ajoutez vos meilleurs articles.', cta: 'Ajouter un produit' },
    { icon: Target, title: 'Cibler les clients inactifs', desc: '1 client n\'a pas commandé depuis 60 jours. Une promotion pourrait le réveiller.', cta: 'Créer une promo' },
  ];
  return (
    <div>
      <PageHeader title="Growth" subtitle="Recommandations IA pour augmenter vos ventes." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Score de croissance</p><p className="mt-2 text-3xl font-semibold text-orange-600">65<span className="text-lg text-gray-400">/100</span></p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Opportunités</p><p className="mt-2 text-3xl font-semibold">3</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Potentiel de revenu</p><p className="mt-2 text-3xl font-semibold">+45 000 XOF</p></Card>
      </div>
      <div className="space-y-3">
        {recs.map((r, i) => {
          const Icon = r.icon;
          return (
            <Card key={i} className="p-5 flex items-start gap-4 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0"><Icon size={18} className="text-orange-600" /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{r.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{r.desc}</p>
              </div>
              <Button variant="secondary" size="sm" className="flex-shrink-0">{r.cta} <ArrowRight size={14} /></Button>
            </Card>
          );
        })}
      </div>
      <Card className="mt-6 p-5 bg-gradient-to-r from-orange-50 to-white">
        <div className="flex items-center gap-3">
          <Sparkles className="text-orange-600" size={20} />
          <p className="text-sm text-gray-700">L'assistant IA analyse votre boutique quotidiennement pour proposer des actions concrètes.</p>
        </div>
      </Card>
    </div>
  );
}
