import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LANGS, TRANSLATIONS } from './translations';
import { MARKETING } from './marketing';

const I18nContext = createContext(null);
const STORAGE_KEY = 'sellia_lang';

function resolve(path, dict) {
  return path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), dict);
}

export function I18nProvider({ children }) {
  const [code, setCode] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'fr'; } catch { return 'fr'; }
  });
  const lang = LANGS.find((l) => l.code === code) || LANGS[0];
  const dict = { ...(TRANSLATIONS[code] || TRANSLATIONS.fr), ...(MARKETING[code] || MARKETING.fr) };

  useEffect(() => {
    const dir = code === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = code;
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
  }, [code]);

  const t = useCallback((path, vars) => {
    let val = resolve(path, dict);
    if (val === undefined) val = resolve(path, TRANSLATIONS.fr);
    if (val === undefined) return path;
    if (typeof val === 'string' && vars) {
      Object.entries(vars).forEach(([k, v]) => {
        val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return val;
  }, [dict]);

  return (
    <I18nContext.Provider value={{ lang, code, setLang: setCode, t, dir: code === 'ar' ? 'rtl' : 'ltr', langs: LANGS }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return { lang: LANGS[0], code: 'fr', setLang: () => {}, t: (p) => p, dir: 'ltr', langs: LANGS };
  }
  return ctx;
}