export function getStoreSlugFromHost(): string | null {
  const host = window.location.hostname;
  if (host === 'localhost' || host.endsWith('.pages.dev') || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return null;
  }
  const parts = host.split('.');
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub === 'www' || sub === 'liafrik') return null;
    return sub;
  }
  return null;
}
