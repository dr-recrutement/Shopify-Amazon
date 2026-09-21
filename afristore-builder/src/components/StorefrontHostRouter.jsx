import Landing from '@/pages/Landing';
import Storefront from '@/pages/Storefront';

const BUILDER_HOSTS = ['localhost', '127.0.0.1', 'afristore-builder-pro.base44.app'];

export default function StorefrontHostRouter() {
  const host = (typeof window !== 'undefined' ? window.location.hostname : '') || '';
  const isBuilder = BUILDER_HOSTS.includes(host) || host.endsWith('.base44.app') || host.endsWith('.local');

  if (isBuilder) return <Landing />;

  let slug;
  if (host.endsWith('.sellia.app')) {
    slug = host.split('.').slice(0, -2).join('.') || host.split('.')[0];
  } else {
    slug = host;
  }
  return <Storefront slugOverride={slug} />;
}