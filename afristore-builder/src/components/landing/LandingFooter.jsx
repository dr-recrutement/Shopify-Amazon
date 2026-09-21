import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin, ArrowRight } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { useI18n } from '@/lib/i18n';

export default function LandingFooter() {
  const { t } = useI18n();
  const cols = t('footer.cols');

  return (
    <footer className="bg-foreground text-background">
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-landing font-extrabold text-2xl text-background">{t('footer.ctaTitle')}</h3>
            <p className="mt-1.5 text-background/70">{t('footer.ctaSubtitle')}</p>
          </div>
          <Link to="/register" className="inline-flex items-center gap-2 bg-brand text-brand-foreground font-semibold px-6 py-3.5 rounded-full text-base hover:bg-brand/90 transition-colors shadow-lg shadow-brand/30 shrink-0">
            {t('footer.ctaStart')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <img src={BRAND.logo} alt="Sellia" className="h-9 w-auto object-contain" />
              <span className="font-landing font-bold text-lg text-background">Sellia</span>
            </div>
            <p className="mt-4 text-sm text-background/70 max-w-xs">{t('footer.brandDesc')}</p>
            <a href={BRAND.site} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-brand hover:opacity-80">{BRAND.site.replace('https://', '')}</a>
            <div className="mt-5 flex items-center gap-3">
              {[Facebook, Instagram, Twitter, Linkedin].map((Ic, i) => (
                <span key={i} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><Ic className="w-4 h-4" /></span>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="font-landing font-semibold text-sm text-background">{c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}><span className="text-sm text-background/70">{l}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col items-center gap-4">
          <p className="text-xs font-semibold text-background/60 uppercase tracking-wide">{t('footer.securePayments')}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {['Paystack','Flutterwave','M-Pesa','Stripe','PayPal','Payunit','Wave','Orange Money','Kkiapay','Square','Klarna','Adyen','Razorpay','Mercado Pago'].map((name, i) => (
              <span key={name} className="inline-flex items-center gap-3 text-sm font-semibold text-background/80">
                {i > 0 && <span className="text-background/30">•</span>}{name}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-background/60">© {new Date().getFullYear()} Sellia — {BRAND.tagline}. {t('footer.copyright')}</p>
          <div className="flex items-center gap-5 text-xs text-background/70">
            <Link to="/login" className="hover:text-background transition-colors">{t('footer.loginLink')}</Link>
            <span className="text-background/60">{t('footer.privacy')}</span>
            <span className="text-background/60">{t('footer.terms')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}