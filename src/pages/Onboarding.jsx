import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import {
  Store, Package, Palette, CreditCard, Truck, Rocket, Loader2, Check, ArrowRight, ArrowLeft, X, Plus, Sparkles, Globe,
} from 'lucide-react';
import { COUNTRIES } from '@/lib/world/countries';
import { CURRENCIES } from '@/lib/world/currencies';
import PhoneInput from '@/components/PhoneInput';

function slugify(str) {
  return (str || '').toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// The exact root cause of "ma boutique n'est pas visible en ligne": this
// is the only real onboarding flow (routed at /onboarding, linked from
// dozens of places across the admin) and it never set tenants.slug at
// all - a store created here had no valid URL, ever, unless a merchant
// separately found some other settings screen to set one. Generates a
// real, unique slug from the store name, checking for collisions against
// what's already taken (a numeric suffix if the plain slug is used).
async function generateUniqueSlug(name, currentTenantId) {
  const base = slugify(name) || 'boutique';
  let candidate = base;
  let suffix = 1;
  // Bounded loop (never truly infinite) - falls back to a timestamp
  // suffix after a reasonable number of collisions rather than looping
  // forever against a pathological name.
  for (let attempt = 0; attempt < 20; attempt++) {
    const { data } = await supabase.from('tenants').select('id').eq('slug', candidate).maybeSingle();
    if (!data || data.id === currentTenantId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return `${base}-${Date.now()}`;
}

const STEPS = [
  { id: 'store', label: 'Votre boutique', icon: Store },
  { id: 'products', label: 'Produits', icon: Package },
  { id: 'theme', label: 'Thème', icon: Palette },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'shipping', label: 'Livraison', icon: Truck },
  { id: 'launch', label: 'Lancement', icon: Rocket },
];

const BUSINESS_TYPES = ['Mode & accessoires', 'Beauté & cosmétiques', 'Électronique', 'Maison & déco', 'Alimentation', 'Artisanat', 'Autre'];
const PROVIDERS = [
  { id: 'manual', label: 'Paiement manuel' }, { id: 'flutterwave', label: 'Flutterwave' },
  { id: 'paystack', label: 'Paystack' }, { id: 'stripe', label: 'Stripe' }, { id: 'payunit', label: 'PayUnit' },
];

const fld = 'w-full px-3 py-2.5 border border-[#E1E1E1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008060]/30';
const lbl = 'text-xs font-semibold text-[#6D7175] mb-1.5 block';

export default function Onboarding() {
  const { store, reload } = useCurrentStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState({});

  // step 1 state
  const [f, setF] = useState({ name: store?.name || '', country: store?.country || 'SN', currency: store?.currency || 'XOF', business_type: store?.business_type || BUSINESS_TYPES[0] });
  // Full ISO 4217 list (142 currencies) - the implied currency from any
  // country is always in there already, so no ad-hoc fallback needed.
  const currencyOptions = useMemo(() => [...CURRENCIES].sort((a, b) => a.code.localeCompare(b.code)), []);
  const [phone, setPhone] = useState(store?.phone || '');
  useEffect(() => {
    // Prefill from what was entered at sign-up (Register.jsx stores it in
    // user_metadata) so people don't have to fill in the same info twice.
    supabase.auth.getUser().then(({ data }) => {
      const meta = data?.user?.user_metadata || {};
      if (!store?.phone && meta.phone) setPhone((cur) => cur || meta.phone);
      if (!store?.country && meta.country) {
        setF((cur) => (cur.country === 'SN' || !cur.country) ? { ...cur, country: meta.country, currency: COUNTRIES.find((c) => c.code === meta.country)?.currency || cur.currency } : cur);
      }
    });
    if (store?.phone) setPhone(store.phone);
  }, [store?.phone, store?.country]);
  // step 2 state
  const [items, setItems] = useState([{ title: '', price: '' }]);
  // step 4 state
  const [pay, setPay] = useState('manual');
  // step 5 state
  const [ship, setShip] = useState({ isGlobal: false, countries: ['SN'], rate: '' });

  const [error, setError] = useState('');

  const next = async () => {
    setBusy(true); setError('');
    try {
      if (step === 0) {
        const { data: { user } } = await supabase.auth.getUser();
        // A store with an existing slug keeps it (don't silently change a
        // merchant's real, possibly-already-shared URL); one with none
        // (new store, or an existing one from before this fix) gets a
        // real one generated now instead of staying permanently
        // unreachable.
        const needsSlug = !store?.slug;
        const slug = needsSlug ? await generateUniqueSlug(f.name || store?.name || 'boutique', store?.id) : store.slug;
        const payload = {
          name: f.name || 'Ma boutique',
          country: f.country,
          currency: f.currency,
          sector: f.business_type,
          phone: phone || null,
          ...(needsSlug ? { slug } : {}),
        };
        if (store?.id) {
          const { error } = await supabase.from('tenants').update(payload).eq('id', store.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('tenants').insert({
            ...payload,
            slug,
            owner_id: user.id,
            status: 'trial',
            plan: 'growth',
            trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
          });
          if (error) throw error;
        }
        await reload();
      }
      if (step === 1) {
        for (const it of items) {
          if (it.title.trim() && store?.id) {
            const { error } = await supabase.from('products').insert({
              tenant_id: store.id,
              name: it.title.trim(),
              price_cents: Math.round((Number(it.price) || 0) * 100),
              currency: f.currency,
              status: 'draft',
            });
            if (error) throw error;
          }
        }
      }
      // Step 3 (payment provider choice) has no dedicated table yet on the
      // native Supabase schema - kept as a local UI choice for now rather
      // than silently pretending to save it (see MIGRATION.md).
      if (step === 4) {
        if (store?.id && ship.rate) {
          const { error } = await supabase.from('shipping_zones').insert({
            tenant_id: store.id,
            name: 'Zone principale',
            is_global: ship.isGlobal,
            countries: ship.isGlobal ? null : ship.countries,
            country: ship.isGlobal ? null : ship.countries[0],
            rate_type: 'flat',
            rate_amount_cents: Math.round(Number(ship.rate) * 100),
            is_active: true,
          });
          if (error) throw error;
        }
      }
      setDone((d) => ({ ...d, [STEPS[step].id]: true }));
      if (step < STEPS.length - 1) setStep((s) => s + 1);
    } catch (e) {
      console.error('Onboarding step failed:', e);
      setError(e.message || "Une erreur est survenue. Réessayez.");
    } finally { setBusy(false); }
  };

  const skip = () => { setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const finish = () => navigate('/dashboard');

  const renderStep = () => {
    switch (STEPS[step].id) {
      case 'store':
        return (
          <>
            <h2 className="text-lg font-bold text-[#202223]">Parlez-nous de votre boutique</h2>
            <p className="text-sm text-[#6D7175] mt-1 mb-5">Ces informations apparaissent sur votre vitrine et vos factures.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className={lbl}>Nom de la boutique</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={fld} placeholder="Ex : AfriStyle" /></div>
              <div><label className={lbl}>Pays</label><select value={f.country} onChange={(e) => { const country = e.target.value; const impliedCurrency = COUNTRIES.find((c) => c.code === country)?.currency; setF({ ...f, country, currency: impliedCurrency || f.currency }); }} className={fld}>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
              <div><label className={lbl}>Devise</label><select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} className={fld}>{currencyOptions.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>)}</select><p className="text-[11px] text-[#6D7175] mt-1">Pré-remplie selon le pays choisi — modifiable si besoin.</p></div>
              <div className="sm:col-span-2"><label className={lbl}>Type d'activité</label><select value={f.business_type} onChange={(e) => setF({ ...f, business_type: e.target.value })} className={fld}>{BUSINESS_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}</select></div>
              <div className="sm:col-span-2"><label className={lbl}>Téléphone</label><PhoneInput value={phone} onChange={setPhone} countryHint={f.country} /><p className="text-[11px] text-[#6D7175] mt-1">Indicatif pré-rempli selon le pays choisi ci-dessus.</p></div>
            </div>
          </>
        );
      case 'products':
        return (
          <>
            <h2 className="text-lg font-bold text-[#202223]">Ajoutez vos premiers produits</h2>
            <p className="text-sm text-[#6D7175] mt-1 mb-5">Vous pourrez en ajouter d'autres plus tard. Laissez vide pour passer.</p>
            <div className="space-y-3">
              {items.map((it, i) => (
                <div key={i} className="flex gap-2">
                  <input value={it.title} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} className={fld} placeholder={`Produit ${i + 1}`} />
                  <input value={it.price} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} className={fld + ' w-28'} placeholder="Prix" type="number" />
                  {items.length > 1 && <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="px-3 rounded-lg border border-[#E1E1E1] text-[#6D7175] hover:bg-black/5"><X className="w-4 h-4" /></button>}
                </div>
              ))}
              <button onClick={() => setItems([...items, { title: '', price: '' }])} className="flex items-center gap-1.5 text-sm font-semibold text-[#008060] hover:underline"><Plus className="w-4 h-4" /> Ajouter un produit</button>
            </div>
          </>
        );
      case 'theme':
        return (
          <>
            <h2 className="text-lg font-bold text-[#202223]">Personnalisez votre thème</h2>
            <p className="text-sm text-[#6D7175] mt-1 mb-5">Choisissez l'apparence de votre boutique. Vous pourrez tout ajuster plus tard.</p>
            <div className="rounded-xl border border-[#E1E1E1] p-6 flex flex-col sm:flex-row items-center gap-4 justify-between bg-[#F4F4F4]">
              <div className="flex items-center gap-3"><Palette className="w-8 h-8 text-[#008060]" /><div><p className="text-sm font-semibold text-[#202223]">Éditeur de thème</p><p className="text-xs text-[#6D7175]">Couleurs, sections, mise en page par glisser-déposer.</p></div></div>
              <Link to="/theme-editor" target="_blank" className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#008060] px-4 py-2 rounded-full hover:bg-[#00694d] shrink-0">Ouvrir l'éditeur <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </>
        );
      case 'payments':
        return (
          <>
            <h2 className="text-lg font-bold text-[#202223]">Configurez vos paiements</h2>
            <p className="text-sm text-[#6D7175] mt-1 mb-5">Acceptez les paiements en ligne. Vous pourrez ajouter vos clés plus tard.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROVIDERS.map((p) => (
                <button key={p.id} onClick={() => setPay(p.id)} className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition ${pay === p.id ? 'border-[#008060] bg-[#008060]/5 text-[#008060]' : 'border-[#E1E1E1] text-[#202223] hover:bg-black/5'}`}>
                  {p.label}{pay === p.id && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </>
        );
      case 'shipping':
        return (
          <>
            <h2 className="text-lg font-bold text-[#202223]">Définissez vos frais de livraison</h2>
            <p className="text-sm text-[#6D7175] mt-1 mb-5">Ajoutez une première zone de livraison — un ou plusieurs pays, ou le monde entier. Configurable en détail plus tard.</p>
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-medium text-[#202223] cursor-pointer bg-[#F4F4F4] rounded-lg px-3 py-2.5">
                <input type="checkbox" checked={ship.isGlobal} onChange={(e) => setShip({ ...ship, isGlobal: e.target.checked })} className="accent-[#008060]" />
                <Globe className="w-4 h-4 text-[#008060]" /> Livraison mondiale (tous les pays)
              </label>
              {!ship.isGlobal && (
                <div>
                  <label className={lbl + ' flex items-center justify-between'}>
                    <span>Pays couverts</span>
                    <span className="text-[#008060]">{ship.countries.length} sélectionné(s)</span>
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-[#E1E1E1] rounded-lg p-2 grid grid-cols-2 gap-1">
                    {COUNTRIES.map((c) => (
                      <label key={c.code} className="flex items-center gap-1.5 text-xs cursor-pointer hover:bg-black/5 rounded px-1.5 py-1">
                        <input
                          type="checkbox"
                          checked={ship.countries.includes(c.code)}
                          onChange={() => setShip((s) => ({ ...s, countries: s.countries.includes(c.code) ? s.countries.filter((x) => x !== c.code) : [...s.countries, c.code] }))}
                          className="accent-[#008060]"
                        /> {c.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div><label className={lbl}>Frais de livraison ({f.currency})</label><input value={ship.rate} onChange={(e) => setShip({ ...ship, rate: e.target.value })} className={fld} type="number" placeholder="Ex : 5" /></div>
            </div>
          </>
        );
      case 'launch':
        return (
          <>
            <h2 className="text-lg font-bold text-[#202223]">Votre boutique est prête ! 🎉</h2>
            <p className="text-sm text-[#6D7175] mt-1 mb-5">Vérifiez le rendu, puis lancez-vous. Vous pouvez tout modifier depuis le tableau de bord.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link to="/store-preview" target="_blank" className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[#E1E1E1] hover:bg-black/5 text-sm font-semibold text-[#202223]"><Store className="w-4 h-4 text-[#008060]" /> Aperçu de la boutique</Link>
              <Link to="/domains" className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[#E1E1E1] hover:bg-black/5 text-sm font-semibold text-[#202223]"><Rocket className="w-4 h-4 text-[#008060]" /> Connecter un domaine</Link>
              <Link to="/products" className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[#E1E1E1] hover:bg-black/5 text-sm font-semibold text-[#202223]"><Package className="w-4 h-4 text-[#008060]" /> Gérer mes produits</Link>
              <Link to="/theme-editor" className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[#E1E1E1] hover:bg-black/5 text-sm font-semibold text-[#202223]"><Palette className="w-4 h-4 text-[#008060]" /> Personnaliser le thème</Link>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col">
      <header className="h-14 bg-white border-b border-[#E1E1E1] flex items-center px-4 sm:px-6 justify-between">
        <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#008060]" /><span className="font-bold text-[#202223]">Configuration de votre boutique</span></div>
        <Link to="/dashboard" className="text-sm font-medium text-[#6D7175] hover:text-[#202223]">Passer pour l'instant</Link>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-5xl mx-auto w-full p-4 sm:p-6 gap-6">
        {/* Steps sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-[#E1E1E1] p-3">
            {STEPS.map((s, i) => {
              const isDone = done[s.id];
              const isCurrent = i === step;
              return (
                <button key={s.id} onClick={() => setStep(i)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition mb-0.5 ${isCurrent ? 'bg-[#008060]/5 text-[#008060] font-semibold' : 'text-[#6D7175] hover:bg-black/5'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${isDone ? 'bg-[#008060] text-white' : isCurrent ? 'border-2 border-[#008060] text-[#008060]' : 'border border-[#E1E1E1] text-[#6D7175]'}`}>
                    {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </span>
                  <span className="text-left">{s.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 bg-white rounded-xl border border-[#E1E1E1] p-5 sm:p-7 flex flex-col">
          <div className="flex-1">
            {renderStep()}
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-4">{error}</p>}
          <div className="flex items-center justify-between mt-7 pt-5 border-t border-[#F4F4F4]">
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="flex items-center gap-1.5 text-sm font-medium text-[#6D7175] hover:text-[#202223] disabled:opacity-30"><ArrowLeft className="w-4 h-4" /> Retour</button>
            <div className="flex items-center gap-2">
              {step < STEPS.length - 1 && step !== 2 && <button onClick={skip} className="text-sm font-medium text-[#6D7175] hover:text-[#202223] px-3 py-2">Passer</button>}
              {step < STEPS.length - 1 ? (
                <button onClick={next} disabled={busy} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#00694d] disabled:opacity-40">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Continuer
                </button>
              ) : (
                <button onClick={finish} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#00694d]"><Rocket className="w-4 h-4" /> Aller au tableau de bord</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}