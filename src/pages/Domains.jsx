import { useState, useEffect, useCallback } from 'react';
import { Globe, Link2, Loader2, Check, ExternalLink, ShoppingCart, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';

const SELLIA_SUBDOMAIN = 'sellia.app';
const REASON_LABELS = {
  domain_unavailable: 'Ce domaine est déjà pris.',
  extension_not_supported_via_api: 'Cette extension (TLD) n\u2019est pas encore disponible via achat automatique.',
  extension_not_supported: 'Cette extension (TLD) n\u2019est pas prise en charge par Cloudflare Registrar.',
  extension_disallows_registration: 'Cette extension n\u2019autorise pas l\u2019enregistrement automatique.',
};

// Native `domains` table: one row per connected/purchased domain
// (domain_name/type/dns_status/ssl_status), not a single store.domain field.
// There's no delete policy for authenticated users on this table (by
// design, presumably to avoid orphaning DNS/SSL setups) - disconnecting
// surfaces that instead of pretending it worked.
export default function Domains() {
  const { store, loading } = useCurrentStore();
  const [domains, setDomains] = useState([]);
  const [connecting, setConnecting] = useState(false);
  const [domain, setDomain] = useState('');
  const [buying, setBuying] = useState(false);
  const [searchDomain, setSearchDomain] = useState('');
  const [domainResult, setDomainResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const loadDomains = useCallback(async () => {
    if (!store?.id) return;
    const { data, error } = await supabase.from('domains').select('*').eq('tenant_id', store.id).order('created_at', { ascending: false });
    if (error) { console.error('Failed to load domains:', error); setDomains([]); return; }
    setDomains(data || []);
  }, [store?.id]);

  useEffect(() => { loadDomains(); }, [loadDomains]);

  const customDomain = domains.find((d) => d.type !== 'buy');
  const purchasedDomains = domains.filter((d) => d.type === 'buy');

  const connectDomain = async () => {
    if (!domain || !store?.id) return;
    setConnecting(true);
    try {
      const { error } = await supabase.from('domains').insert({
        tenant_id: store.id,
        domain_name: domain.trim(),
        type: 'custom',
        dns_status: 'pending',
        ssl_status: 'pending',
      });
      if (error) throw error;
      setDomain('');
      await loadDomains();
    } catch (e) {
      alert(e.message || 'Échec de la connexion du domaine');
    } finally { setConnecting(false); }
  };

  const removeDomain = async (d) => {
    if (!confirm('Déconnecter ce domaine ?')) return;
    const { error } = await supabase.from('domains').delete().eq('id', d.id);
    if (error) {
      alert("Ce domaine ne peut pas être retiré directement (contactez le support) : " + error.message);
      return;
    }
    await loadDomains();
  };

  const checkDomain = async () => {
    if (!searchDomain) return;
    setChecking(true);
    setDomainResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('cloudflare-domains', { body: { action: 'check', domain_name: searchDomain.trim() } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setDomainResult(data);
    } catch (e) {
      setDomainResult({ name: searchDomain.trim(), registrable: false, reason: e.message || 'Erreur de vérification' });
    } finally { setChecking(false); }
  };

  const buyDomain = async () => {
    if (!domainResult?.registrable || !store?.id) return;
    if (!confirm(`Confirmer l'achat de ${domainResult.name} pour ${domainResult.price} ${domainResult.currency} ?\n\nCe montant sera facturé réellement (paiement Cloudflare de Sellia) et n'est pas remboursable une fois l'enregistrement terminé.`)) return;
    setBuying(true);
    try {
      const { data, error } = await supabase.functions.invoke('cloudflare-domains', {
        body: { action: 'register', domain_name: domainResult.name, tenant_id: store.id, confirm: true },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setDomainResult(null);
      setSearchDomain('');
      await loadDomains();
    } catch (e) {
      alert(e.message || "Échec de l'achat du domaine");
    } finally { setBuying(false); }
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
        {customDomain ? (
          <div className="flex items-center justify-between bg-[#008060]/5 rounded-lg px-4 py-3 border border-[#008060]/20">
            <div><p className="text-sm font-mono text-[#202223]">{customDomain.domain_name}</p><p className="text-xs text-[#008060]">{customDomain.dns_status === 'verified' ? 'Connecté — DNS vérifié' : `DNS : ${customDomain.dns_status || 'en attente'}`}</p></div>
            <button onClick={() => removeDomain(customDomain)} className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"><Trash2 className="w-3.5 h-3.5" /> Déconnecter</button>
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
              {domainResult.registrable ? <Check className="w-5 h-5 text-[#008060]" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
              <div>
                <p className="text-sm font-mono text-[#202223]">{domainResult.name}</p>
                <p className="text-xs text-[#6D7175]">
                  {domainResult.registrable
                    ? `Disponible — ${domainResult.price} ${domainResult.currency}/an (dont ${domainResult.platform_fee} ${domainResult.currency} de frais Sellia)`
                    : REASON_LABELS[domainResult.reason] || domainResult.reason || 'Non disponible'}
                </p>
              </div>
            </div>
            {domainResult.registrable && <button onClick={buyDomain} disabled={buying} className="bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] disabled:opacity-40">{buying ? 'Achat…' : 'Acheter'}</button>}
          </div>
        )}
        <p className="text-[11px] text-[#6D7175] mt-3 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Recherche et prix en temps réel via Cloudflare Registrar. L'achat facture réellement le compte Cloudflare de Sellia et n'est pas remboursable.</p>
      </div>

      {purchasedDomains.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-5 mt-6">
          <div className="flex items-center gap-2 mb-3"><Globe className="w-4 h-4 text-[#008060]" /><p className="text-sm font-bold text-[#202223]">Domaines achetés via Sellia</p></div>
          <div className="space-y-2">
            {purchasedDomains.map((d) => (
              <div key={d.id} className="flex items-center justify-between bg-[#F4F4F4] rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-mono text-[#202223]">{d.domain_name}</p>
                  <p className="text-xs text-[#6D7175]">
                    {d.dns_status === 'verified' ? 'Actif' : `Statut : ${d.dns_status || 'en cours'}`}
                    {d.price_cents ? ` · ${(d.price_cents / 100).toFixed(2)} ${d.currency || 'USD'} payé` : ''}
                  </p>
                </div>
                {d.last_error && <span className="text-xs text-red-600">{d.last_error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}