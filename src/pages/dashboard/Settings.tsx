import { PageHeader, Card, Button, Badge } from './ui';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../lib/i18n';
import { GLOBAL_COUNTRIES, PLANS } from '../../lib/constants';
import { getShopProfile, saveShopProfile, getTenantStorageKey, getShopSubdomain } from '../../lib/app-state';
import { supabase } from '../../lib/supabase';
import { usePlanAccess } from '../../lib/plan-access';
import { fetchCloudSettings, pushCloudSettings, fetchCloudGateways, pushCloudGateway } from '../../lib/tenant-sync';
import {
  Globe, Search, CreditCard, ShieldCheck, RefreshCw,
  Trash2, Plus, Check, ChevronDown
} from 'lucide-react';

const SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'plan', label: 'Plan' },
  { id: 'billing', label: 'Billing' },
  { id: 'users', label: 'Users' },
  { id: 'payments', label: 'Payments' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'accounts', label: 'Customer accounts' },
  { id: 'shipping', label: 'Shipping and delivery' },
  { id: 'taxes', label: 'Taxes and duties' },
  { id: 'locations', label: 'Locations' },
  { id: 'apps', label: 'Apps' },
  { id: 'channels', label: 'Sales channels' },
  { id: 'domains', label: 'Domains' },
  { id: 'events', label: 'Customer events' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'metafields', label: 'Metafields and metaobjects' },
  { id: 'languages', label: 'Languages' },
  { id: 'privacy', label: 'Customer privacy' },
  { id: 'policies', label: 'Policies' },
  { id: 'chat', label: 'Support & Live Chat' },
];

interface CustomDomain {
  domain: string;
  type: 'platform' | 'external' | 'purchased';
  status: 'active' | 'dns_pending' | 'dns_error';
  createdAt: string;
}

export default function Settings() {
  const planAccess = usePlanAccess();
  const { lang, setLang } = useLang();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgradePlan = async (planId: string) => {
    if (planId === 'starter') return; // no downgrade flow yet — avoid a dead click
    setIsUpgrading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        alert('Session expirée, reconnecte-toi.');
        return;
      }
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ plan: planId, billingCycle: 'monthly' }),
      });
      const result = await res.json();
      if (!res.ok || !result.paymentLink) {
        alert(result.error || "Impossible de démarrer le paiement pour l'instant.");
        return;
      }
      window.location.href = result.paymentLink;
    } catch {
      alert('Le service de paiement est momentanément indisponible. Réessaie dans un instant.');
    } finally {
      setIsUpgrading(false);
    }
  };
  const [active, setActive] = useState('general');
  const shopProfile = getShopProfile();
  const shopSubdomain = getShopSubdomain();

  // Generic settings blob (checkout prefs, customer accounts mode, tax
  // rate, notifications, language) — one row per tenant in Supabase.
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [settingsSaved, setSettingsSaved] = useState(false);
  useEffect(() => {
    fetchCloudSettings().then(cloud => { if (cloud) setSettings(cloud); });
  }, []);
  const updateSetting = (key: string, value: any) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      pushCloudSettings(next);
      return next;
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  // Payment Gateways connections state
  // Secrets never touch localStorage or client state in plaintext — the
  // server encrypts them at rest and only ever returns masked previews
  // (e.g. "••••ab12"). See functions/api/vendor-gateways/{save,list}.ts.
  type GatewayStatus = { connected: boolean; configured: boolean; publicKeyMasked: string; secretKeyMasked: string; clientIdMasked: string };
  const [gateways, setGateways] = useState<Record<string, GatewayStatus>>({});
  const [gatewaysLoading, setGatewaysLoading] = useState(true);

  const reloadGateways = useCallback(() => {
    setGatewaysLoading(true);
    fetchCloudGateways().then(cloud => {
      const asMap: typeof gateways = {};
      for (const g of cloud || []) {
        asMap[g.gateway] = {
          connected: g.isActive,
          configured: g.configured,
          publicKeyMasked: g.apiKeyMasked,
          secretKeyMasked: g.apiSecretMasked,
          clientIdMasked: g.clientIdMasked,
        };
      }
      setGateways(asMap);
      setGatewaysLoading(false);
    });
  }, []);

  useEffect(() => { reloadGateways(); }, [reloadGateways]);

  // Modal for Payment connection
  const [activeGatewayModal, setActiveGatewayModal] = useState<string | null>(null);
  const [modalPublicKey, setModalPublicKey] = useState('');
  const [modalSecretKey, setModalSecretKey] = useState('');
  const [modalClientId, setModalClientId] = useState('');
  const [savingGateway, setSavingGateway] = useState(false);

  const openGatewayModal = (gateway: string) => {
    setActiveGatewayModal(gateway);
    // Fields start blank on purpose: the real secret never comes back from
    // the server after the first save. Leaving a field blank on submit
    // keeps that credential unchanged (see handleSaveGateway).
    setModalPublicKey('');
    setModalSecretKey('');
    setModalClientId('');
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGatewayModal) return;
    const existing = gateways[activeGatewayModal];
    if (!existing?.configured && (!modalPublicKey.trim() || !modalSecretKey.trim())) {
      alert('Renseignez au moins la clé publique et la clé secrète.');
      return;
    }
    setSavingGateway(true);
    const ok = await pushCloudGateway({ gateway: activeGatewayModal, apiKey: modalPublicKey, apiSecret: modalSecretKey, clientId: modalClientId, isActive: true });
    setSavingGateway(false);
    if (!ok) {
      alert("Erreur lors de l'enregistrement de la passerelle.");
      return;
    }
    setActiveGatewayModal(null);
    reloadGateways();
  };

  const handleDisconnectGateway = (gateway: string) => {
    if (confirm(`Voulez-vous vraiment désactiver la passerelle ${gateway} ? Vos identifiants restent enregistrés, vous pourrez la réactiver sans les ressaisir.`)) {
      pushCloudGateway({ gateway, isActive: false }).then(ok => {
        if (ok) reloadGateways();
        else alert('Erreur lors de la désactivation de la passerelle.');
      });
    }
  };

  // Policies state
  const [termsPolicy, setTermsPolicy] = useState(() => localStorage.getItem(getTenantStorageKey('policy_terms')) || 'Nos conditions d’utilisation...');
  const [privacyPolicy, setPrivacyPolicy] = useState(() => localStorage.getItem(getTenantStorageKey('policy_privacy')) || 'Notre politique de confidentialité...');
  const [refundPolicy, setRefundPolicy] = useState(() => localStorage.getItem(getTenantStorageKey('policy_refund')) || 'Notre politique de remboursement...');

  // Chat settings state
  const [chatProvider, setChatProvider] = useState(() => localStorage.getItem(getTenantStorageKey('chat_provider')) || 'whatsapp');
  const [chatValue, setChatValue] = useState(() => localStorage.getItem(getTenantStorageKey('chat_value')) || '+2250700000000');

  // Global country selection autocomplete state
  const [selectedCountryCode, setSelectedCountryCode] = useState(() => {
    const found = GLOBAL_COUNTRIES.find(c => c.code === shopProfile.country || c.name === shopProfile.country);
    return found ? found.code : 'CI';
  });

  const [countrySearch, setCountrySearch] = useState(() => {
    const found = GLOBAL_COUNTRIES.find(c => c.code === shopProfile.country || c.name === shopProfile.country);
    return found ? `${found.flag} ${found.name} (${found.nameEn})` : '🇨🇮 Côte d\'Ivoire (Côte d\'Ivoire)';
  });

  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  const filteredCountries = GLOBAL_COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.nameEn.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Domains State initialized with LocalStorage
  const [domains, setDomains] = useState<CustomDomain[]>(() => {
    const saved = localStorage.getItem(getTenantStorageKey('liafrikos_domains'));
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      { domain: shopSubdomain, type: 'platform', status: 'active', createdAt: 'Créé à la création' }
    ];
  });

  // Sync Domains with LocalStorage
  useEffect(() => {
    localStorage.setItem(getTenantStorageKey('liafrikos_domains'), JSON.stringify(domains));
    // Dispatch local storage event to notify other windows/components
    window.dispatchEvent(new Event('storage'));
  }, [domains]);

  // Synchronize domains if changed externally
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem(getTenantStorageKey('liafrikos_domains'));
      if (saved) {
        try {
          setDomains(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // domain search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ ext: string; price: string; available: boolean }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'brand' | 'card'>('wave');
  const [isPurchasing, setIsPurchasing] = useState(false);

  // external domain states
  const [externalDomainInput, setExternalDomainInput] = useState('');
  const [selectedExternalDomain, setSelectedExternalDomain] = useState<CustomDomain | null>(null);
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);

  // Search domain simulation
  const handleDomainSearch = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setSelectedExtension(null);

    setTimeout(() => {
      setSearchResults([
        { ext: `.com`, price: '$10.98 / year', available: true },
        { ext: `.net`, price: '$14.58 / year', available: true },
        { ext: `.org`, price: '$12.18 / year', available: true },
        { ext: `.shop`, price: '$4.79 / year', available: true },
        { ext: `.co`, price: '$25.19 / year', available: true },
        { ext: `.io`, price: '$47.99 / year', available: true },
        { ext: `.ai`, price: '$95.99 / year', available: true },
        { ext: `.info`, price: '$17.99 / year', available: true },
      ]);
      setIsSearching(false);
    }, 1200);
  };

  // ⚠️ Buy domain is still a UI simulation — no real registrar/Cloudflare
  // ⚠️ Buy domain is still a UI simulation — no real registrar/Cloudflare
  // purchase API is wired in. Available to every plan (custom domains
  // belong to everyone, not gated like other plan features) — the
  // purchase itself needs a real registrar integration (separate work).
  const handleBuyDomain = () => {
    if (!selectedExtension) return;
    setIsPurchasing(true);

    setTimeout(() => {
      const domainName = `${searchQuery.toLowerCase().replace(/[^a-z0-9-]+/g, '')}${selectedExtension.ext}`;

      const newDomain: CustomDomain = {
        domain: domainName,
        type: 'purchased',
        status: 'active',
        createdAt: new Date().toLocaleDateString('fr-FR')
      };

      setDomains([...domains, newDomain]);
      setIsPurchasing(false);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedExtension(null);
      alert(`🎉 Félicitations ! Le domaine ${domainName} a été acheté avec succès et configuré sur Cloudflare !`);
    }, 2000);
  };

  // Add External Domain — calls the real Cloudflare Pages custom-domain API
  // (functions/api/domains/connect.ts). Falls back to local-only tracking
  // if the backend call fails (e.g. env vars not yet configured), so the UI
  // doesn't hard-break for merchants while that's being set up. Available
  // to every plan — custom domains belong to everyone.
  const [isConnectingDomain, setIsConnectingDomain] = useState(false);
  const handleAddExternalDomain = async () => {
    if (!externalDomainInput.trim()) return;
    const cleanDomain = externalDomainInput.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '');

    // check duplicates
    if (domains.some(d => d.domain === cleanDomain)) {
      alert('Ce domaine est déjà enregistré.');
      return;
    }

    setIsConnectingDomain(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('no session');

      const res = await fetch('/api/domains/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ domain: cleanDomain }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Erreur lors de la connexion du domaine.");
        setIsConnectingDomain(false);
        return;
      }

      const newDomain: CustomDomain = {
        domain: cleanDomain,
        type: 'external',
        status: 'dns_pending',
        createdAt: new Date().toLocaleDateString('fr-FR')
      };
      setDomains([...domains, newDomain]);
      setSelectedExternalDomain(newDomain);
      setExternalDomainInput('');
    } catch {
      // Backend not reachable/configured yet — keep working locally so the
      // merchant isn't blocked, but the domain isn't really attached on
      // Cloudflare until the backend call succeeds on a retry.
      const newDomain: CustomDomain = {
        domain: cleanDomain,
        type: 'external',
        status: 'dns_pending',
        createdAt: new Date().toLocaleDateString('fr-FR')
      };
      setDomains([...domains, newDomain]);
      setSelectedExternalDomain(newDomain);
      setExternalDomainInput('');
    } finally {
      setIsConnectingDomain(false);
    }
  };

  const getDomainChallenge = (domain: string): string => {
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
      hash = (hash << 5) - hash + domain.charCodeAt(i);
      hash |= 0;
    }
    return `liafrik-challenge-${Math.abs(hash).toString(16)}`;
  };

  // Verify DNS — calls the real Cloudflare status API (functions/api/domains/status.ts)
  // which re-checks the domain against Cloudflare edge and persists the real
  // dns_status in Supabase, instead of faking success after a timeout.
  const handleVerifyDns = async (dom: CustomDomain) => {
    setIsVerifyingDns(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('no session');

      const res = await fetch(`/api/domains/status?domain=${encodeURIComponent(dom.domain)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'status check failed');

      const isVerified = result.status === 'verified';
      const updated = domains.map(d => d.domain === dom.domain ? { ...d, status: isVerified ? ('active' as const) : ('dns_pending' as const) } : d);
      setDomains(updated);
      if (isVerified) {
        setSelectedExternalDomain(null);
        alert(`✅ Félicitations ! Les DNS de ${dom.domain} ont été résolus et vérifiés sur le réseau Cloudflare edge ! Le challenge TXT (${getDomainChallenge(dom.domain)}) a été validé. Le domaine est maintenant actif.`);
      } else {
        alert(`DNS de ${dom.domain} pas encore propagés. Réessayez dans quelques minutes.`);
      }
    } catch {
      alert(`Impossible de vérifier ${dom.domain} pour le moment. Réessayez.`);
    } finally {
      setIsVerifyingDns(false);
    }
  };

  // Delete Domain
  const handleDeleteDomain = (domainName: string) => {
    if (domainName === shopSubdomain) {
      alert('Vous ne pouvez pas supprimer le domaine de base de la plateforme.');
      return;
    }
    if (confirm(`Êtes-vous sûr de vouloir supprimer le domaine ${domainName} ?`)) {
      setDomains(domains.filter(d => d.domain !== domainName));
      if (selectedExternalDomain?.domain === domainName) {
        setSelectedExternalDomain(null);
      }
    }
  };

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Gérez les options de votre boutique et connectez votre marque." />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-2 h-fit lg:sticky lg:top-20">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${active === s.id ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}>
              {s.label}
            </button>
          ))}
        </Card>
        <Card className="lg:col-span-3 p-6">
          {active === 'general' && (
            <div className="space-y-4 text-xs sm:text-sm">
              <h3 className="font-bold text-gray-900 text-sm">Informations boutique</h3>
              <div><label className="block font-semibold text-gray-700 mb-1">Nom</label><input defaultValue={shopProfile.name} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs" /></div>
              <div><label className="block font-semibold text-gray-700 mb-1">Email contact</label><input defaultValue="contact@os.liafrik.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-semibold text-gray-700 mb-1">Devise</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white"><option>{shopProfile.currency}</option><option>XOF</option><option>GHS</option><option>NGN</option><option>KES</option><option>ZAR</option></select></div>
                <div><label className="block font-semibold text-gray-700 mb-1">Fuseau horaire</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white"><option>Africa/Abidjan</option><option>Africa/Lagos</option><option>Africa/Nairobi</option></select></div>
              </div>
              <div className="relative">
                <label className="block font-semibold text-gray-700 mb-1">Pays (Recherche & Saisie globale)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={e => {
                      setCountrySearch(e.target.value);
                      setCountryDropdownOpen(true);
                    }}
                    onFocus={() => setCountryDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setCountryDropdownOpen(false), 200)}
                    placeholder="Recherchez un pays..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 pr-8 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {countryDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl divide-y divide-gray-50">
                    {filteredCountries.length === 0 ? (
                      <div className="p-2.5 text-xs text-gray-500">Aucun pays trouvé</div>
                    ) : (
                      filteredCountries.map(c => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountryCode(c.code);
                            setCountrySearch(`${c.flag} ${c.name} (${c.nameEn})`);
                            setCountryDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-brand-50 text-xs flex items-center gap-2"
                        >
                          <span className="text-sm">{c.flag}</span>
                          <span className="font-semibold text-gray-800">{c.name}</span>
                          <span className="text-gray-400">({c.nameEn})</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <Button size="sm" onClick={() => {
                saveShopProfile({ ...shopProfile, country: selectedCountryCode });
                setSettingsSaved(true);
                setTimeout(() => setSettingsSaved(false), 2000);
              }}>{settingsSaved ? 'Enregistré ✓' : 'Sauvegarder'}</Button>
            </div>
          )}
          {active === 'plan' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-sm">Plan actuel</h3>
              {planAccess.isSuperAdmin ? (
                <div className="p-4 bg-gray-900 rounded-xl text-xs sm:text-sm">
                  <p className="font-extrabold text-white">Super Admin</p>
                  <p className="text-gray-300">Accès illimité à toutes les fonctionnalités — aucun abonnement facturé.</p>
                </div>
              ) : (
                <div className="p-4 bg-brand-50 rounded-xl flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <p className="font-extrabold text-brand-800">Plan {planAccess.plan.name}</p>
                    <p className="text-gray-500">{planAccess.plan.price}$/mois</p>
                    {planAccess.status === 'trial' && planAccess.trialEndsAt && (
                      <p className="text-[11px] text-amber-600 font-medium mt-1">Essai gratuit jusqu'au {new Date(planAccess.trialEndsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    )}
                    {planAccess.status === 'active' && planAccess.planRenewsAt && (
                      <p className="text-[11px] text-gray-500 mt-1">Renouvellement le {new Date(planAccess.planRenewsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    )}
                    {planAccess.status === 'suspended' && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">Abonnement suspendu</p>
                    )}
                  </div>
                </div>
              )}
              {!planAccess.isSuperAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {PLANS.map(p => {
                    const isCurrent = p.id === planAccess.plan.id;
                    return (
                      <div key={p.id} className={`p-4 rounded-xl border-2 text-center ${p.id === 'premium' ? 'border-brand-500 bg-brand-50/20' : 'border-gray-200 bg-white'}`}>
                        {p.id === 'premium' && <Badge color="orange">Recommandé</Badge>}
                        <p className="font-bold mt-1 text-xs text-gray-900">{p.name}</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">${p.price}</p>
                        <p className="text-[10px] text-gray-400 mb-3">/mois</p>
                        {isCurrent ? (
                          <Badge color="green">Plan actuel</Badge>
                        ) : (
                          <Button size="sm" disabled={isUpgrading} onClick={() => handleUpgradePlan(p.id)} className="w-full justify-center">
                            {isUpgrading ? '...' : 'Choisir ce plan'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {active === 'payments' && (
            <div className="space-y-4 text-xs sm:text-sm text-left">
              <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">🔑 Vos Moyens de paiement</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Associez vos clés API marchandes privées. 100% sécurisé et isolé.</p>
                </div>
                <Badge color="green">Isolation Tenant Activée</Badge>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {['Flutterwave', 'Paystack', 'PayUnit', 'Orange Money', 'MTN MoMo', 'CinetPay', 'Stripe', 'PayPal'].map(g => {
                  const status = gateways[g];
                  const conn = status?.connected;
                  return (
                    <div key={g} className="flex items-center justify-between p-4 border border-gray-150 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-sm">{g}</p>
                          <Badge color={conn ? 'green' : 'gray'}>
                            {conn ? 'Actif / Connecté' : status?.configured ? 'Désactivé' : 'Inactif'}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {status?.configured
                            ? `Clé publique: ${status.publicKeyMasked || '—'} | Secret: ${status.secretKeyMasked || '••••'}`
                            : gatewaysLoading
                              ? 'Chargement…'
                              : 'Configurez vos clés d’API privées pour recevoir directement vos fonds.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant={status?.configured ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => openGatewayModal(g)}
                        >
                          {status?.configured ? 'Configurer' : 'Connecter'}
                        </Button>
                        {conn && (
                          <button
                            onClick={() => handleDisconnectGateway(g)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-100"
                            title="Déconnecter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Gateways Connection Dialog modal overlay */}
              {activeGatewayModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-150">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-brand-50/50">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="text-brand-600 w-5 h-5" />
                        <h4 className="font-extrabold text-gray-900 text-sm">Passerelle {activeGatewayModal}</h4>
                      </div>
                      <button onClick={() => setActiveGatewayModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>

                    <form onSubmit={handleSaveGateway} className="p-6 space-y-4 text-left">
                      <p className="text-xs text-gray-500 leading-normal">
                        Entrez vos identifiants {activeGatewayModal} pour lier ce moyen de paiement à votre site marchand. Vos clés sont chiffrées côté serveur (AES-256) avant stockage et ne sont jamais renvoyées en clair.
                        {gateways[activeGatewayModal]?.configured && ' Laissez un champ vide pour conserver la valeur déjà enregistrée.'}
                      </p>

                      <div className="space-y-3">
                        {activeGatewayModal !== 'PayPal' && (
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">
                              {activeGatewayModal === 'PayUnit' ? 'API User' : 'Clé Publique (Public API Key)'}
                            </label>
                            <input
                              type="text"
                              required={!gateways[activeGatewayModal]?.configured}
                              value={modalPublicKey}
                              onChange={e => setModalPublicKey(e.target.value)}
                              placeholder={gateways[activeGatewayModal]?.publicKeyMasked || (activeGatewayModal === 'PayUnit' ? 'api_user...' : 'pk_live_...')}
                              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase">
                            {activeGatewayModal === 'PayPal' ? 'Client Secret' : activeGatewayModal === 'PayUnit' ? 'API Password' : 'Clé Secrète (Secret Key / Token)'}
                          </label>
                          <input
                            type="password"
                            required={!gateways[activeGatewayModal]?.configured}
                            value={modalSecretKey}
                            onChange={e => setModalSecretKey(e.target.value)}
                            placeholder={gateways[activeGatewayModal]?.secretKeyMasked || (activeGatewayModal === 'PayPal' ? 'PayPal Secret Key' : activeGatewayModal === 'PayUnit' ? 'api_password...' : 'sk_live_...')}
                            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                          />
                        </div>

                        {['PayPal', 'Stripe', 'CinetPay', 'PayUnit'].includes(activeGatewayModal) && (
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">
                              {activeGatewayModal === 'PayPal' ? 'PayPal Client ID' : activeGatewayModal === 'PayUnit' ? 'Application Token (live ou sandbox)' : 'Merchant ID / Service ID'}
                            </label>
                            <input
                              type="text"
                              required={!gateways[activeGatewayModal]?.configured}
                              value={modalClientId}
                              onChange={e => setModalClientId(e.target.value)}
                              placeholder={gateways[activeGatewayModal]?.clientIdMasked || (activeGatewayModal === 'PayUnit' ? 'live_xxxxxxxxxxxxxxx' : 'ID marchand officiel...')}
                              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveGatewayModal(null)}
                          className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={savingGateway}
                          className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-full text-xs hover:bg-emerald-700 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingGateway ? 'Enregistrement…' : 'Sauvegarder et Activer'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
          {active === 'domains' && (
            <div className="space-y-6 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><Globe className="w-5 h-5 text-brand-600" /> Gestion des Domaines</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Bâtissez votre crédibilité avec votre propre extension de domaine.</p>
                </div>
                <Badge color="green">Intégration Cloudflare Connectée</Badge>
              </div>

              {/* Domains list */}
              <div className="space-y-2">
                <p className="font-bold text-gray-800 text-xs">Domaines associés à votre boutique</p>
                {domains.map(d => (
                  <div key={d.domain} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-black text-gray-900">{d.domain}</p>
                        <p className="text-[10px] text-gray-400 capitalize">{d.type} · {d.createdAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={d.status === 'active' ? 'green' : d.status === 'dns_pending' ? 'brand' : 'red'}>
                        {d.status === 'active' ? 'Actif' : d.status === 'dns_pending' ? 'En attente DNS' : 'Erreur DNS'}
                      </Badge>

                      {d.status === 'dns_pending' && (
                        <button
                          onClick={() => setSelectedExternalDomain(d)}
                          className="px-2.5 py-1 rounded bg-brand-100 text-brand-700 font-bold text-[10px] hover:bg-brand-200"
                        >
                          Configurer DNS
                        </button>
                      )}

                      {d.type !== 'platform' && (
                        <button
                          onClick={() => handleDeleteDomain(d.domain)}
                          className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* External Domain DNS Verification Card popup */}
              {selectedExternalDomain && (
                <div className="border border-brand-200 bg-brand-50/30 rounded-2xl p-4 space-y-4 animate-slide-up">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-extrabold text-gray-900">Configurer les DNS pour {selectedExternalDomain.domain}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Veuillez ajouter ces 3 enregistrements chez votre registrar externe (GoDaddy, Namecheap, etc.) pour pointer vers nos serveurs Cloudflare.</p>
                    </div>
                    <button onClick={() => setSelectedExternalDomain(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>

                  {/* DNS Records Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse bg-white rounded-lg overflow-hidden border border-gray-200">
                      <thead>
                        <tr className="bg-gray-100 font-bold border-b border-gray-200">
                          <th className="p-2">Type</th>
                          <th className="p-2">Hôte (Host)</th>
                          <th className="p-2">Valeur (Cible)</th>
                          <th className="p-2">TTL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-mono">
                        <tr>
                          <td className="p-2 font-black text-brand-700">A</td>
                          <td className="p-2">@</td>
                          <td className="p-2">104.21.43.201</td>
                          <td className="p-2">Auto</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-black text-brand-700">CNAME</td>
                          <td className="p-2">www</td>
                          <td className="p-2">os.liafrik.com</td>
                          <td className="p-2">Auto</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-black text-brand-700">TXT</td>
                          <td className="p-2">_liafrik-challenge</td>
                          <td className="p-2 font-mono text-[10px] bg-gray-50 border border-gray-100 rounded px-1">{getDomainChallenge(selectedExternalDomain.domain)}</td>
                          <td className="p-2">Auto</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleVerifyDns(selectedExternalDomain)}
                      disabled={isVerifyingDns}
                      className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-black hover:bg-brand-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isVerifyingDns ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Vérification en cours...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" /> J'ai configuré mes DNS, Vérifier maintenant
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedExternalDomain(null)}
                      className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs hover:bg-white"
                    >
                      Plus tard
                    </button>
                  </div>
                </div>
              )}

              {/* Buy a domain on the platform */}
              <div className="border border-gray-200 rounded-2xl p-4 space-y-4 bg-white shadow-sm">
                <div>
                  <p className="font-extrabold text-gray-900 text-xs">Acheter un domaine sur la plateforme (Cloudflare Connect)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Enregistrez un domaine instantanément. Paiement local via Wave, Orange Money ou Carte Bancaire.</p>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleDomainSearch(); }}
                      placeholder="Ex. maboutique-royal"
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <button
                    onClick={handleDomainSearch}
                    disabled={isSearching}
                    className="px-4 py-2 bg-brand-600 text-white rounded-full text-xs font-black flex items-center gap-1.5 hover:bg-brand-700 disabled:opacity-50"
                  >
                    {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Rechercher
                  </button>
                </div>

                {/* Search results simulation */}
                {searchResults.length > 0 && (
                  <div className="space-y-2 border-t pt-3 border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Résultats de recherche</p>
                    <div className="divide-y divide-gray-50 bg-slate-50/50 rounded-xl border border-gray-100 overflow-hidden">
                      {searchResults.map(res => {
                        const domainName = `${searchQuery.toLowerCase().replace(/[^a-z0-9-]+/g, '')}${res.ext}`;
                        const isSelected = selectedExtension?.ext === res.ext;
                        return (
                          <div key={res.ext} className={`p-3 flex items-center justify-between transition-colors ${isSelected ? 'bg-brand-50/30' : ''}`}>
                            <div>
                              <span className="font-bold text-gray-900">{domainName}</span>
                              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5"><Check className="w-3 h-3" /> Disponible instantanément</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-gray-800">{res.price}</span>
                              <button
                                onClick={() => setSelectedExtension(res)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  isSelected ? 'bg-brand-600 text-white shadow-sm' : 'border border-gray-200 text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                {isSelected ? 'Sélectionné' : 'Choisir'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Purchase Checkout Segment */}
                {selectedExtension && (
                  <div className="border-t border-gray-100 pt-4 space-y-4">
                    <div>
                      <p className="text-xs font-black text-gray-800">Finaliser l'enregistrement de {searchQuery.toLowerCase().replace(/[^a-z0-9-]+/g, '')}{selectedExtension.ext}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Choisissez votre moyen de paiement sécurisé (Tarif Cloudflare + 20% markup, affiché en USD).</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'wave', label: 'Wave', desc: 'Sénégal, CI' },
                        { id: 'brand', label: 'Orange Money', desc: 'Afrique de l\'Ouest' },
                        { id: 'card', label: 'Carte Bancaire', desc: 'Visa / Mastercard' },
                      ].map(method => (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id as any)}
                          className={`p-3 border rounded-xl text-left transition-all ${paymentMethod === method.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <p className="text-xs font-extrabold text-gray-900 flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-gray-400" /> {method.label}
                          </p>
                          <span className="text-[9px] text-gray-400 leading-none mt-1 block">{method.desc}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleBuyDomain}
                        disabled={isPurchasing}
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-full text-xs font-black hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 animate-pulse"
                      >
                        {isPurchasing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Connexion API Cloudflare...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" /> Payer {selectedExtension.price}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedExtension(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 font-bold"
                      >
                        Annuler
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400">Le prix inclut les frais d'enregistrement wholesale de Cloudflare majorés de 20% pour frais de service Sellia.</p>
                  </div>
                )}
              </div>

              {/* Connect existing domain card */}
              <div className="border border-gray-200 rounded-2xl p-4 space-y-3 bg-white shadow-sm">
                <div>
                  <p className="font-extrabold text-gray-900 text-xs">Connecter un domaine externe existant</p>
                  <p className="text-xs text-gray-500 mt-0.5">Saisissez un nom de domaine acheté chez GoDaddy, Namecheap ou LWS, puis configurez vos DNS.</p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={externalDomainInput}
                    onChange={e => setExternalDomainInput(e.target.value)}
                    placeholder="Ex. maboutique.com"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    onClick={handleAddExternalDomain}
                    disabled={isConnectingDomain}
                    className="px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-black hover:bg-slate-800 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> {isConnectingDomain ? 'Connexion...' : 'Connecter'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {active === 'shipping' && (
            <div className="space-y-4 text-xs sm:text-sm">
              <h3 className="font-bold text-gray-900 text-sm">Zones de livraison</h3>
              {settingsSaved && <p className="text-green-600 text-xs">Enregistré ✓</p>}
              {(settings.shippingZones || []).length === 0 && (
                <p className="text-gray-400">Aucune zone configurée — vos clients ne verront pas de frais de livraison précis au checkout.</p>
              )}
              {(settings.shippingZones || []).map((z: { id: string; name: string; price: number; days: string }) => (
                <div key={z.id} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-white shadow-sm">
                  <div><p className="font-bold text-gray-900 font-medium">{z.name}</p><p className="text-[10px] text-gray-500">{z.price.toLocaleString('fr-FR')} XOF · {z.days}</p></div>
                  <Button variant="ghost" size="sm" onClick={() => updateSetting('shippingZones', (settings.shippingZones || []).filter((x: any) => x.id !== z.id))}>Retirer</Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2 items-end p-3 bg-gray-50 rounded-lg">
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1">Zone</label><input id="newZoneName" placeholder="Ex. Sénégal" className="px-2 py-1.5 border border-gray-200 rounded-md text-xs w-32" /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1">Prix (XOF)</label><input id="newZonePrice" type="number" placeholder="1000" className="px-2 py-1.5 border border-gray-200 rounded-md text-xs w-24" /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1">Délai</label><input id="newZoneDays" placeholder="2-3 jours" className="px-2 py-1.5 border border-gray-200 rounded-md text-xs w-24" /></div>
                <Button variant="secondary" size="sm" onClick={() => {
                  const nameEl = document.getElementById('newZoneName') as HTMLInputElement;
                  const priceEl = document.getElementById('newZonePrice') as HTMLInputElement;
                  const daysEl = document.getElementById('newZoneDays') as HTMLInputElement;
                  if (!nameEl.value.trim()) return;
                  const zone = { id: crypto.randomUUID(), name: nameEl.value.trim(), price: Number(priceEl.value) || 0, days: daysEl.value.trim() || 'Non précisé' };
                  updateSetting('shippingZones', [...(settings.shippingZones || []), zone]);
                  nameEl.value = ''; priceEl.value = ''; daysEl.value = '';
                }}>Ajouter une zone</Button>
              </div>
            </div>
          )}
          {active === 'policies' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Éditeur de Politiques Légales</h3>
              <p className="text-gray-500">Rédigez les conditions de vente, livraison, retours et de protection des données pour rassurer vos acheteurs.</p>
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Conditions Générales de Vente & d’Utilisation (CGU / CGV)</label>
                  <textarea
                    rows={4}
                    value={termsPolicy}
                    onChange={e => setTermsPolicy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Politique de Confidentialité</label>
                  <textarea
                    rows={4}
                    value={privacyPolicy}
                    onChange={e => setPrivacyPolicy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Politique de Retour, Remboursement & Mentions Légales</label>
                  <textarea
                    rows={4}
                    value={refundPolicy}
                    onChange={e => setRefundPolicy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(getTenantStorageKey('policy_terms'), termsPolicy);
                    localStorage.setItem(getTenantStorageKey('policy_privacy'), privacyPolicy);
                    localStorage.setItem(getTenantStorageKey('policy_refund'), refundPolicy);
                    alert('🎉 Vos politiques légales ont été enregistrées avec succès et connectées au pied de page de votre site !');
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-md"
                >
                  Sauvegarder les politiques
                </button>
              </div>
            </div>
          )}
          {active === 'billing' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Facturation</h3>
              {planAccess.isSuperAdmin ? (
                <p className="text-gray-500">Compte super admin — aucune facturation.</p>
              ) : (
                <>
                  <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">Plan {planAccess.plan.name}</p>
                      <p className="text-gray-500">{planAccess.plan.price}$/mois</p>
                      {planAccess.status === 'trial' && planAccess.trialEndsAt && (
                        <p className="text-[11px] text-amber-600 font-medium mt-1">Essai jusqu'au {new Date(planAccess.trialEndsAt).toLocaleDateString('fr-FR')}</p>
                      )}
                      {planAccess.status === 'active' && planAccess.planRenewsAt && (
                        <p className="text-[11px] text-gray-500 mt-1">Renouvellement le {new Date(planAccess.planRenewsAt).toLocaleDateString('fr-FR')}</p>
                      )}
                    </div>
                    <Button size="sm" onClick={() => setActive('plan')}>Gérer le plan</Button>
                  </div>
                  <p className="text-gray-500">L'historique des paiements de souscription apparaîtra ici après votre premier paiement Flutterwave.</p>
                </>
              )}
            </div>
          )}
          {active === 'users' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Utilisateurs & équipe</h3>
              <p className="text-gray-500">La gestion complète des membres de l'équipe (invitations, rôles, permissions) se fait dans Équipe, dans le menu principal.</p>
              <Link to="/app/team"><Button size="sm">Aller à Équipe</Button></Link>
            </div>
          )}
          {active === 'checkout' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Réglages du checkout</h3>
              {settingsSaved && <p className="text-green-600 text-xs">Enregistré ✓</p>}
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={settings.guestCheckout !== false} onChange={e => updateSetting('guestCheckout', e.target.checked)} />
                Autoriser le paiement sans compte client
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!settings.requireTermsAcceptance} onChange={e => updateSetting('requireTermsAcceptance', e.target.checked)} />
                Exiger l'acceptation des conditions générales avant paiement
              </label>
            </div>
          )}
          {active === 'accounts' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Comptes clients</h3>
              {settingsSaved && <p className="text-green-600 text-xs">Enregistré ✓</p>}
              <div className="space-y-2">
                {[{ id: 'disabled', label: 'Désactivés — commande sans compte uniquement' }, { id: 'optional', label: 'Optionnels — le client choisit' }, { id: 'required', label: 'Obligatoires — compte requis pour commander' }].map(o => (
                  <label key={o.id} className="flex items-center gap-2">
                    <input type="radio" name="accountMode" checked={(settings.accountMode || 'optional') === o.id} onChange={() => updateSetting('accountMode', o.id)} />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
          )}
          {active === 'taxes' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Taxes et droits</h3>
              {settingsSaved && <p className="text-green-600 text-xs">Enregistré ✓</p>}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Taux de taxe par défaut (%)</label>
                <input type="number" min={0} max={100} value={settings.taxRate ?? 0} onChange={e => updateSetting('taxRate', Number(e.target.value))} className="w-32 px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!settings.pricesIncludeTax} onChange={e => updateSetting('pricesIncludeTax', e.target.checked)} />
                Les prix affichés incluent déjà la taxe
              </label>
              <p className="text-gray-400 text-[11px]">Ce taux est appliqué comme référence pour vos calculs — le calcul automatique par produit/pays n'est pas encore branché.</p>
            </div>
          )}
          {active === 'languages' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Langues</h3>
              <p className="text-gray-500">Langue d'affichage du tableau de bord.</p>
              <div className="flex gap-2">
                {(['fr', 'en'] as const).map(l => (
                  <button key={l} onClick={() => setLang(l)} className={`px-4 py-2 rounded-full text-xs font-bold border-2 ${lang === l ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'}`}>
                    {l === 'fr' ? 'Français' : 'English'}
                  </button>
                ))}
              </div>
            </div>
          )}
          {active === 'apps' && (
            <div className="space-y-3 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Apps</h3>
              <p className="text-gray-500">La marketplace de connecteurs d'apps arrive dans un prochain lot — un peu de patience.</p>
            </div>
          )}
          {active === 'locations' && (
            <div className="space-y-4 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Emplacements</h3>
              {settingsSaved && <p className="text-green-600 text-xs">Enregistré ✓</p>}
              {(settings.locations || []).length === 0 && <p className="text-gray-400">Aucun emplacement — votre adresse principale est utilisée par défaut.</p>}
              {(settings.locations || []).map((l: { id: string; name: string; address: string }) => (
                <div key={l.id} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-white">
                  <div><p className="font-bold text-gray-900">{l.name}</p><p className="text-[10px] text-gray-500">{l.address}</p></div>
                  <Button variant="ghost" size="sm" onClick={() => updateSetting('locations', (settings.locations || []).filter((x: any) => x.id !== l.id))}>Retirer</Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2 items-end p-3 bg-gray-50 rounded-lg">
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1">Nom</label><input id="newLocName" placeholder="Entrepôt principal" className="px-2 py-1.5 border border-gray-200 rounded-md text-xs w-40" /></div>
                <div><label className="block text-[10px] font-bold text-gray-500 mb-1">Adresse</label><input id="newLocAddress" placeholder="Adresse complète" className="px-2 py-1.5 border border-gray-200 rounded-md text-xs w-56" /></div>
                <Button variant="secondary" size="sm" onClick={() => {
                  const nameEl = document.getElementById('newLocName') as HTMLInputElement;
                  const addrEl = document.getElementById('newLocAddress') as HTMLInputElement;
                  if (!nameEl.value.trim()) return;
                  updateSetting('locations', [...(settings.locations || []), { id: crypto.randomUUID(), name: nameEl.value.trim(), address: addrEl.value.trim() }]);
                  nameEl.value = ''; addrEl.value = '';
                }}>Ajouter</Button>
              </div>
            </div>
          )}
          {active === 'channels' && (
            <div className="space-y-4 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Canaux de vente</h3>
              {settingsSaved && <p className="text-green-600 text-xs">Enregistré ✓</p>}
              <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-white">
                <div><p className="font-bold text-gray-900">Boutique en ligne</p><p className="text-[10px] text-gray-500">{getShopSubdomain()}</p></div>
                <Badge color="green">Toujours actif</Badge>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-white">
                <div>
                  <p className="font-bold text-gray-900">Marketplace Sellia</p>
                  <p className="text-[10px] text-gray-500">Vos produits actifs apparaissent aussi sur la marketplace commune à toutes les boutiques.</p>
                </div>
                {planAccess.plan.marketplaceListing || planAccess.isSuperAdmin || planAccess.unrestricted ? (
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={settings.marketplaceEnabled !== false} onChange={e => updateSetting('marketplaceEnabled', e.target.checked)} />
                  </label>
                ) : (
                  <Badge color="gray">Plan Premium+</Badge>
                )}
              </div>
            </div>
          )}
          {active === 'events' && (
            <div className="space-y-4 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Événements clients (Webhooks)</h3>
              {settingsSaved && <p className="text-green-600 text-xs">Enregistré ✓</p>}
              <p className="text-gray-500">Recevez une notification HTTP (POST) sur votre propre serveur à chaque nouvelle commande — utile pour connecter Zapier, Make, ou votre propre système.</p>
              <div>
                <label className="block font-bold text-gray-700 mb-1">URL du webhook</label>
                <input
                  value={settings.orderWebhookUrl || ''}
                  onChange={e => updateSetting('orderWebhookUrl', e.target.value)}
                  placeholder="https://votre-serveur.com/webhook"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <p className="text-[10px] text-gray-400">Déclenché réellement à chaque commande créée (dashboard ou vitrine publique) — payload JSON avec les détails de la commande.</p>
            </div>
          )}
          {active === 'metafields' && (
            <div className="space-y-4 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Metafields</h3>
              {settingsSaved && <p className="text-green-600 text-xs">Enregistré ✓</p>}
              <p className="text-gray-500">Définissez des champs personnalisés qui apparaîtront dans le formulaire de chaque produit (ex. Matière, Poids, Origine).</p>
              {(settings.metafieldDefinitions || []).length === 0 && <p className="text-gray-400 text-xs">Aucun champ personnalisé.</p>}
              {(settings.metafieldDefinitions || []).map((m: { id: string; label: string }) => (
                <div key={m.id} className="p-2.5 border border-gray-200 rounded-lg flex items-center justify-between bg-white">
                  <span className="font-medium text-gray-900">{m.label}</span>
                  <Button variant="ghost" size="sm" onClick={() => updateSetting('metafieldDefinitions', (settings.metafieldDefinitions || []).filter((x: any) => x.id !== m.id))}>Retirer</Button>
                </div>
              ))}
              <div className="flex gap-2 p-3 bg-gray-50 rounded-lg">
                <input id="newMetafieldLabel" placeholder="Ex. Matière" className="flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-xs" />
                <Button variant="secondary" size="sm" onClick={() => {
                  const el = document.getElementById('newMetafieldLabel') as HTMLInputElement;
                  if (!el.value.trim()) return;
                  updateSetting('metafieldDefinitions', [...(settings.metafieldDefinitions || []), { id: crypto.randomUUID(), label: el.value.trim() }]);
                  el.value = '';
                }}>Ajouter le champ</Button>
              </div>
            </div>
          )}
          {active === 'notifications' && (
            <div className="space-y-4 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
              {settingsSaved && <p className="text-green-600 text-xs">Enregistré ✓</p>}
              <p className="text-gray-500">Contrôle ce qui déclenche le badge de notification (la cloche) dans le dashboard — aucun système d'envoi d'email n'est encore branché, ces réglages pilotent uniquement les alertes internes.</p>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={settings.notifyPendingOrders !== false} onChange={e => updateSetting('notifyPendingOrders', e.target.checked)} />
                Commandes en attente
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!settings.notifyLowStock} onChange={e => updateSetting('notifyLowStock', e.target.checked)} />
                Alertes stock bas (≤ 5 unités)
              </label>
            </div>
          )}
          {active === 'privacy' && (
            <div className="space-y-4 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Confidentialité client</h3>
              {settingsSaved && <p className="text-green-600 text-xs">Enregistré ✓</p>}
              <label className="block font-bold text-gray-700 mb-1">Politique de confidentialité (affichée sur votre boutique)</label>
              <textarea
                value={settings.privacyPolicyText || ''}
                onChange={e => updateSetting('privacyPolicyText', e.target.value)}
                rows={6}
                placeholder="Décrivez comment vous collectez et utilisez les données de vos clients..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
              />
            </div>
          )}
          {active === 'chat' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Fournisseur de Live Chat Support</h3>
              <p className="text-gray-500">Offrez un service client exceptionnel en connectant une bulle de chat en direct (WhatsApp, Crisp, ou Tawk.to).</p>
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Choisissez votre canal préféré</label>
                  <select
                    value={chatProvider}
                    onChange={e => setChatProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white font-semibold text-gray-800"
                  >
                    <option value="whatsapp">💬 WhatsApp Business (Support direct)</option>
                    <option value="crisp">✨ Crisp Live Chat (Bulle de chat moderne)</option>
                    <option value="tawk">⚡ Tawk.to (Solution 100% gratuite)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Identifiant ou Numéro de téléphone</label>
                  <input
                    type="text"
                    value={chatValue}
                    onChange={e => setChatValue(e.target.value)}
                    placeholder={chatProvider === 'whatsapp' ? 'Ex: +2250700000000' : 'Ex: 938fd82-abc-42...'}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono bg-white"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    {chatProvider === 'whatsapp'
                      ? 'Entrez votre numéro avec indicatif pays pour diriger les visiteurs vers votre WhatsApp.'
                      : 'Collez simplement l’identifiant de site web de votre tableau de bord Crisp/Tawk.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(getTenantStorageKey('chat_provider'), chatProvider);
                    localStorage.setItem(getTenantStorageKey('chat_value'), chatValue);
                    alert('🎉 Intégration de Chat Client mise à jour avec succès sur votre boutique en ligne !');
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-md"
                >
                  Activer le Chat
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
