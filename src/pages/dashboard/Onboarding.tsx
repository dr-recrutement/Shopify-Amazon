import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Button, Input } from './ui';
import { COUNTRIES, COUNTRIES_CITIES, COUNTRY_INFO, CURRENCIES } from '../../lib/constants';
import { SITE_TYPES, SiteType, defaultThemeForType } from '../../lib/theme-engine';
import { Shield, Check } from 'lucide-react';

interface PlanOption {
  id: string;
  code: string;
  name: string;
  price_usd: number;
  features: string[];
}

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

/**
 * Extrait le code pays (ISO) depuis l'objet COUNTRY_INFO, quel que soit le nom
 * réel de la propriété dans constants.ts (code, countryCode, iso, alpha2...).
 * Renvoie null si aucune valeur exploitable n'est trouvée, plutôt que de
 * laisser passer `undefined` jusqu'à l'insert Supabase (ce qui causait
 * l'erreur "null value in column country_code").
 */
function extractCountryCode(info: any): string | null {
  if (!info) return null;
  const candidates = [info.code, info.countryCode, info.iso, info.iso2, info.alpha2, info.cca2];
  const found = candidates.find(v => typeof v === 'string' && v.trim().length > 0);
  return found ? found.trim().toUpperCase() : null;
}

export default function Onboarding() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [siteType, setSiteType] = useState<SiteType>('ecommerce');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [region, setRegion] = useState('');
  const [currency, setCurrency] = useState('XOF');
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('starter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error: plansErr } = await supabase
        .from('plans')
        .select('id,code,name,price_usd,features')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (plansErr) { console.error('[Onboarding] Erreur chargement plans:', plansErr); return; }
      setPlans((data as any[] || []).map(p => ({ ...p, features: Array.isArray(p.features) ? p.features : [] })));
    })();
  }, []);

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

    // Garde-fou : si un tenant existe déjà pour ce compte (ex: la boutique a bien
    // été créée mais l'utilisateur a été renvoyé ici par erreur), on ne le
    // recrée pas en double — on recharge simplement la page.
    const { data: existingTenant } = await supabase.from('tenants').select('id').eq('owner_id', user.id).limit(1);
    if (existingTenant && existingTenant.length > 0) {
      window.location.reload();
      return;
    }

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

    const trimmedRegion = region.trim();
    if (!trimmedRegion) {
      setError('Merci de renseigner une région.');
      return;
    }

    const info = COUNTRY_INFO[country];
    if (!info) {
      setError('Merci de sélectionner un pays valide.');
      return;
    }

    const countryCode = extractCountryCode(info);
    if (!countryCode) {
      // Ne devrait jamais arriver si constants.ts est bien formé, mais on bloque
      // explicitement plutôt que d'envoyer `undefined`/`null` à la base.
      setError("Impossible de déterminer le code pays. Contactez le support.");
      console.error('COUNTRY_INFO entry has no usable code field:', country, info);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const slug = await findAvailableSlug(trimmedName);

      const { data: inserted, error: insertError } = await supabase.from('tenants').insert({
        owner_id: user.id,
        name: trimmedName,
        slug,
        sector,
        site_type: siteType,
        country,
        country_code: countryCode,
        country_name: country,
        region: trimmedRegion,
        city: finalCity,
        currency,
        plan: selectedPlan,
        status: 'trial',
        theme_id: 'universal',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }).select('id').single();

      if (insertError) {
        if (insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
          setError("Ce nom de boutique est déjà pris, essayez une variante (ex: ajoutez votre ville).");
        } else {
          setError(insertError.message);
        }
        setLoading(false);
        return;
      }

      // Pré-remplit un thème par défaut cohérent avec l'activité choisie,
      // pour que le marchand arrive sur un site déjà configuré (pas une page vide).
      if (inserted?.id) {
        const theme = defaultThemeForType(siteType);
        const { error: themeError } = await supabase.from('theme_configs').insert({
          tenant_id: inserted.id,
          site_type: theme.siteType,
          sections: theme.sections,
          colors: theme.colors,
          spacing: theme.spacing,
          is_published: false,
        });
        // Non bloquant : si ça échoue, le tenant existe déjà et OnlineStore.tsx
        // créera un theme_configs par défaut à la première sauvegarde.
        if (themeError) console.error('theme_configs prefill failed:', themeError);
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Type d'activité</label>
              <div className="grid grid-cols-2 gap-2">
                {SITE_TYPES.map(st => (
                  <button
                    type="button"
                    key={st.id}
                    onClick={() => setSiteType(st.id)}
                    className={`text-left p-2.5 rounded-lg border-2 transition-all ${siteType === st.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="text-sm font-semibold text-gray-900">{st.label}</div>
                    <div className="text-xs text-gray-500">{st.desc}</div>
                  </button>
                ))}
              </div>
            </div>

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

            <Input label="Région" value={region} onChange={setRegion} placeholder="Ex: Abidjan, Littoral, Centre…" />

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Devise</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 bg-white">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Forfait</label>
              <div className="grid grid-cols-1 gap-2">
                {plans.map(p => (
                  <button
                    type="button"
                    key={p.code}
                    onClick={() => setSelectedPlan(p.code)}
                    className={`text-left p-3 rounded-lg border-2 transition-all flex items-start justify-between gap-2 ${selectedPlan === p.code ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {selectedPlan === p.code && <Check size={14} className="text-brand-600" />}
                        <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                      </div>
                      {p.features.length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">{p.features.slice(0, 3).join(' · ')}</p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-brand-600 whitespace-nowrap">
                      {p.price_usd === 0 ? 'Gratuit' : `${p.price_usd}$/mois`}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">7 jours d'essai gratuit sur tous les forfaits.</p>
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
