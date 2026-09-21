import { Link } from 'react-router-dom';
import { ArrowRight, Check, ShoppingBag, Star, Truck, ShieldCheck } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useI18n } from '@/lib/i18n';

const DASHBOARD_IMG = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80';
const EDITOR_IMG = 'https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1200&q=80';

const LOGO_BASE = 'https://media.base44.com/images/public/6aaf8e00382d12ca2edaacca';
const PSP_LOGOS = [
  `${LOGO_BASE}/de5fcd15b_paystack-logo-vector.png`,
  `${LOGO_BASE}/e26c19886_Flutterwave-Logo1.png`,
  `${LOGO_BASE}/795fb39dd_unnamed.png`,
  `${LOGO_BASE}/d56771535_1685814539stripe-icon-png.png`,
];

const PHONE_PRODUCTS = [
  { img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=300&q=80', name: 'Robe Wax Premium', price: '45 000 FCFA', old: '60 000', rating: 5 },
  { img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=300&q=80', name: 'Sac à main cuir', price: '28 000 FCFA', old: '', rating: 4 },
];

export default function LandingShowcase() {
  const { t } = useI18n();
  const dash = t('showcase.dashboard');
  const ed = t('showcase.editor');
  const mob = t('showcase.mobile');

  return (
    <section className="py-20 lg:py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="order-2 lg:order-1">
            <span className="text-sm font-semibold text-gold uppercase tracking-wide">{dash.badge}</span>
            <h2 className="mt-2 font-landing font-semibold text-2xl sm:text-[2rem] text-foreground tracking-tight">{dash.title}</h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">{dash.text}</p>
            <ul className="mt-6 space-y-3">
              {(dash.list || []).map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                  <span className="w-5 h-5 rounded-full bg-brand flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-brand-foreground" /></span>
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/register" className="mt-7 inline-flex items-center gap-1.5 bg-brand text-brand-foreground font-semibold px-6 py-3 rounded-full text-sm hover:bg-brand/90 transition-colors shadow-lg shadow-brand/20">
              {dash.cta} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="order-1 lg:order-2 relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-brand/10 to-gold/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-white">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-surface">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="ml-3 text-[11px] font-mono text-muted-foreground">dashboard.sellia.app</span>
              </div>
              <div className="aspect-[16/10]">
                <Image src={DASHBOARD_IMG} alt={dash.title} fittingType="fill" className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-gold/10 to-brand/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-white">
              <div className="aspect-[16/11]">
                <Image src={EDITOR_IMG} alt={ed.title} fittingType="fill" className="w-full h-full" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-2 bg-white rounded-xl border border-border shadow-xl p-3 flex items-center gap-2">
              <span className="w-9 h-9 rounded-full bg-brand-muted flex items-center justify-center text-lg">🎨</span>
              <div>
                <p className="text-xs font-bold text-foreground">{ed.badgeLabel}</p>
                <p className="text-[10px] text-muted-foreground">{ed.badgeSub}</p>
              </div>
            </div>
          </div>
          <div>
            <span className="text-sm font-semibold text-gold uppercase tracking-wide">{ed.badge}</span>
            <h2 className="mt-2 font-landing font-semibold text-2xl sm:text-[2rem] text-foreground tracking-tight">{ed.title}</h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">{ed.text}</p>
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(ed.highlights || []).map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm text-foreground">
                  <span className="w-5 h-5 rounded-full bg-brand flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3 text-brand-foreground" /></span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <span className="text-sm font-semibold text-gold uppercase tracking-wide">{mob.badge}</span>
            <h2 className="mt-2 font-landing font-semibold text-2xl sm:text-[2rem] text-foreground tracking-tight">{mob.title}</h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">{mob.text}</p>
            <div className="mt-6 flex flex-wrap gap-4 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-sm text-foreground"><ShieldCheck className="w-4 h-4 text-brand" /> {mob.trustCheckout}</div>
              <div className="flex items-center gap-2 text-sm text-foreground"><Truck className="w-4 h-4 text-brand" /> {mob.trustTracking}</div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/register" className="inline-flex items-center justify-center gap-1.5 bg-brand text-brand-foreground font-semibold px-6 py-3 rounded-full text-sm hover:bg-brand/90 transition-colors shadow-lg shadow-brand/20">
                {mob.createCta} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <a href="#tarifs" className="inline-flex items-center justify-center gap-1.5 bg-white border border-border text-foreground font-semibold px-6 py-3 rounded-full text-sm hover:bg-surface transition-colors">
                {mob.pricingCta}
              </a>
            </div>
          </div>
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative w-[300px]">
              <div className="absolute -inset-6 bg-gradient-to-tr from-brand/15 to-gold/15 rounded-3xl blur-2xl" />
              <div className="relative rounded-[2.5rem] border-[8px] border-[#0A0A0A] bg-white shadow-2xl overflow-hidden">
                <div className="h-7 bg-[#0A0A0A] flex items-center justify-center"><div className="w-24 h-6 bg-[#0A0A0A] rounded-b-2xl" /></div>
                <div className="bg-[#0A0A0A] text-white px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] opacity-70">{t('nav.platform')}</p>
                    <p className="text-sm font-bold">Sellia</p>
                  </div>
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="h-28 bg-gradient-to-br from-[#008060] to-[#2EE6A8] relative overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80" alt="" className="w-full h-full object-cover opacity-60" />
                </div>
                <div className="flex items-center justify-around px-3 py-2 bg-[#F8F9FA] border-b border-[#F0F0F0]">
                  <div className="flex items-center gap-1 text-[9px] font-semibold text-[#202223]"><Truck className="w-3 h-3 text-[#008060]" /> {t('storefront.delivery')}</div>
                  <div className="flex items-center gap-1 text-[9px] font-semibold text-[#202223]"><ShieldCheck className="w-3 h-3 text-[#008060]" /> {t('storefront.secureCheckout')}</div>
                  <div className="flex items-center gap-1 text-[9px] font-semibold text-[#202223]"><Star className="w-3 h-3 text-amber-400" /> 4.9/5</div>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2.5">
                  {PHONE_PRODUCTS.map((p) => (
                    <div key={p.name} className="rounded-lg border border-[#F0F0F0] overflow-hidden bg-white">
                      <div className="aspect-square bg-[#F4F4F4]">
                        <img src={p.img} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2">
                        <p className="text-[10px] font-semibold text-[#202223] truncate">{p.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">{Array.from({length: 5}).map((_, i) => <Star key={i} className={`w-2.5 h-2.5 ${i < p.rating ? 'text-amber-400 fill-current' : 'text-[#E1E1E1]'}`} />)}</div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-[11px] font-bold text-[#008060]">{p.price}</span>
                          {p.old && <span className="text-[8px] text-[#6D7175] line-through">{p.old}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-3 pb-3">
                  <div className="bg-[#F8F9FA] rounded-lg p-2.5 border border-[#F0F0F0]">
                    <p className="text-[9px] font-semibold text-[#6D7175] mb-1.5">{mob.securePayments}</p>
                    <div className="flex items-center gap-1.5 mb-2">
                      {PSP_LOGOS.map((src, i) => (
                        <div key={i} className="h-5 flex-1 rounded bg-[#0A0A0A] flex items-center justify-center overflow-hidden">
                          <img src={src} alt="" className="h-full w-full object-contain p-0.5" style={{ mixBlendMode: 'screen' }} />
                        </div>
                      ))}
                    </div>
                    <button className="w-full bg-[#008060] text-white text-center py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" /> {mob.payBtn}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}