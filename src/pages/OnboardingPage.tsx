import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { AFRICAN_COUNTRIES, GLOBAL_COUNTRIES, PLANS } from '../lib/constants';
import { saveShopProfile } from '../lib/app-state';
import { Check, ChevronRight, Store, MapPin, Palette, Package, CreditCard, Sparkles, ArrowRight, ChevronDown } from 'lucide-react';

const STEPS = [
  { id: 'account', label: 'Compte', icon: Store },
  { id: 'shop', label: 'Boutique', icon: Store },
  { id: 'location', label: 'Localisation', icon: MapPin },
  { id: 'theme', label: 'Thème', icon: Palette },
  { id: 'product', label: 'Produit', icon: Package },
  { id: 'payment', label: 'Paiement', icon: CreditCard },
  { id: 'plan', label: 'Plan', icon: Sparkles },
  { id: 'done', label: 'Lancement', icon: Check },
];

export default function OnboardingPage() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    shopName: '', sector: '', country: '', region: '', city: '', landmark: '', currency: '',
    theme: 'universal', productName: '', productPrice: '', gateway: 'flutterwave',
    plan: 'premium', billing: 'monthly',
  });

  const [countrySearch, setCountrySearch] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  const filteredCountries = GLOBAL_COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.nameEn.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const total = STEPS.length;
  const progress = (step / total) * 100;

  const next = () => setStep(s => Math.min(s + 1, total));
  const back = () => setStep(s => Math.max(s - 1, 1));
  const finish = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('tenants').insert({
        owner_id: user.id,
        name: data.shopName || 'Ma Boutique',
        sector: data.sector,
        country: data.country,
        region: data.region,
        city: data.city,
        landmark: data.landmark,
        currency: data.currency || 'XOF',
        theme_id: data.theme,
        plan: data.plan,
        billing_cycle: data.billing,
        status: 'trial',
      });
    }
    saveShopProfile({
      name: data.shopName || 'Ma Boutique',
      country: data.country,
      plan: data.plan,
      currency: data.currency || 'XOF',
    });
    nav('/app');
  };

  const country = GLOBAL_COUNTRIES.find(c => c.code === data.country);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="text-sm text-gray-500">Étape {step} sur {total}</div>
        </div>
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-orange-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i + 1 < step;
            const active = i + 1 === step;
            return (
              <div key={s.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active ? 'bg-orange-600 text-white' : done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                <Icon size={12} /> {s.label}
              </div>
            );
          })}
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
          {step === 1 && (
            <div>
              <h1 className="font-serif-display text-2xl font-bold text-gray-900">Bienvenue !</h1>
              <p className="mt-1 text-gray-600">Configurons votre boutique en quelques étapes.</p>
              <div className="mt-6 p-4 bg-orange-50 rounded-xl flex items-center gap-3">
                <Sparkles className="text-orange-600" size={20} />
                <p className="text-sm text-gray-700">Vous bénéficiez de <strong>7 jours d'essai gratuit</strong> sur le plan choisi, sans carte bancaire.</p>
              </div>
              <button onClick={next} className="mt-8 w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2">
                Commencer <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-serif-display text-2xl font-bold text-gray-900">Nom de votre boutique</h2>
              <p className="text-gray-600 text-sm">Choisissez le nom de votre boutique et votre secteur d'activité.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique</label>
                <input value={data.shopName} onChange={e => setData({ ...data, shopName: e.target.value })} placeholder="Ex. Boutique Aïcha"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                {data.shopName && <p className="mt-2 text-xs text-gray-500">URL : {data.shopName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.os.liafrik.com</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secteur d'activité</label>
                <select value={data.sector} onChange={e => setData({ ...data, sector: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">Sélectionnez...</option>
                  {['Mode & vêtements', 'High-tech & électronique', 'Restauration', 'Pharmacie & santé', 'Artisanat', 'Beauté & cosmétiques', 'Services', 'Grossiste', 'Créateur de contenu', 'Autre'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={back} className="px-4 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50">Retour</button>
                <button onClick={next} disabled={!data.shopName} className="flex-1 py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50">Continuer</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-serif-display text-2xl font-bold text-gray-900">Localisation de votre entreprise</h2>
              <p className="text-gray-600 text-sm">Saisissez ou sélectionnez votre pays. La devise locale sera appliquée automatiquement.</p>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pays (Saisie & Recherche)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={countrySearch || (country ? `${country.flag} ${country.name} (${country.nameEn})` : '')}
                    onChange={e => {
                      setCountrySearch(e.target.value);
                      setCountryDropdownOpen(true);
                    }}
                    onFocus={() => setCountryDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setCountryDropdownOpen(false), 200)}
                    placeholder="Saisissez un pays pour rechercher..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                {countryDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl divide-y divide-gray-50">
                    {filteredCountries.length === 0 ? (
                      <div className="p-2.5 text-xs text-gray-500 italic">Aucun pays trouvé</div>
                    ) : (
                      filteredCountries.map(c => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setData({ ...data, country: c.code, currency: c.currency });
                            setCountrySearch(`${c.flag} ${c.name} (${c.nameEn})`);
                            setCountryDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-orange-50 text-xs flex items-center gap-2"
                        >
                          <span className="text-sm">{c.flag}</span>
                          <span className="font-semibold text-gray-800">{c.name}</span>
                          <span className="text-gray-400">({c.nameEn})</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {country && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Région / Province</label>
                      <input value={data.region} onChange={e => setData({ ...data, region: e.target.value })} placeholder="Ex. Abidjan, Lagos, Gauteng"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                      <input value={data.city} onChange={e => setData({ ...data, city: e.target.value })} placeholder="Ex. Abidjan, Lagos, Johannesburg"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Landmark / Quartier de repère</label>
                    <input value={data.landmark} onChange={e => setData({ ...data, landmark: e.target.value })} placeholder="Ex. Mosquée Al Farouq, Abidjan"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
                    Devise par défaut : <strong>{country.currency}</strong> ({country.name})
                  </div>
                </>
              )}
              <div className="flex gap-2 pt-4">
                <button onClick={back} className="px-4 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50">Retour</button>
                <button onClick={next} disabled={!data.country} className="flex-1 py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50">Continuer</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-serif-display text-2xl font-bold text-gray-900">Choisissez un thème</h2>
              <p className="text-gray-600 text-sm">Tous les thèmes sont gratuits. Vous pourrez tout personnaliser ensuite.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'universal', name: 'Template Universel', desc: 'Adapté à tous secteurs, design premium par défaut', recommended: true },
                  { id: 'mode', name: 'Mode & Lifestyle', desc: 'Élégant, éditorial, parfait pour la mode' },
                  { id: 'tech', name: 'High-Tech', desc: 'Moderne, minimaliste, high-tech' },
                  { id: 'food', name: 'Restauration', desc: 'Chaleureux, gourmand, pour restaurants' },
                ].map(t => (
                  <button key={t.id} onClick={() => setData({ ...data, theme: t.id })}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${data.theme === t.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 text-sm">{t.name}</span>
                      {t.recommended && <span className="text-xs px-2 py-0.5 bg-orange-600 text-white rounded-full">Recommandé</span>}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{t.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={back} className="px-4 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50">Retour</button>
                <button onClick={next} className="flex-1 py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700">Continuer</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="font-serif-display text-2xl font-bold text-gray-900">Votre premier produit</h2>
              <p className="text-gray-600 text-sm">Ajoutez un produit pour démarrer. L'IA peut générer la description.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit</label>
                <input value={data.productName} onChange={e => setData({ ...data, productName: e.target.value })} placeholder="Ex. Robe wax traditionnelle"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix ({data.currency || 'XOF'})</label>
                <input type="number" value={data.productPrice} onChange={e => setData({ ...data, productPrice: e.target.value })} placeholder="15000"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <button className="w-full p-3 border-2 border-dashed border-orange-200 rounded-lg text-sm text-orange-700 hover:bg-orange-50 flex items-center justify-center gap-2">
                <Sparkles size={16} /> Générer la description par IA
              </button>
              <div className="flex gap-2 pt-4">
                <button onClick={back} className="px-4 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50">Retour</button>
                <button onClick={next} className="flex-1 py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700">Continuer</button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h2 className="font-serif-display text-2xl font-bold text-gray-900">Moyen de paiement</h2>
              <p className="text-gray-600 text-sm">Connectez au moins une passerelle. L'argent va directement dans votre compte.</p>
              <div className="space-y-2">
                {[
                  { id: 'flutterwave', name: 'Flutterwave', desc: 'Mobile Money + cartes' },
                  { id: 'paystack', name: 'Paystack', desc: 'Cartes + Mobile Money' },
                  { id: 'orange', name: 'Orange Money', desc: 'Orange Money marchand' },
                  { id: 'mtn', name: 'MTN MoMo', desc: 'MTN Mobile Money API' },
                  { id: 'cinetpay', name: 'CinetPay', desc: 'Multi-Mobile Money' },
                  { id: 'stripe', name: 'Stripe', desc: 'Cartes internationales' },
                ].map(g => (
                  <button key={g.id} onClick={() => setData({ ...data, gateway: g.id })}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center justify-between ${data.gateway === g.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{g.name}</div>
                      <div className="text-xs text-gray-500">{g.desc}</div>
                    </div>
                    {data.gateway === g.id && <Check className="text-orange-600" size={18} />}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">Vous pourrez configurer les clés API plus tard dans Paramètres {'>'} Payments.</p>
              <div className="flex gap-2 pt-4">
                <button onClick={back} className="px-4 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50">Retour</button>
                <button onClick={next} className="flex-1 py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700">Continuer</button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <h2 className="font-serif-display text-2xl font-bold text-gray-900">Choisissez votre plan</h2>
              <p className="text-gray-600 text-sm">7 jours d'essai gratuit inclus. Aucune commission sur vos ventes.</p>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button onClick={() => setData({ ...data, billing: 'monthly' })} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${data.billing === 'monthly' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Mensuel</button>
                <button onClick={() => setData({ ...data, billing: 'annual' })} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${data.billing === 'annual' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Annuel (-2 mois)</button>
              </div>
              <div className="space-y-2">
                {PLANS.map(p => (
                  <button key={p.id} onClick={() => setData({ ...data, plan: p.id })}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${data.plan === p.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.products === -1 ? 'Produits illimités' : `${p.products} produits`}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">${data.billing === 'annual' ? p.annualPrice : p.price}</div>
                        <div className="text-xs text-gray-500">/{data.billing === 'annual' ? 'an' : 'mois'}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={back} className="px-4 py-2.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50">Retour</button>
                <button onClick={next} className="flex-1 py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700">Continuer</button>
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="text-green-600" size={32} />
              </div>
              <h2 className="font-serif-display text-2xl font-bold text-gray-900">C'est prêt !</h2>
              <p className="text-gray-600">Votre boutique <strong>{data.shopName || 'Ma Boutique'}</strong> est prête à être lancée.</p>
              <div className="text-left p-4 bg-gray-50 rounded-xl space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Boutique</span><span className="font-medium">{data.shopName || 'Ma Boutique'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Pays</span><span className="font-medium">{country?.flag} {country?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Devise</span><span className="font-medium">{data.currency || 'XOF'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Thème</span><span className="font-medium capitalize">{data.theme}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Paiement</span><span className="font-medium capitalize">{data.gateway}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Plan</span><span className="font-medium capitalize">{data.plan} ({data.billing})</span></div>
              </div>
              <button onClick={finish} className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2">
                Lancer ma boutique <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
