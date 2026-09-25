import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Star } from 'lucide-react';

// Real subscription payment logos — same local assets and uniform white-
// tile treatment as LandingPSPs.jsx, replacing the previous near-black
// boxes (bg #0A0A0A + mix-blend-mode: screen) that made several logos
// unreadable depending on their own colors.
const SUBSCRIPTION_PSPS = [
  { name: 'Flutterwave', logo: '/payment-logos/flutterwave.png' },
  { name: 'Paystack', logo: '/payment-logos/paystack.png' },
  { name: 'Stripe', logo: '/payment-logos/stripe.png' },
  { name: 'PayUnit', logo: '/payment-logos/payunit.png' },
  { name: 'PayPal', logo: '/payment-logos/paypal.png' },
  { name: 'Wave', logo: '/payment-logos/wave.png' },
  { name: 'CinetPay', logo: '/payment-logos/cinetpay.webp' },
  { name: 'Mercado Pago', logo: '/payment-logos/mercadopago.png' },
];

const PLANS = [
  { name: 'Starter', price: 7, desc: 'Pour lancer votre première boutique.', features: ['1 boutique', '20 produits', 'Thèmes de base', 'Paiements manuels', '1 utilisateur', 'Adresse sellia.liafrik.com'] },
  { name: 'Growth', price: 19, desc: 'Pour les marchands en croissance.', features: ['60 produits', 'Tous les thèmes premium', 'Éditeur visuel', 'Paiements intégrés', 'Multi-devises', 'Analytics de base', '3 utilisateurs'], highlight: true },
  { name: 'Pro', price: 39, desc: 'Pour les marchands établis.', features: ['150 produits', 'Sellia Assistant', 'Analytics avancées', 'Domaine personnalisé', '2 boutiques', '10 utilisateurs', 'Accès API'] },
  { name: 'Enterprise', price: 129, desc: 'Pour les places de marché.', features: ['Produits illimités', 'Boutiques illimitées', 'Marketplace multi-vendeurs', 'Headless commerce', 'Automations & workflows', 'Utilisateurs illimités', 'Support 24/7', 'SLA 99,9 %'] },
];

const ANNUAL_DISCOUNT = 0.2; // 20% off, billed yearly — matches the badge copy

export default function LandingPricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="tarifs" className="py-20 lg:py-24 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-sm font-semibold text-[#008060] uppercase tracking-wide">Tarifs</span>
          <h2 className="mt-2 font-landing font-semibold text-2xl sm:text-[2rem] text-[#202223] tracking-tight">Des prix pour tous les marchands</h2>
          <p className="mt-3 text-[#6D7175] text-lg">14 jours d'essai gratuit sur tous les plans. Sans carte bancaire.</p>

          {/* Real, working billing toggle — previously "Annuel : économisez
              20%" was a static badge with no way to actually see the
              annual price; now it's a real switch that recomputes every
              plan's displayed price. */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-white border border-[#E1E1E1] p-1.5">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${!annual ? 'bg-[#202223] text-white' : 'text-[#6D7175]'}`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 ${annual ? 'bg-[#202223] text-white' : 'text-[#6D7175]'}`}
            >
              Annuel
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${annual ? 'bg-[#2EE6A8] text-[#0A0A0A]' : 'bg-[#008060]/10 text-[#008060]'}`}>-20%</span>
            </button>
          </div>
        </div>

        {/* Pricing matrix — buttons at bottom */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {PLANS.map((p) => {
            const displayPrice = annual ? Math.round(p.price * (1 - ANNUAL_DISCOUNT)) : p.price;
            return (
              <div key={p.name} className={`relative border-2 p-6 flex flex-col transition-shadow hover:shadow-lg ${p.highlight ? 'border-[#008060] bg-white shadow-xl lg:scale-[1.04] lg:-translate-y-1' : 'border-[#E1E1E1] bg-white'}`}>
                {p.highlight && <span className="self-start mb-3 text-[11px] font-bold bg-[#008060] text-white px-3 py-1 rounded-full">Le plus populaire</span>}
                <h3 className="font-landing font-bold text-xl text-[#202223]">{p.name}</h3>
                <p className="mt-1.5 text-sm text-[#6D7175] leading-relaxed min-h-[40px]">{p.desc}</p>
                <div className="mt-4 flex items-end gap-1.5">
                  <span className="font-landing font-bold text-4xl text-[#202223] tabular-nums">${displayPrice}</span>
                  <span className="text-sm text-[#6D7175] mb-1.5">/mois</span>
                </div>
                {annual && (
                  <p className="mt-1 text-xs text-[#008060] font-semibold">Facturé ${displayPrice * 12}/an</p>
                )}
                <div className="mt-6 pt-4 border-t border-[#E1E1E1] flex-1">
                  <p className="text-[11px] font-bold text-[#6D7175] uppercase mb-2">Inclus</p>
                  <ul className="space-y-2">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#202223]">
                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#008060]" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* CTA at bottom */}
                <Link to="/register" className={`mt-6 inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-3 rounded-full transition ${p.highlight ? 'bg-[#008060] text-white hover:bg-[#00694d] shadow-lg shadow-[#008060]/20' : 'bg-white border border-[#E1E1E1] text-[#202223] hover:bg-black/5'}`}>
                  Commencer <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-[#6D7175]">Tous les prix en USD. {annual ? 'Facturation annuelle — 20% d\'économie incluse ci-dessus.' : 'Facturation mensuelle, passez à l\'annuel à tout moment.'}</p>

        {/* Subscription payment methods — real logos on white tiles */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-xs font-semibold text-[#6D7175] uppercase tracking-wide">Payez votre abonnement avec</p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {SUBSCRIPTION_PSPS.map((psp) => (
              <div key={psp.name} className="h-11 w-[92px] shrink-0 rounded-lg bg-white border border-[#E1E1E1] flex items-center justify-center px-3">
                <img src={psp.logo} alt={psp.name} title={psp.name} className="max-w-full max-h-full object-contain" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        {/* Phone mockup below pricing */}
        <div className="mt-16 flex flex-col lg:flex-row items-center gap-10 justify-center">
          <div className="max-w-md text-center lg:text-left">
            <h3 className="font-landing font-bold text-2xl text-[#202223]">Une expérience mobile premium</h3>
            <p className="mt-3 text-[#6D7175] leading-relaxed">Vos clients achètent depuis leur téléphone, partout dans le monde. Checkout fluide, paiements sans redirection, support Mobile Money et cartes.</p>
            <div className="mt-5 flex items-center gap-2 justify-center lg:justify-start">
              <div className="flex text-amber-400">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}</div>
              <span className="text-xs text-[#6D7175]">4,9/5 — 12 000+ marchands</span>
            </div>
          </div>
          <div className="relative">
            <img src="/marketing/mobile-showcase.png" alt="Application mobile Sellia" className="w-full max-w-md lg:max-w-lg h-auto object-contain" />
          </div>
        </div>
      </div>
    </section>
  );
}
