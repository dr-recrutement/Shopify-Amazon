import { Link } from 'react-router-dom';
import { Check, ArrowRight, Sparkles, Star, Smartphone } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const LOGO_BASE = 'https://media.base44.com/images/public/6aaf8e00382d12ca2edaacca';

const SUBSCRIPTION_PSPS = [
  { name: 'Paddle', color: '#9CE37D', letter: 'P' },
  { name: 'Flutterwave', logo: `${LOGO_BASE}/e26c19886_Flutterwave-Logo1.png` },
  { name: 'Paystack', logo: `${LOGO_BASE}/de5fcd15b_paystack-logo-vector.png` },
  { name: 'Stripe', logo: `${LOGO_BASE}/d56771535_1685814539stripe-icon-png.png` },
  { name: 'Payunit', logo: `${LOGO_BASE}/cceaad03f_payunit-logo.png` },
];

export default function LandingPricing() {
  const { t } = useI18n();
  const plans = t('pricing.plans') || [];

  return (
    <section id="tarifs" className="py-20 lg:py-24 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-sm font-semibold text-[#008060] uppercase tracking-wide">{t('pricing.badge')}</span>
          <h2 className="mt-2 font-landing font-semibold text-2xl sm:text-[2rem] text-[#202223] tracking-tight">{t('pricing.title')}</h2>
          <p className="mt-3 text-[#6D7175] text-lg">{t('pricing.subtitle')}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white border border-[#E1E1E1] px-4 py-2 text-xs font-semibold text-[#6D7175]">
            <Sparkles className="w-3.5 h-3.5 text-[#008060]" /> {t('pricing.annual')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-2xl border-2 p-6 flex flex-col ${p.highlight ? 'border-[#008060] bg-white shadow-xl lg:scale-[1.04] lg:-translate-y-1' : 'border-[#E1E1E1] bg-white'}`}>
              {p.highlight && <span className="self-start mb-3 text-[11px] font-bold bg-[#008060] text-white px-3 py-1 rounded-full">{t('pricing.popular')}</span>}
              <h3 className="font-landing font-bold text-xl text-[#202223]">{p.name}</h3>
              <p className="mt-1.5 text-sm text-[#6D7175] leading-relaxed min-h-[40px]">{p.desc}</p>
              <div className="mt-4 flex items-end gap-1.5">
                <span className="font-landing font-bold text-4xl text-[#202223]">${p.price}</span>
                <span className="text-sm text-[#6D7175] mb-1.5">{t('pricing.perMonth')}</span>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E1E1E1] flex-1">
                <p className="text-[11px] font-bold text-[#6D7175] uppercase mb-2">{t('pricing.included')}</p>
                <ul className="space-y-2">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#202223]">
                      <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#008060]" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link to="/register" className={`mt-6 inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-3 rounded-full transition ${p.highlight ? 'bg-[#008060] text-white hover:bg-[#00694d] shadow-lg shadow-[#008060]/20' : 'bg-white border border-[#E1E1E1] text-[#202223] hover:bg-black/5'}`}>
                {t('pricing.startCta')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-[#6D7175]">{t('pricing.allPricesNote')}</p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-xs font-semibold text-[#6D7175] uppercase tracking-wide">{t('pricing.payWith')}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {SUBSCRIPTION_PSPS.map((psp) => (
              <div key={psp.name} className="h-12 w-24 rounded-xl bg-[#0A0A0A] flex items-center justify-center overflow-hidden border border-[#1A1A1A]">
                {psp.logo ? (
                  <img src={psp.logo} alt={psp.name} className="w-full h-full object-contain p-2" style={{ mixBlendMode: 'screen' }} />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-sm" style={{ background: psp.color, color: '#1A2B3C' }}>{psp.letter}</span>
                    <span className="text-white text-xs font-bold">{psp.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col lg:flex-row items-center gap-10 justify-center">
          <div className="max-w-md text-center lg:text-left">
            <h3 className="font-landing font-bold text-2xl text-[#202223]">{t('pricing.mobileTitle')}</h3>
            <p className="mt-3 text-[#6D7175] leading-relaxed">{t('pricing.mobileText')}</p>
            <div className="mt-5 flex items-center gap-2 justify-center lg:justify-start">
              <div className="flex text-amber-400">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}</div>
              <span className="text-xs text-[#6D7175]">{t('pricing.ratingText')}</span>
            </div>
          </div>
          <div className="relative">
            <div className="w-[280px] h-[560px] rounded-[2.5rem] bg-[#0A0A0A] p-3 shadow-2xl">
              <div className="w-full h-full rounded-[2rem] bg-white overflow-hidden relative">
                <div className="h-6 bg-[#0A0A0A] flex items-center justify-center"><div className="w-20 h-5 bg-[#0A0A0A] rounded-b-xl" /></div>
                <div className="h-32 bg-gradient-to-br from-[#008060] to-[#2EE6A8] flex items-center justify-center">
                  <div className="text-white text-center"><p className="text-xs opacity-80">{t('nav.platform')}</p><p className="text-lg font-bold">Sellia</p></div>
                </div>
                <div className="p-3 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-2">
                      <div className="w-16 h-16 rounded-lg bg-[#F4F4F4] shrink-0" />
                      <div className="flex-1 py-1"><div className="h-3 w-3/4 bg-[#E1E1E1] rounded mb-1.5" /><div className="h-2 w-1/2 bg-[#F4F4F4] rounded mb-1.5" /><div className="h-4 w-16 bg-[#008060]/20 rounded" /></div>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-3 left-3 right-3 bg-[#008060] text-white text-center py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5"><Smartphone className="w-4 h-4" /> {t('showcase.mobile.payBtn')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}