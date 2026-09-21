import { UserPlus, Store, Rocket } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const STEP_ICONS = [UserPlus, Store, Rocket];

export default function LandingHowItWorks() {
  const { t } = useI18n();
  const steps = t('howItWorks.steps') || [];

  return (
    <section id="process" className="py-20 lg:py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-gold uppercase tracking-wide">{t('howItWorks.badge')}</span>
          <h2 className="mt-2 font-landing font-semibold text-2xl sm:text-[2rem] text-foreground tracking-tight">{t('howItWorks.title')}</h2>
          <p className="mt-3 text-muted-foreground text-lg">{t('howItWorks.subtitle')}</p>
        </div>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => {
            const Icon = STEP_ICONS[i] || UserPlus;
            return (
              <div key={i} className="relative">
                <div className="rounded-2xl bg-white border border-border p-7 h-full hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center">
                      <Icon className="w-6 h-6 text-brand-foreground" />
                    </div>
                    <span className="font-landing font-extrabold text-4xl text-border">{i + 1}</span>
                  </div>
                  <h3 className="mt-5 font-landing font-bold text-xl text-foreground">{s.title}</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{s.text}</p>
                </div>
                {i < steps.length - 1 && <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-border" />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}