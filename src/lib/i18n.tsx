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
  'hero.title3': { fr: 'Partout dans le monde.', en: 'Everywhere in the world.' },
  'hero.subtitle': {
    fr: "Os, la plateforme SaaS e-commerce mondiale conçue par LiAfrik — Mobile Money natif, paiements internationaux, IA intégrée, 0% commission.",
    en: "Os, the global e-commerce SaaS platform built by LiAfrik — native Mobile Money, international payments, built-in AI, 0% commission."
  },
  'hero.cta.start': { fr: 'Créer ma boutique', en: 'Create my store' },
  'hero.cta.pricing': { fr: 'Voir les tarifs', en: 'See pricing' },
  'hero.trial': { fr: '7 jours d\'essai gratuit inclus — sans carte bancaire', en: '7-day free trial included — no credit card' },
  'footer.tagline': {
    fr: 'Os, la plateforme SaaS e-commerce mondiale. Votre boutique en ligne, à votre image. Partout dans le monde.',
    en: 'Os, the global e-commerce SaaS platform. Your online store, in your image. Everywhere in the world.'
  },
  'footer.origin': {
    fr: 'Conçu et développé par LiAfrik 🌍',
    en: 'Designed and developed by LiAfrik 🌍'
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
