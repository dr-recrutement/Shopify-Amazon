import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import Storefront from './pages/Storefront'
import { getHostContext } from './lib/subdomain'
import { supabase } from './lib/supabase'
import './index.css'

/**
 * Résout un domaine personnalisé (ex: maboutique.com) en tenant_id via la
 * table `domains`, puis affiche la boutique correspondante.
 */
function CustomDomainResolver({ hostname }: { hostname: string }) {
  const [status, setStatus] = useState<'loading' | 'found' | 'not-found'>('loading');
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('domains')
        .select('tenant_id')
        .eq('domain_name', hostname)
        .eq('dns_status', 'verified')
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setTenantId(data.tenant_id);
        setStatus('found');
      } else {
        setStatus('not-found');
      }
    })();
    return () => { cancelled = true; };
  }, [hostname]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement…</div>;
  }
  if (status === 'not-found') {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Ce domaine n'est associé à aucune boutique.</div>;
  }
  return <Storefront tenantId={tenantId!} />;
}

function Root() {
  const ctx = getHostContext();

  if (ctx.type === 'subdomain') {
    return <Storefront slug={ctx.slug} />;
  }

  if (ctx.type === 'custom_domain') {
    return <CustomDomainResolver hostname={ctx.hostname} />;
  }

  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
