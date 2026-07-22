import { useState, FormEvent } from 'react';
import { useAuth } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Button, Input } from './ui';
import { COUNTRIES, COUNTRIES_CITIES, CURRENCIES } from '../../lib/constants';
import { Shield } from 'lucide-react';

export default function Onboarding() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('XOF');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cities = country ? COUNTRIES_CITIES[country] || [] : [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('tenants').insert({
      owner_id: user.id,
      name,
      sector,
      country,
      city,
      currency,
      plan: 'starter',
      status: 'trial',
      theme_id: 'universal',
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Shield size={28} className="text-brand-500" />
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">LiAfrikOS</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Bienvenue</h2>
          <p className="text-sm text-gray-500 mb-5">Configurons votre boutique</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nom de la boutique" value={name} onChange={setName} placeholder="Ma Boutique" />
            <Input label="Secteur d'activité" value={sector} onChange={setSector} placeholder="Mode, Électronique…" />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Pays</label>
              <select value={country} onChange={e => { setCountry(e.target.value); setCity(''); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 bg-white">
                <option value="">— Sélectionner —</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ville</label>
              <select value={city} onChange={e => setCity(e.target.value)} disabled={!country} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 bg-white disabled:bg-gray-50 disabled:text-gray-400">
                <option value="">— {country ? 'Sélectionner' : 'Choisir d\'abord un pays'} —</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Devise</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 bg-white">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
            <Button type="submit" disabled={loading || !name} className="w-full" size="lg">
              {loading ? 'Création…' : 'Créer ma boutique'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
