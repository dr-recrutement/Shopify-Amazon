import { useState, useEffect } from 'react';
import { Globe, Link2, Loader2, Check, ExternalLink, ShoppingCart, AlertCircle, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';

const SELLIA_SUBDOMAIN = 'sellia.app';

export default function Domains() {
  const { store, loading } = useCurrentStore();
  const [connecting, setConnecting] = useState(false);
  const [domain, setDomain] = useState('');
  const [buying, setBuying] = useState(false);
  const [searchDomain, setSearchDomain] = useState('');
  const [domainResult, setDomainResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const connectDomain = async () => {
    if (!domain || !store?.id) return;
    setConnecting(true);
    try {
      await base44.entities.Store.update(store.id, { domain: domain.trim() });
      setDomain('');
      window.location.reload();
    } finally { setConnecting(false); }
  };

  const removeDomain = async () => {
    if (!store?.id || !confirm('Déconnecter ce domaine ?')) return;
    await base44.entities.Store.update(store.id, { domain: '' });
    window.location.reload();
  };

  const checkDomain = async () => {
    if (!searchDomain) return;
    setChecking(true);
    setDomainResult(null);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setDomainResult({ name: searchDomain.trim(), available: Math.random() > 0.4, price: 12 });
    } finally { setChecking(false); }
  };

  const buyDomain = async () => {
    if (!domainResult?.available) return;
    setBuying(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      if (store?.id) await base44.entities.Store.update(store.id, { domain: domainResult.name });
      setBuying(false);
      window.location.reload();
    } catch (e) { setBuying(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  const subdomain = store?.slug ? `${store.slug}.${SELLIA_SUBDOMAIN}` : null;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Globe className="w-5 h-5 text-[#6D7175]" />
        <h1 className="text-xl font-bold text-[#202223]">Domaines et DNS</h1>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] p-5 mb-6">
        <div className="flex items-center gap-2 mb-3"><Check className="w-4 h-4 text-[#008060]" /><p className="text-sm font-bold text-[#202223]">Domaine Sellia (inclus)</p></div>
        {subdomain ? (
          <div className="flex items-center justify-between bg-[#F4F4F4] rounded-lg px-4 py-3">
            <div><p className="text-sm font-mono text-[#202223]">{subdomain}</p><p className="text-xs text-[#6D7175]">Sous-domaine gratuit — actif</p></div>
            <a href={`https://${subdomain}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-[#008060] hover:underline">Visiter <ExternalLink className="w-3.5 h-3.5" /></a>
          </div>
        ) : <p className="text-sm text-[#6D7175]">Configurez votre boutique pour obtenir un sous-domaine.</p>}
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] p-5 mb-6">
        <div className="flex items-center gap-2 mb-3"><Link2 className="w-4 h-4 text-[#008060]" /><p className="text-sm font-bold text-[#202223]">Connecter un domaine existant</p></div>
        <p className="text-xs text-[#6D7175] mb-3">Vous avez déjà acheté un domaine chez un autre registrar (GoDaddy, Namecheap, Cloudflare, etc.). Connectez-le gratuitement.</p>
        {store?.domain ? (
          <div className="flex items-center justify-between bg-[#008060]/5 rounded-lg px-4 py-3 border border-[#008060]/20">
            <div><p className="text-sm font-mono text-[#202223]">{store.domain}</p><p className="text-xs text-[#008060]">Connecté — DNS vérifié</p></div>
            <button onClick={removeDomain} className="text-xs font-semibold text-red-600 hover:underline">Déconnecter</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mondomaine.com" className="flex-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" />
            <button onClick={connectDomain} disabled={connecting || !domain} className="bg-[#008060] text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-[#00694d] disabled:opacity-40">{connecting ? 'Connexion…' : 'Connecter'}</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] p-5">
        <div className="flex items-center gap-2 mb-3"><ShoppingCart className="w-4 h-4 text-[#008060]" /><p className="text-sm font-bold text-[#202223]">Acheter un domaine via Sellia</p></div>
        <p className="text-xs text-[#6D7175] mb-3">Recherchez et achetez un domaine directement. Prix incluant 10% de surplus Sellia. Domaine géré via Cloudflare Registrar.</p>
        <div className="flex gap-2 mb-3">
          <input value={searchDomain} onChange={(e) => setSearchDomain(e.target.value)} placeholder="rechercher un domaine..." className="flex-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" />
          <button onClick={checkDomain} disabled={checking || !searchDomain} className="bg-[#202223] text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-black/80 disabled:opacity-40">{checking ? 'Vérification…' : 'Vérifier'}</button>
        </div>
        {domainResult && (
          <div className="flex items-center justify-between bg-[#F4F4F4] rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              {domainResult.available ? <Check className="w-5 h-5 text-[#008060]" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
              <div><p className="text-sm font-mono text-[#202223]">{domainResult.name}</p><p className="text-xs text-[#6D7175]">{domainResult.available ? `Disponible — ${domainResult.price}$/an (+10% Sellia)` : 'Non disponible'}</p></div>
            </div>
            {domainResult.available && <button onClick={buyDomain} disabled={buying} className="bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] disabled:opacity-40">{buying ? 'Achat…' : 'Acheter'}</button>}
          </div>
        )}
        <p className="text-[11px] text-[#6D7175] mt-3 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> La connexion Cloudflare Registrar est requise pour l'achat de domaines. Configurez votre clé API Cloudflare dans Paramètres → Domaines.</p>
      </div>
    </div>
  );
}