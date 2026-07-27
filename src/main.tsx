import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Storefront from './pages/Storefront'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import { CartProvider } from './lib/cart'
import { getHostContext } from './lib/subdomain'
import { supabase } from './lib/supabase'
import './index.css'

/**
 * Résout le tenant_id à partir du contexte d'hébergement courant :
 * - sous-domaine liafrik.com -> recherche par slug
 * - domaine personnalisé vérifié -> recherche dans la table domains
 * Ce résultat est partagé par Storefront, CartPage et CheckoutPage,
 * pour que le panier soit bien scoppé à la bonne boutique.
 */
function useResolvedTenantId() {
  const [state, setState] = useState<{ status: 'loading' | 'found' | 'not-found'; tenantId: string | null; slug?: string }>({
    status: 'loading',
    tenantId: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ctx = getHostContext();

      if (ctx.type === 'subdomain') {
        const { data } = await supabase.from('tenants').select('id').eq('slug', ctx.slug).maybeSingle();
        if (cancelled) return;
        if (data) setState({ status: 'found', tenantId: data.id, slug: ctx.slug });
        else setState({ status: 'not-found', tenantId: null });
        return;
      }

      if (ctx.type === 'custom_domain') {
        const { data } = await supabase
          .from('domains')
          .select('tenant_id')
          .eq('domain_name', ctx.hostname)
          .eq('dns_status', 'verified')
          .maybeSingle();
        if (cancelled) return;
        if (data) setState({ status: 'found', tenantId: data.tenant_id });
        else setState({ status: 'not-found', tenantId: null });
        return;
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}

function StorefrontApp() {
  const { status, tenantId, slug } = useResolvedTenantId();

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement…</div>;
  }
  if (status === 'not-found' || !tenantId) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Boutique introuvable.</div>;
  }

  return (
    <CartProvider tenantId={tenantId}>
      <Routes>
        <Route path="/" element={<Storefront slug={slug} tenantId={tenantId} />} />
        <Route path="/cart" element={<CartPage tenantId={tenantId} />} />
        <Route path="/checkout" element={<CheckoutPage tenantId={tenantId} />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
        <Route path="*" element={<Storefront slug={slug} tenantId={tenantId} />} />
      </Routes>
    </CartProvider>
  );
}

function Root() {
  const ctx = getHostContext();

  if (ctx.type === 'subdomain' || ctx.type === 'custom_domain') {
    return (
      <BrowserRouter>
        <StorefrontApp />
      </BrowserRouter>
    );
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
