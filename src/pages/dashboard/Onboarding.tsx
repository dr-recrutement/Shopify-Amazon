import { useState, FormEvent } from 'react';
import { useAuth } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Button, Input } from './ui';
import { COUNTRIES, COUNTRIES_CITIES, COUNTRY_INFO, CURRENCIES } from '../../lib/constants';
import { Shield } from 'lucide-react';

const AUTRE_LOCALITE = '__autre__';

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const randomSuffix = () => Math.random().toString(36).slice(2, 6);

/**
 * Trouve un slug unique pour la boutique en vérifiant en base.
 * Si "ma-boutique" existe déjà, essaie "ma-boutique-a1b2", etc.
 */
async function findAvailableSlug(baseName: string): Promise<string> {
  const base = slugify(baseName) || 'boutique';
  let candidate = base;
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase.from('tenants').select('id').eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${randomSuffix()}`;
  }
  return `${base}-${Date.now()}`;
}

export default function Onboarding() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [currency, setCurrency] = useState('XOF');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cities = country ? COUNTRIES_CITIES[country] || [] : [];

  const handleCountryChange = (value: string) => {
    setCountry(value);
    setCity('');
    setCustomCity('');
    const info = COUNTRY_INFO[value];
    if (info) setCurrency(info.currency);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Merci de renseigner le nom de la boutique.');
      return;
    }

    const finalCity = city === AUTRE_LOCALITE ? customCity.trim() : city;
    if (!finalCity) {
      setError('Merci de renseigner une ville ou localité.');
      return;
    }

    const info = COUNTRY_INFO[country];
    if (!info) {
      setError('Merci de sélectionner un pays valide.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const slug = await findAvailableSlug(trimmedName);

      const { error: insertError } = await supabase.from('tenants').insert({
        owner_id: user.id,
        name: trimmedName,
        slug,
        sector,
        country,
        country_code: info.code,
        country_name: country,
        city: finalCity,
        currency,
        plan: 'starter',
        status: 'trial',
        theme_id: 'universal',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (insertError) {
        if (insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
          setError("Ce nom de boutique est déjà pris, essayez une variante (ex: ajoutez votre ville).");
        } else {
          setError(insertError.message);
        }
        setLoading(false);
        return;
      }

      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
      setLoading(false);
    }
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
              <select
                value={country}
                onChange={e => handleCountryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 bg-white"
              >
                <option value="">— Sélectionner —</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ville / Localité</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                disabled={!country}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 bg-white disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">— {country ? 'Sélectionner' : 'Choisir d\'abord un pays'} —</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                {country && <option value={AUTRE_LOCALITE}>Autre / Ma localité n'est pas listée</option>}
              </select>
              {city === AUTRE_LOCALITE && (
                <input
                  type="text"
                  value={customCity}
                  onChange={e => setCustomCity(e.target.value)}
                  placeholder="Saisissez le nom de votre ville ou localité"
                  className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                />
              )}
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
