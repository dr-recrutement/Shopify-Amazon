// Domaine racine de la plateforme et sous-domaine réservé au dashboard.
// ⚠️ Si un jour tu changes de domaine, mets ces deux constantes à jour.
export const PLATFORM_ROOT_DOMAIN = 'liafrik.com';
export const PLATFORM_APP_SUBDOMAIN = 'os';

export type HostContext =
  | { type: 'platform' }
  | { type: 'subdomain'; slug: string }
  | { type: 'custom_domain'; hostname: string };

/**
 * Détermine ce que représente le hostname courant :
 * - 'platform'      → dashboard marchand (os.liafrik.com, liafrik.com, localhost, previews .pages.dev)
 * - 'subdomain'      → boutique sur sous-domaine offert par la plateforme ({slug}.liafrik.com)
 * - 'custom_domain'  → domaine personnalisé attaché par un marchand (nécessite une recherche en base)
 */
export function getHostContext(): HostContext {
  const host = window.location.hostname;

  // Dev local / previews Cloudflare Pages / accès direct par IP → toujours le dashboard
  if (host === 'localhost' || host.endsWith('.pages.dev') || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return { type: 'platform' };
  }

  if (host === PLATFORM_ROOT_DOMAIN || host === `www.${PLATFORM_ROOT_DOMAIN}`) {
    return { type: 'platform' };
  }

  const rootSuffix = `.${PLATFORM_ROOT_DOMAIN}`;
  if (host.endsWith(rootSuffix)) {
    const sub = host.slice(0, -rootSuffix.length);
    if (sub === PLATFORM_APP_SUBDOMAIN || sub === 'www' || sub === '') {
      return { type: 'platform' };
    }
    return { type: 'subdomain', slug: sub };
  }

  // Tout le reste = un domaine personnalisé (ex: maboutique.com)
  return { type: 'custom_domain', hostname: host };
}

/**
 * @deprecated Conservé pour compatibilité avec le code existant.
 * Préférer getHostContext() qui gère aussi les domaines personnalisés.
 */
export function getStoreSlugFromHost(): string | null {
  const ctx = getHostContext();
  return ctx.type === 'subdomain' ? ctx.slug : null;
}
