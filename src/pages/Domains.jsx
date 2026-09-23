import { useState, useEffect, useCallback } from 'react';
import { Globe, Link2, Loader2, Check, ExternalLink, ShoppingCart, AlertCircle, Trash2, RefreshCcw } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';

const SELLIA_SUBDOMAIN = 'sellia.app';
const REASON_LABELS = {
  domain_unavailable: 'Ce domaine est déjà pris.',
  extension_not_supported_via_api: 'Cette extension (TLD) n\u2019est pas encore disponible via achat automatique.',
  extension_not_supported: 'Cette extension (TLD) n\u2019est pas prise en charge par Cloudflare Registrar.',
  extension_disallows_registration: 'Cette extension n\u2019autorise pas l\u2019enregistrement automatique.',
};

// Extracts the real error message our Edge Functions return (a JSON body
// like {"error": "..."}) instead of supabase-js's generic "Edge Function
// returned a non-2xx status code" - that generic text was the entire
// visible error, hiding what actually went wrong.
async function functionErrorMessage(error) {
  try {
    const body = await error.context?.json?.();
    if (body?.error) return body.error;
  } catch { /* fall through to the generic message below */ }
  return error.message || 'Erreur inconnue';
}

// Native `domains` table: one row per connected/purchased domain
// (domain_name/type/dns_status/ssl_status), not a single store.domain field.
// There's no delete policy for authenticated users on this table (by
// design, presumably to avoid orphaning DNS/SSL setups) - disconnecting
// surfaces that instead of pretending it worked.
export default function Domains() {
  const { store, loading } = useCurrentStore();
  const [domains, setDomains] = useState([]);
  const [connecting, setConnecting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [domain, setDomain] = useState('');
  const [buying, setBuying] = useState(false);
  const [searchDomain, setSearchDomain] = useState('');
  const [domainResults, setDomainResults] = useState([]);
  const [checking, setChecking] = useState(false);
  const [buyTarget, setBuyTarget] = useState(null);
  const [buyStep, setBuyStep] = useState(1);
  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingAck, setBillingAck] = useState(false);
  const [purchaseFinalizing, setPurchaseFinalizing] = useState(false);

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

  const verifyDns = async (d) => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('verify-custom-domain', { body: { domain_id: d.id } });
      if (error) throw new Error(await functionErrorMessage(error));
      setVerifyResult(data);
      await loadDomains();
    } catch (e) {
      setVerifyResult({ verified: false, error: e.message });
    } finally { setVerifying(false); }
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
    setDomainResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('cloudflare-domains', { body: { action: 'search', query: searchDomain.trim() } });
      if (error) throw new Error(await functionErrorMessage(error));
      if (data.error) throw new Error(data.error);
      setDomainResults(data.domains || []);
    } catch (e) {
      setDomainResults([{ name: searchDomain.trim(), registrable: false, reason: e.message || 'Erreur de vérification' }]);
    } finally { setChecking(false); }
  };

  const openBuy = (d) => { setBuyTarget(d); setBillingName(''); setBillingEmail(''); setBuyStep(1); };

  const confirmBuy = async () => {
    if (!buyTarget?.registrable || !store?.id) return;
    setBuying(true);
    try {
      // Real billing first: the merchant pays Sellia (via Sellia's own
      // Payunit account) for the domain price before anything is
      // registered - redirects to Payunit's hosted payment page. The
      // actual Cloudflare purchase only happens after that payment is
      // independently confirmed (see the payunit_return handler below),
      // never on faith that the redirect alone means paid.
      const { data, error } = await supabase.functions.invoke('payunit-platform-billing', {
        body: {
          action: 'initiate',
          tenant_id: store.id,
          domain_name: buyTarget.name,
          amount: buyTarget.price,
          currency: buyTarget.currency,
          email: billingEmail,
          name: billingName,
        },
      });
      if (error) throw new Error(await functionErrorMessage(error));
      if (data.error) throw new Error(data.error);
      sessionStorage.setItem('sellia_pending_domain_purchase', JSON.stringify({ name: buyTarget.name, price: buyTarget.price, currency: buyTarget.currency }));
      window.location.href = data.transaction_url;
    } catch (e) {
      alert(e.message || "Échec de l'initialisation du paiement");
      setBuying(false);
    }
  };

  // Handles the return from Payunit's hosted payment page
  // (?payunit_return=1&tx=...&domain=...). Verifies the transaction against
  // Payunit's own status endpoint (never the URL params alone) before
  // registering the domain via Cloudflare.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payunit_return') !== '1' || !store?.id) return;
    const tx = params.get('tx');
    const domainName = params.get('domain');
    window.history.replaceState({}, '', window.location.pathname);
    if (!tx || !domainName) return;
    (async () => {
      setPurchaseFinalizing(true);
      try {
        const { data: v, error: vErr } = await supabase.functions.invoke('payunit-platform-billing', { body: { action: 'verify', transaction_id: tx } });
        if (vErr) throw new Error(await functionErrorMessage(vErr));
        if (!v.paid) throw new Error(`Paiement non confirmé (statut : ${v.status}). Le domaine n'a pas été acheté.`);
        const { data: reg, error: regErr } = await supabase.functions.invoke('cloudflare-domains', {
          body: { action: 'register', domain_name: domainName, tenant_id: store.id, confirm: true },
        });
        if (regErr) throw new Error(await functionErrorMessage(regErr));
        if (reg.error) throw new Error(`Paiement confirmé mais l'enregistrement du domaine a échoué : ${reg.error}. Contactez le support avec la référence ${tx}.`);
        sessionStorage.removeItem('sellia_pending_domain_purchase');
        setBuyTarget(null);
        await loadDomains();
        alert(`${domainName} a été acheté avec succès !`);
      } catch (e) {
        alert(e.message || "Échec de la finalisation de l'achat");
      } finally { setPurchaseFinalizing(false); }
    })();
  }, [store?.id, loadDomains]);

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  const subdomain = store?.slug ? `${store.slug}.${SELLIA_SUBDOMAIN}` : null;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {purchaseFinalizing && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <Loader2 className="w-8 h-8 text-[#008060] animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#202223]">Vérification du paiement et enregistrement du domaine…</p>
            <p className="text-xs text-[#6D7175] mt-1">Ne fermez pas cette page.</p>
          </div>
        </div>
      )}
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
          <div>
            <div className="flex items-center justify-between bg-[#008060]/5 rounded-lg px-4 py-3 border border-[#008060]/20">
              <div><p className="text-sm font-mono text-[#202223]">{customDomain.domain_name}</p><p className={`text-xs ${customDomain.dns_status === 'verified' ? 'text-[#008060]' : 'text-amber-600'}`}>{customDomain.dns_status === 'verified' ? 'Connecté — DNS vérifié' : `DNS : ${customDomain.dns_status || 'en attente de configuration'}`}</p></div>
              <div className="flex items-center gap-2 shrink-0">
                {customDomain.dns_status !== 'verified' && (
                  <button onClick={() => verifyDns(customDomain)} disabled={verifying} className="flex items-center gap-1 text-xs font-semibold text-[#008060] border border-[#008060]/30 rounded-full px-3 py-1.5 hover:bg-[#008060]/5 disabled:opacity-40">
                    {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />} Vérifier le DNS
                  </button>
                )}
                <button onClick={() => removeDomain(customDomain)} className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"><Trash2 className="w-3.5 h-3.5" /> Déconnecter</button>
              </div>
            </div>
            {customDomain.dns_status !== 'verified' && (
              <div className="mt-3 rounded-lg bg-[#F4F4F4] p-3">
                <p className="text-xs font-semibold text-[#202223] mb-2">Chez votre registrar ({customDomain.domain_name.split('.').slice(-2).join('.')}), ajoutez cet enregistrement DNS :</p>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-white rounded border border-[#E1E1E1] p-2">
                  <span className="text-[#6D7175]">Type</span><span className="text-[#6D7175] col-span-2">Valeur</span>
                  <span className="font-bold text-[#202223]">CNAME</span><span className="col-span-2 text-[#202223]">sellia.liafrik.com</span>
                </div>
                <p className="text-[11px] text-[#6D7175] mt-2">Si votre registrar n'autorise pas de CNAME sur le domaine racine (souvent le cas), utilisez un sous-domaine (ex : www) ou un enregistrement A pointant vers la même adresse que sellia.liafrik.com. La propagation DNS peut prendre jusqu'à 24h — cliquez sur « Vérifier » une fois configuré.</p>
                {verifyResult && (
                  <p className={`text-xs font-semibold mt-2 ${verifyResult.verified ? 'text-[#008060]' : 'text-red-600'}`}>{verifyResult.verified ? '✓ DNS correctement configuré et vérifié !' : 'DNS pas encore détecté — vérifiez la configuration ou patientez pour la propagation.'}</p>
                )}
              </div>
            )}
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
          <input value={searchDomain} onChange={(e) => setSearchDomain(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && checkDomain()} placeholder="ex : maboutique" className="flex-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" />
          <button onClick={checkDomain} disabled={checking || !searchDomain} className="bg-[#202223] text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-black/80 disabled:opacity-40">{checking ? 'Recherche…' : 'Rechercher'}</button>
        </div>
        {domainResults.length > 0 && (
          <div className="space-y-2">
            {domainResults.map((d, i) => (
              <div key={i} className="flex items-center justify-between bg-[#F4F4F4] rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  {d.registrable ? <Check className="w-5 h-5 text-[#008060]" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                  <div>
                    <p className="text-sm font-mono text-[#202223]">{d.name}</p>
                    <p className="text-xs text-[#6D7175]">
                      {d.registrable
                        ? `${d.price} ${d.currency}/an (dont ${(d.price - d.cloudflare_cost).toFixed(2)} ${d.currency} de frais Sellia)`
                        : REASON_LABELS[d.reason] || d.reason || 'Non disponible'}
                    </p>
                  </div>
                </div>
                {d.registrable && <button onClick={() => openBuy(d)} className="bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d]">Acheter</button>}
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-[#6D7175] mt-3 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Recherche et prix en temps réel via Cloudflare Registrar.</p>
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

      {buyTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => !buying && setBuyTarget(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold text-[#202223] mb-1">Acheter {buyTarget.name}</p>
            <p className="text-xs text-[#6D7175] mb-4">{buyTarget.price} {buyTarget.currency}/an, dont {(buyTarget.price - buyTarget.cloudflare_cost).toFixed(2)} {buyTarget.currency} de frais Sellia.</p>

            {buyStep === 1 ? (
              <>
                <p className="text-xs font-semibold text-[#6D7175] mb-1">Contact registrant (obligatoire pour l'enregistrement du domaine)</p>
                <input value={billingName} onChange={(e) => setBillingName(e.target.value)} placeholder="Nom complet" className="w-full mb-2 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" />
                <input value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} type="email" placeholder="E-mail" className="w-full mb-3 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" />
                <button onClick={() => setBuyStep(2)} disabled={!billingName.trim() || !billingEmail.trim()} className="w-full bg-[#202223] text-white text-sm font-medium py-2.5 rounded-full hover:bg-black/80 disabled:opacity-40">Continuer</button>
              </>
            ) : (
              <>
                <div className="rounded-lg bg-[#008060]/5 border border-[#008060]/20 p-3 mb-3">
                  <p className="text-xs text-[#202223] leading-relaxed">
                    Vous allez être redirigé vers une page de paiement sécurisée Payunit pour régler <strong>{buyTarget.price} {buyTarget.currency}</strong>. Le domaine n'est enregistré qu'une fois ce paiement confirmé. Non remboursable une fois l'enregistrement terminé.
                  </p>
                </div>
                <label className="flex items-start gap-2 text-xs text-[#202223] mb-4 cursor-pointer">
                  <input type="checkbox" checked={billingAck} onChange={(e) => setBillingAck(e.target.checked)} className="mt-0.5" />
                  Je comprends et j'accepte ces conditions pour {billingName} ({billingEmail}).
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setBuyStep(1)} className="flex-1 text-sm font-medium text-[#6D7175] border border-[#E1E1E1] rounded-full py-2.5 hover:bg-black/5">Retour</button>
                  <button onClick={confirmBuy} disabled={buying || !billingAck} className="flex-1 bg-[#008060] text-white text-sm font-medium py-2.5 rounded-full hover:bg-[#00694d] disabled:opacity-40">{buying ? 'Redirection…' : 'Payer et acheter'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}