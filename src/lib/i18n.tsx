import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Lang = 'fr' | 'en';

type Dict = Record<string, { fr: string; en: string }>;

export const translations: Dict = {
  'nav.features': { fr: 'Fonctionnalités', en: 'Features' },
  'nav.resources': { fr: 'Ressources', en: 'Resources' },
  'nav.marketplace': { fr: 'Marketplace', en: 'Marketplace' },
  'nav.pricing': { fr: 'Tarifs', en: 'Pricing' },
  'nav.about': { fr: 'À propos', en: 'About' },
  'nav.login': { fr: 'Connexion', en: 'Log in' },
  'nav.register': { fr: 'Créer ma boutique', en: 'Create my store' },
  'nav.blog': { fr: 'Blog', en: 'Blog' },
  'nav.academy': { fr: 'Académie vendeur', en: 'Seller Academy' },
  'nav.help': { fr: "Centre d'aide", en: 'Help Center' },
  'nav.ia': { fr: 'IA', en: 'AI' },
  'nav.design': { fr: 'Design', en: 'Design' },
  'nav.payments': { fr: 'Paiements', en: 'Payments' },
  'nav.delivery': { fr: 'Livraison', en: 'Delivery' },
  'hero.badge': { fr: '0% de commission — pour toujours', en: '0% commission — forever' },
  'hero.title1': { fr: 'Votre boutique en ligne,', en: 'Your online store,' },
  'hero.title2': { fr: 'à votre image.', en: 'in your image.' },
  'hero.title3': { fr: 'Partout en Afrique.', en: 'Everywhere in Africa.' },
  'hero.subtitle': {
    fr: "La plateforme SaaS e-commerce panafricaine, conçue au Cameroun par LIYAH GROUP — Mobile Money natif, IA intégrée, 0% commission.",
    en: "The pan-African e-commerce SaaS platform, built in Cameroon by LIYAH GROUP — native Mobile Money, built-in AI, 0% commission."
  },
  'hero.cta.start': { fr: 'Créer ma boutique', en: 'Create my store' },
  'hero.cta.pricing': { fr: 'Voir les tarifs', en: 'See pricing' },
  'hero.trial': { fr: '7 jours d\'essai gratuit inclus — sans carte bancaire', en: '7-day free trial included — no credit card' },
  'footer.tagline': {
    fr: 'La plateforme SaaS e-commerce panafricaine. Votre boutique en ligne, à votre image. Partout en Afrique.',
    en: 'The pan-African e-commerce SaaS platform. Your online store, in your image. Everywhere in Africa.'
  },
  'footer.origin': {
    fr: 'Conçu et développé au Cameroun 🇨🇲 par LIYAH GROUP — pour toute l\'Afrique 🌍',
    en: 'Designed and developed in Cameroon 🇨🇲 by LIYAH GROUP — for all of Africa 🌍'
  },
};

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<LangCtx>({ lang: 'fr', setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');

  useEffect(() => {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('liafrikos_lang')) as Lang | null;
    if (saved === 'fr' || saved === 'en') setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof localStorage !== 'undefined') localStorage.setItem('liafrikos_lang', l);
  };

  const t = (key: string) => translations[key]?.[lang] ?? key;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}
