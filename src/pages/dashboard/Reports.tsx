import { PageHeader, Card, Button } from './ui';
import { FileBarChart, Download, Filter } from 'lucide-react';

export default function Reports() {
  const reports = [
    'Ventes par produit', 'Ventes par canal', 'Ventes par région', 'Comportement client',
    'Performance des campagnes', 'Rapport personnalisé', 'Tendances mensuelles', 'Top clients',
  ];
  return (
    <div>
      <PageHeader title="Reports" subtitle="Bibliothèque de rapports détaillés." action={<Button variant="secondary"><Filter size={14} /> Filtrer</Button>} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(r => (
          <Card key={r} className="p-5 hover:shadow-md transition-all cursor-pointer">
            <FileBarChart size={20} className="text-brand-600 mb-3" />
            <h3 className="font-semibold text-gray-900">{r}</h3>
            <p className="text-xs text-gray-500 mt-1">Générez et exportez ce rapport en PDF/Excel/CSV.</p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" size="sm">Générer</Button>
              <Button variant="ghost" size="sm"><Download size={14} /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
