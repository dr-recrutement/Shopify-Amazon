import { PageHeader, StatCard, Card, Badge, Button } from './ui';
import { ShoppingCart, DollarSign, Package, Users, TrendingUp, ArrowRight, CheckCircle2, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardHome() {
  const checklist = [
    { label: 'Ajouter votre logo', done: false, link: '/app/online-store' },
    { label: 'Configurer un moyen de paiement', done: false, link: '/app/settings' },
    { label: 'Ajouter un produit', done: false, link: '/app/products' },
    { label: 'Personnaliser votre thème', done: false, link: '/app/online-store' },
    { label: 'Définir vos zones de livraison', done: false, link: '/app/settings' },
  ];

  return (
    <div>
      <PageHeader title="Bonjour 👋" subtitle="Voici l'activité de votre boutique aujourd'hui." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Ventes du jour" value="0 €" icon={DollarSign} color="green" />
        <StatCard label="Commandes en attente" value="0" icon={ShoppingCart} color="orange" />
        <StatCard label="Produits actifs" value="1" icon={Package} color="blue" />
        <StatCard label="Clients" value="0" icon={Users} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Performance</h3>
            <Badge color="green">7 jours d'essai restants</Badge>
          </div>
          <div className="h-64 flex items-end justify-around gap-2 pt-4">
            {[40, 65, 50, 80, 55, 70, 90].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-orange-100 rounded-t-lg" style={{ height: `${h}%` }}>
                  <div className="w-full h-full bg-orange-500 rounded-t-lg opacity-70" style={{ height: '60%' }} />
                </div>
                <span className="text-xs text-gray-400">{['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Prochaines étapes</h3>
          <div className="space-y-3">
            {checklist.map((c, i) => (
              <Link key={i} to={c.link} className="flex items-start gap-3 group">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${c.done ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-orange-500'}`}>
                  {c.done && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <span className="text-sm text-gray-700 group-hover:text-orange-600">{c.label}</span>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-orange-500 ml-auto mt-1" />
              </Link>
            ))}
          </div>
          <div className="mt-6 p-3 bg-orange-50 rounded-lg flex items-center gap-2 text-sm">
            <Store size={16} className="text-orange-600" />
            <span className="text-gray-700">Boutique en ligne : <strong>ma-boutique.liafrikos.com</strong></span>
          </div>
        </Card>
      </div>
    </div>
  );
}
