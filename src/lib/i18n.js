import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from '@/locales/fr.json';
import en from '@/locales/en.json';
import ar from '@/locales/ar.json';
import pt from '@/locales/pt.json';
import es from '@/locales/es.json';
import sw from '@/locales/sw.json';
import wo from '@/locales/wo.json';

// RTL matters here, not just text direction - Arabic genuinely mirrors
// the whole admin layout (sidebar side, icon direction, text alignment),
// so this is applied to <html dir> whenever the language changes, not
// left as a CSS-only afterthought.
export const RTL_LANGUAGES = ['ar'];

export const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'pt', label: 'Português' },
  { code: 'es', label: 'Español' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'wo', label: 'Wolof' },
];

const STORAGE_KEY = 'sellia_admin_language';

function applyDirection(lng) {
  const dir = RTL_LANGUAGES.includes(lng) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
}

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    ar: { translation: ar },
    pt: { translation: pt },
    es: { translation: es },
    sw: { translation: sw },
    wo: { translation: wo },
  },
  lng: localStorage.getItem(STORAGE_KEY) || 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

applyDirection(i18n.language);
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  applyDirection(lng);
});

export default i18n;
