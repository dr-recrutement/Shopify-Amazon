import { useState } from 'react';
import { Store, Palette, CreditCard, Globe2, BarChart3, Bot, ShoppingBag, Layers, Truck, Tag, Users, Smartphone, Zap, ShieldCheck, TrendingUp, Boxes, Megaphone, Star, Wallet, Bell } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const TABS = [
  { id: 'create', icon: Palette },
  { id: 'sell', icon: Wallet },
  { id: 'manage', icon: Boxes },
  { id: 'grow', icon: TrendingUp },
];
const FEATURE_ICONS = {
  create: [Store, Palette, Layers, Smartphone],
  sell: [CreditCard, Globe2, ShieldCheck, Tag],
  manage: [Boxes, Truck, Users, ShoppingBag],
  grow: [BarChart3, Bot, Megaphone, Bell],
};
const STAT_ICONS = [Zap, Globe2, Star, TrendingUp];

export default function LandingFeatures() {
  const { t } = useI18n();
  const [active, setActive] = useState('create');
  const items = t('features.items.' + active) || [];
  const icons = FEATURE_ICONS[active] || [];
  const stats = t('features.stats') || [];

  return (
    <section id="fonctionnalites" className="py-20 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-gold uppercase tracking-wide">{t('features.badge')}</span>
          <h2 className="mt-2 font-landing font-semibold text-2xl sm:text-[2rem] text-foreground tracking-tight">{t('features.title')}</h2>
          <p className="mt-3 text-muted-foreground text-lg">{t('features.subtitle')}</p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                active === tab.id
                  ? 'bg-brand text-brand-foreground shadow-lg shadow-brand/20'
                  : 'bg-white border border-border text-foreground hover:border-brand/40 hover:bg-surface'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {t('features.tab.' + tab.id)}
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {items.map((f, i) => {
            const Icon = icons[i] || Store;
            return (
              <div key={i} className="group rounded-2xl border border-border bg-white p-6 hover:border-brand/40 hover:shadow-lg transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-muted flex items-center justify-center group-hover:bg-brand transition-colors shrink-0">
                    <Icon className="w-6 h-6 text-brand group-hover:text-brand-foreground transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-landing font-bold text-lg text-foreground">{f.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const Icon = STAT_ICONS[i] || Zap;
            return (
              <div key={i} className="text-center rounded-2xl bg-surface border border-border p-5">
                <Icon className="w-5 h-5 text-brand mx-auto mb-2" />
                <p className="font-landing font-bold text-2xl text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}