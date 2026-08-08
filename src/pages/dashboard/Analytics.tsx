import { PageHeader, Card, Button, Badge } from './ui';
import { BarChart3, Download, TrendingUp, TrendingDown } from 'lucide-react';

export default function Analytics() {
  const metrics = [
    { label: 'Chiffre d\'affaires', value: '125 000 XOF', change: '+12%', up: true },
    { label: 'Commandes', value: '24', change: '+8%', up: true },
    { label: 'Panier moyen', value: '5 200 XOF', change: '+3%', up: true },
    { label: 'Taux de conversion', value: '2.4%', change: '-0.5%', up: false },
  ];
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Statistiques de vente et prévisions." action={<Button variant="secondary"><Download size={14} /> Exporter</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map(m => (
          <Card key={m.label} className="p-5">
            <p className="text-xs text-gray-500 uppercase">{m.label}</p>
            <p className="mt-2 text-2xl font-bold">{m.value}</p>
            <div className={`mt-1 text-xs font-medium flex items-center gap-1 ${m.up ? 'text-green-600' : 'text-red-600'}`}>
              {m.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {m.change}
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Ventes par jour</h3>
          <div className="h-48 flex items-end gap-1">
            {[30, 45, 38, 60, 52, 75, 68, 80, 72, 90, 85, 95].map((h, i) => (
              <div key={i} className="flex-1 bg-brand-500 rounded-t" style={{ height: `${h}%`, opacity: 0.6 + (h / 200) }} />
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top produits</h3>
          <div className="space-y-3">
            {['Robe wax', 'Sac cuir', 'Boucles dorées', 'Collier perles'].map((p, i) => (
              <div key={p} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{i + 1}. {p}</span>
                <span className="text-sm font-medium">{(40 - i * 8)} ventes</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-blue-600" size={20} />
          <div>
            <h3 className="font-semibold text-gray-900">Prévision de stock IA</h3>
            <p className="text-sm text-gray-600">"Robe wax" sera en rupture dans 5 jours. Pensez à réapprovisionner.</p>
          </div>
          <Badge color="orange">Prévision</Badge>
        </div>
      </Card>
    </div>
  );
}
