import { PageHeader, Card } from './ui';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getMarketConfig, saveMarketConfig, type MarketConfig } from '../../lib/app-state';
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
  const [config, setConfig] = useState<MarketConfig>(getMarketConfig());

  useEffect(() => { setConfig(getMarketConfig()); }, []);

  const toggleCountry = (code: string) => {
    const isActive = config.activeCountries.includes(code);
    const activeCountries = isActive
      ? config.activeCountries.filter(c => c !== code)
      : [...config.activeCountries, code];
    const currencies = Array.from(new Set([
      ...activeCountries.map(c => AFRICAN_COUNTRIES.find(ac => ac.code === c)?.currency).filter(Boolean),
    ])) as string[];
    const newConfig = { ...config, activeCountries, currencies };
    setConfig(newConfig);
    saveMarketConfig(newConfig);
  };

  const setDefault = (code: string) => {
    const country = AFRICAN_COUNTRIES.find(c => c.code === code);
    if (!country) return;
    const newConfig = { ...config, defaultCountry: code, defaultCurrency: country.currency };
    setConfig(newConfig);
    saveMarketConfig(newConfig);
  };

  const defaultCountry = AFRICAN_COUNTRIES.find(c => c.code === config.defaultCountry);

  return (
    <div>
      <PageHeader title="Markets" subtitle="Activez les pays et devises pour votre boutique. 54 pays africains supportés." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Marché par défaut</p><p className="mt-2 text-lg font-bold">{defaultCountry?.flag} {defaultCountry?.name}</p><p className="text-xs text-gray-500">{config.defaultCurrency}</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Marchés actifs</p><p className="mt-2 text-lg font-bold">{config.activeCountries.length} pays</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Devises supportées</p><p className="mt-2 text-lg font-bold">{config.currencies.join(', ')}</p></Card>
      </div>
      {REGIONS.map(region => {
        const countries = AFRICAN_COUNTRIES.filter(c => c.region === region);
        return (
          <Card key={region} className="mb-4">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{REGION_LABELS[region]} <span className="text-gray-400 font-normal">({countries.length} pays)</span></h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
              {countries.map(c => {
                const isActive = config.activeCountries.includes(c.code);
                const isDefault = config.defaultCountry === c.code;
                return (
                  <div key={c.code} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-brand-50' : 'hover:bg-gray-50'}`} onClick={() => toggleCountry(c.code)}>
                    <span className="text-xl">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.currency}</div>
                    </div>
                    {isActive && <Check size={14} className="text-green-600" />}
                    {isActive && !isDefault && <button onClick={e => { e.stopPropagation(); setDefault(c.code); }} className="text-[9px] text-brand-600 hover:underline ml-1">Défaut</button>}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
