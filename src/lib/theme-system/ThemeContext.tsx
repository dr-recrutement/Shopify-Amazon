import React, { createContext, useContext, useMemo } from 'react';
import { ThemeSettings } from './types';

interface ThemeTokens {
  radius: ThemeSettings['borderRadius'];
  containerClass: string;
  settings: ThemeSettings;
}

const ThemeTokensContext = createContext<ThemeTokens | null>(null);

export const ThemeTokensProvider: React.FC<{ settings: ThemeSettings; children: React.ReactNode }> = ({
  settings,
  children,
}) => {
  const value = useMemo<ThemeTokens>(
    () => ({
      radius: settings.borderRadius,
      containerClass:
        settings.containerWidth === 'boxed'
          ? 'mx-auto w-full max-w-7xl px-6 lg:px-8'
          : 'mx-auto w-full px-6 lg:px-12',
      settings,
    }),
    [settings]
  );

  return <ThemeTokensContext.Provider value={value}>{children}</ThemeTokensContext.Provider>;
};

/** Hook consommé par chaque composant de section pour récupérer les tokens résolus. */
export function useThemeTokens(): ThemeTokens {
  const ctx = useContext(ThemeTokensContext);
  if (!ctx) {
    throw new Error('useThemeTokens doit être utilisé à l’intérieur de <ThemeTokensProvider>.');
  }
  return ctx;
}
