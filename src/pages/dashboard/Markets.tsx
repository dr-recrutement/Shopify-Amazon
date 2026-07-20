import { PageHeader, Card, Badge, Button } from './ui';
import { Globe, Check } from 'lucide-react';
import { AFRICAN_COUNTRIES } from '../../lib/constants';

const REGIONS = ['North Africa', 'West Africa', 'Central Africa', 'East Africa', 'Southern Africa'];
const REGION_LABELS: any = {
  'North Africa': 'Afrique du Nord',
  'West Africa': 'Afrique de l\'Ouest',
  'Central Africa': 'Afrique Centrale',
  'East Africa': 'Afrique de l\'Est',
  'Southern Africa': 'Afrique Australe',
};

export default function Markets() {
  return (
    <div>
      <PageHeader title="Markets" subtitle="Activez les pays et devises pour votre boutique. 54 pays africains supportés." action={<Button>Activer un marché</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Marché par défaut</p><p className="mt-2 text-lg font-semibold">🇨🇮 Côte d'Ivoire</p><p className="text-xs text-gray-500">XOF</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Marchés actifs</p><p className="mt-2 text-lg font-semibold">3 pays</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Devises supportées</p><p className="mt-2 text-lg font-semibold">XOF, GHS, NGN</p></Card>
      </div>
      {REGIONS.map(region => {
        const countries = AFRICAN_COUNTRIES.filter(c => c.region === region);
        return (
          <Card key={region} className="mb-4">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{REGION_LABELS[region]} <span className="text-gray-400 font-normal">({countries.length} pays)</span></h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
              {countries.map(c => (
                <div key={c.code} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                  <span className="text-xl">{c.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.currency}</div>
                  </div>
                  {['CI', 'GH', 'NG'].includes(c.code) && <Check size={14} className="text-green-600" />}
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
