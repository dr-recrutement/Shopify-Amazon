import { PageHeader, Card, Button, Badge } from './ui';
import { useState, useEffect } from 'react';
import { AFRICAN_COUNTRIES, GLOBAL_COUNTRIES } from '../../lib/constants';
import { getShopProfile, getTenantStorageKey } from '../../lib/app-state';
import {
  Globe, Search, CreditCard, ShieldCheck, RefreshCw,
  Trash2, Plus, Check, AlertCircle, ArrowRight, HelpCircle, ChevronDown
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
  const [active, setActive] = useState('general');
  const shopProfile = getShopProfile();
  const shopSubdomain = `${shopProfile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.os.liafrik.com`;

  // Payment Gateways connections state
  const [gateways, setGateways] = useState<Record<string, { publicKey: string; secretKey: string; clientId: string; connected: boolean }>>(() => {
    const saved = localStorage.getItem(getTenantStorageKey('liafrikos_gateways'));
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {};
  });

  // Sync Gateways with local storage
  useEffect(() => {
    localStorage.setItem(getTenantStorageKey('liafrikos_gateways'), JSON.stringify(gateways));
  }, [gateways]);

  // Modal for Payment connection
  const [activeGatewayModal, setActiveGatewayModal] = useState<string | null>(null);
  const [modalPublicKey, setModalPublicKey] = useState('');
  const [modalSecretKey, setModalSecretKey] = useState('');
  const [modalClientId, setModalClientId] = useState('');

  const openGatewayModal = (gateway: string) => {
    const existing = gateways[gateway] || { publicKey: '', secretKey: '', clientId: '', connected: false };
    setActiveGatewayModal(gateway);
    setModalPublicKey(existing.publicKey || '');
    setModalSecretKey(existing.secretKey || '');
    setModalClientId(existing.clientId || '');
  };

  const handleSaveGateway = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGatewayModal) return;
    setGateways({
      ...gateways,
      [activeGatewayModal]: {
        publicKey: modalPublicKey,
        secretKey: modalSecretKey,
        clientId: modalClientId,
        connected: true
      }
    });
    setActiveGatewayModal(null);
  };

  const handleDisconnectGateway = (gateway: string) => {
    if (confirm(`Voulez-vous vraiment déconnecter la passerelle ${gateway} ?`)) {
      const next = { ...gateways };
      delete next[gateway];
      setGateways(next);
    }
  };

  // Policies state
  const [termsPolicy, setTermsPolicy] = useState(() => localStorage.getItem(getTenantStorageKey('policy_terms')) || 'Nos conditions d’utilisation...');
  const [privacyPolicy, setPrivacyPolicy] = useState(() => localStorage.getItem(getTenantStorageKey('policy_privacy')) || 'Notre politique de confidentialité...');
  const [refundPolicy, setRefundPolicy] = useState(() => localStorage.getItem(getTenantStorageKey('policy_refund')) || 'Notre politique de remboursement...');

  // Chat settings state
  const [chatProvider, setChatProvider] = useState(() => localStorage.getItem(getTenantStorageKey('chat_provider')) || 'whatsapp');
  const [chatValue, setChatValue] = useState(() => localStorage.getItem(getTenantStorageKey('chat_value')) || '+2250700000000');

  // 13 Shopify-like interactive Settings sub-tab state variables
  const [billingCompany, setBillingCompany] = useState(() => localStorage.getItem(getTenantStorageKey('billing_company')) || 'Os Retail Inc.');
  const [billingVat, setBillingVat] = useState(() => localStorage.getItem(getTenantStorageKey('billing_vat')) || 'EU123456789');
  const [billingEmail, setBillingEmail] = useState(() => localStorage.getItem(getTenantStorageKey('billing_email')) || 'billing@os.liafrik.com');
  const [billingCard, setBillingCard] = useState(() => localStorage.getItem(getTenantStorageKey('billing_card')) || '•••• •••• •••• 4242');

  const [staffUsers, setStaffUsers] = useState<{name: string, email: string, role: string}[]>(() => {
    const raw = localStorage.getItem(getTenantStorageKey('staff_users'));
    return raw ? JSON.parse(raw) : [
      { name: 'Admin Principal (LiAfrik)', email: 'admin@os.liafrik.com', role: 'Propriétaire' },
      { name: 'Adama Keita', email: 'adama@os.liafrik.com', role: 'Gestionnaire' }
    ];
  });
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Staff');

  const [checkoutContactMethod, setCheckoutContactMethod] = useState(() => localStorage.getItem(getTenantStorageKey('checkout_contact_method')) || 'email');
  const [checkoutLastName, setCheckoutLastName] = useState(() => localStorage.getItem(getTenantStorageKey('checkout_last_name')) || 'required');
  const [checkoutCompanyField, setCheckoutCompanyField] = useState(() => localStorage.getItem(getTenantStorageKey('checkout_company_field')) || 'optional');
  const [checkoutPhoneField, setCheckoutPhoneField] = useState(() => localStorage.getItem(getTenantStorageKey('checkout_phone_field')) || 'required');

  const [accountsStatus, setAccountsStatus] = useState(() => localStorage.getItem(getTenantStorageKey('accounts_status')) || 'optional');
  const [accountsTwoFactor, setAccountsTwoFactor] = useState(() => localStorage.getItem(getTenantStorageKey('accounts_two_factor')) === 'true');
  const [accountsSso, setAccountsSso] = useState(() => localStorage.getItem(getTenantStorageKey('accounts_sso')) === 'true');

  const [taxRateGlobal, setTaxRateGlobal] = useState(() => Number(localStorage.getItem(getTenantStorageKey('tax_rate_global')) || '18'));
  const [taxIncludeShipping, setTaxIncludeShipping] = useState(() => localStorage.getItem(getTenantStorageKey('tax_include_shipping')) === 'true');
  const [taxIncludePrices, setTaxIncludePrices] = useState(() => localStorage.getItem(getTenantStorageKey('tax_include_prices')) === 'true');

  const [storeLocations, setStoreLocations] = useState<{id: string, name: string, address: string}[]>(() => {
    const raw = localStorage.getItem(getTenantStorageKey('store_locations'));
    return raw ? JSON.parse(raw) : [
      { id: 'loc-1', name: 'Entrepôt Central (Dubaï)', address: 'Business Bay, Dubai, UAE' },
      { id: 'loc-2', name: 'Boutique Abidjan', address: 'Zone 4, Marcory, Abidjan' }
    ];
  });
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddr, setNewLocAddr] = useState('');

  const [installedApps, setInstalledApps] = useState<{id: string, name: string, desc: string, active: boolean}[]>(() => {
    const raw = localStorage.getItem(getTenantStorageKey('installed_apps'));
    return raw ? JSON.parse(raw) : [
      { id: 'app-whatsapp', name: 'WhatsApp Automations', desc: 'Envoie automatique de messages de suivi de commande.', active: true },
      { id: 'app-seo', name: 'SEO Booster Pro', desc: 'Optimisation automatique des balises méta produits.', active: false },
      { id: 'app-checkout-boost', name: 'Checkout Conversion Booster', desc: 'Affiche un compte à rebours d’achat sur le panier.', active: true }
    ];
  });

  const [salesChannels, setSalesChannels] = useState<{id: string, name: string, connected: boolean}[]>(() => {
    const raw = localStorage.getItem(getTenantStorageKey('sales_channels'));
    return raw ? JSON.parse(raw) : [
      { id: 'chan-web', name: 'Boutique en ligne Os', connected: true },
      { id: 'chan-insta', name: 'Instagram Shopping', connected: false },
      { id: 'chan-tiktok', name: 'TikTok Shop Connector', connected: true }
    ];
  });

  const [pixelGa, setPixelGa] = useState(() => localStorage.getItem(getTenantStorageKey('pixel_ga')) || '');
  const [pixelFb, setPixelFb] = useState(() => localStorage.getItem(getTenantStorageKey('pixel_fb')) || '');
  const [pixelTiktok, setPixelTiktok] = useState(() => localStorage.getItem(getTenantStorageKey('pixel_tiktok')) || '');

  const [notifOrderSubject, setNotifOrderSubject] = useState(() => localStorage.getItem(getTenantStorageKey('notif_order_subject')) || 'Votre commande {{ order_id }} est confirmée !');
  const [notifOrderBody, setNotifOrderBody] = useState(() => localStorage.getItem(getTenantStorageKey('notif_order_body')) || 'Bonjour {{ customer_name }}, merci pour votre achat de {{ total_price }}.');

  const [customMetafields, setCustomMetafields] = useState<{namespace: string, key: string, desc: string}[]>(() => {
    const raw = localStorage.getItem(getTenantStorageKey('custom_metafields'));
    return raw ? JSON.parse(raw) : [
      { namespace: 'custom', key: 'care_instructions', desc: 'Conseils d’entretien du tissu' },
      { namespace: 'product_details', key: 'warranty_period', desc: 'Durée de garantie du produit' }
    ];
  });
  const [newMetaKey, setNewMetaKey] = useState('');
  const [newMetaDesc, setNewMetaDesc] = useState('');

  const [primaryLang, setPrimaryLang] = useState(() => localStorage.getItem(getTenantStorageKey('primary_lang')) || 'fr');
  const [enableTranslations, setEnableTranslations] = useState(() => localStorage.getItem(getTenantStorageKey('enable_translations')) === 'true');

  const [privacyConsentBanner, setPrivacyConsentBanner] = useState(() => localStorage.getItem(getTenantStorageKey('privacy_consent_banner')) === 'true');
  const [privacyAnonymizeIp, setPrivacyAnonymizeIp] = useState(() => localStorage.getItem(getTenantStorageKey('privacy_anonymize_ip')) === 'true');

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
      } catch (e) {
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
        } catch (e) {
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
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'orange' | 'card'>('wave');
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
      const cleanName = searchQuery.toLowerCase().replace(/[^a-z0-9-]+/g, '');
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

  // Buy domain simulation
  const handleBuyDomain = () => {
    if (!selectedExtension) return;
    setIsPurchasing(true);

    setTimeout(() => {
      const cleanName = searchQuery.toLowerCase().replace(/[^a-z0-9-]+/g, '');
      const domainName = `${cleanName}${selectedExtension.ext}`;

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

  // Add External Domain
  const handleAddExternalDomain = () => {
    if (!externalDomainInput.trim()) return;
    const cleanDomain = externalDomainInput.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '');

    // check duplicates
    if (domains.some(d => d.domain === cleanDomain)) {
      alert('Ce domaine est déjà enregistré.');
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
  };

  const getDomainChallenge = (domain: string): string => {
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
      hash = (hash << 5) - hash + domain.charCodeAt(i);
      hash |= 0;
    }
    return `liafrik-challenge-${Math.abs(hash).toString(16)}`;
  };

  // Simulate DNS Verification
  const handleVerifyDns = (dom: CustomDomain) => {
    setIsVerifyingDns(true);

    setTimeout(() => {
      const updated = domains.map(d => {
        if (d.domain === dom.domain) {
          return { ...d, status: 'active' as const };
        }
        return d;
      });
      setDomains(updated);
      setSelectedExternalDomain(null);
      setIsVerifyingDns(false);
      alert(`✅ Félicitations ! Les DNS de ${dom.domain} ont été résolus et vérifiés sur le réseau Cloudflare edge ! Le challenge TXT (${getDomainChallenge(dom.domain)}) a été validé. Le domaine est maintenant actif.`);
    }, 2200);
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
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${active === s.id ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-50'}`}>
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 pr-8 bg-white"
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
                      <div className="p-2.5 text-xs text-gray-500 italic">Aucun pays trouvé</div>
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
                          className="w-full text-left px-3 py-2 hover:bg-orange-50 text-xs flex items-center gap-2"
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
              <Button size="sm">Sauvegarder</Button>
            </div>
          )}
          {active === 'plan' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-sm">Plan actuel</h3>
              <div className="p-4 bg-orange-50 rounded-xl flex items-center justify-between text-xs sm:text-sm">
                <div><p className="font-extrabold text-orange-800">Plan Premium</p><p className="text-gray-500">19$/mois · Custom Domains illimités</p></div>
                <Button size="sm">Changer de plan</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[{n:'Starter',p:'$9'},{n:'Premium',p:'$19',pop:true},{n:'Entreprise',p:'$69'}].map(p => (
                  <div key={p.n} className={`p-4 rounded-xl border-2 text-center ${p.pop ? 'border-orange-500 bg-orange-50/20' : 'border-gray-200 bg-white'}`}>
                    {p.pop && <Badge color="orange">Recommandé</Badge>}
                    <p className="font-bold mt-1 text-xs text-gray-900">{p.n}</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{p.p}</p>
                    <p className="text-[10px] text-gray-400">/mois</p>
                  </div>
                ))}
              </div>
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
                {['Flutterwave', 'Paystack', 'Orange Money', 'MTN MoMo', 'CinetPay', 'Stripe', 'PayPal'].map(g => {
                  const conn = gateways[g]?.connected;
                  return (
                    <div key={g} className="flex items-center justify-between p-4 border border-gray-150 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-sm">{g}</p>
                          <Badge color={conn ? 'green' : 'gray'}>
                            {conn ? 'Actif / Connecté' : 'Inactif'}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {conn
                            ? `Clé publique: ${gateways[g].publicKey.substring(0, 10)}... | Secret: **********`
                            : 'Configurez vos clés d’API privées pour recevoir directement vos fonds.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant={conn ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => openGatewayModal(g)}
                        >
                          {conn ? 'Configurer' : 'Connecter'}
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
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="text-orange-600 w-5 h-5" />
                        <h4 className="font-extrabold text-gray-900 text-sm">Passerelle {activeGatewayModal}</h4>
                      </div>
                      <button onClick={() => setActiveGatewayModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>

                    <form onSubmit={handleSaveGateway} className="p-6 space-y-4 text-left">
                      <p className="text-xs text-gray-500 leading-normal">
                        Entrez vos identifiants {activeGatewayModal} pour lier ce moyen de paiement à votre site marchand. Vos informations de clé API sont cryptées localement et isolées.
                      </p>

                      <div className="space-y-3">
                        {activeGatewayModal !== 'PayPal' && (
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Clé Publique (Public API Key)</label>
                            <input
                              type="text"
                              required
                              value={modalPublicKey}
                              onChange={e => setModalPublicKey(e.target.value)}
                              placeholder="pk_live_..."
                              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase">
                            {activeGatewayModal === 'PayPal' ? 'Client Secret' : 'Clé Secrète (Secret Key / Token)'}
                          </label>
                          <input
                            type="password"
                            required
                            value={modalSecretKey}
                            onChange={e => setModalSecretKey(e.target.value)}
                            placeholder={activeGatewayModal === 'PayPal' ? 'PayPal Secret Key' : 'sk_live_...'}
                            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                          />
                        </div>

                        {['PayPal', 'Stripe', 'CinetPay'].includes(activeGatewayModal) && (
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">
                              {activeGatewayModal === 'PayPal' ? 'PayPal Client ID' : 'Merchant ID / Service ID'}
                            </label>
                            <input
                              type="text"
                              required
                              value={modalClientId}
                              onChange={e => setModalClientId(e.target.value)}
                              placeholder="ID marchand officiel..."
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
                          className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700 shadow-md transition-colors"
                        >
                          Sauvegarder et Activer
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
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><Globe className="w-5 h-5 text-orange-600" /> Gestion des Domaines</h3>
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
                      <Badge color={d.status === 'active' ? 'green' : d.status === 'dns_pending' ? 'orange' : 'red'}>
                        {d.status === 'active' ? 'Actif' : d.status === 'dns_pending' ? 'En attente DNS' : 'Erreur DNS'}
                      </Badge>

                      {d.status === 'dns_pending' && (
                        <button
                          onClick={() => setSelectedExternalDomain(d)}
                          className="px-2.5 py-1 rounded bg-orange-100 text-orange-700 font-bold text-[10px] hover:bg-orange-200"
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
                <div className="border border-orange-200 bg-orange-50/30 rounded-2xl p-4 space-y-4 animate-slide-up">
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
                          <td className="p-2 font-black text-orange-700">A</td>
                          <td className="p-2">@</td>
                          <td className="p-2">104.21.43.201</td>
                          <td className="p-2">Auto</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-black text-orange-700">CNAME</td>
                          <td className="p-2">www</td>
                          <td className="p-2">os.liafrik.com</td>
                          <td className="p-2">Auto</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-black text-orange-700">TXT</td>
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
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-black hover:bg-orange-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
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
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <button
                    onClick={handleDomainSearch}
                    disabled={isSearching}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-black flex items-center gap-1.5 hover:bg-orange-700 disabled:opacity-50"
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
                          <div key={res.ext} className={`p-3 flex items-center justify-between transition-colors ${isSelected ? 'bg-orange-50/30' : ''}`}>
                            <div>
                              <span className="font-bold text-gray-900">{domainName}</span>
                              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5"><Check className="w-3 h-3" /> Disponible instantanément</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-gray-800">{res.price}</span>
                              <button
                                onClick={() => setSelectedExtension(res)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  isSelected ? 'bg-orange-600 text-white shadow-sm' : 'border border-gray-200 text-gray-700 hover:border-gray-300'
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
                        { id: 'orange', label: 'Orange Money', desc: 'Afrique de l\'Ouest' },
                        { id: 'card', label: 'Carte Bancaire', desc: 'Visa / Mastercard' },
                      ].map(method => (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id as any)}
                          className={`p-3 border rounded-xl text-left transition-all ${paymentMethod === method.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
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
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-black hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 animate-pulse"
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
                    <p className="text-[10px] text-gray-400">Le prix inclut les frais d'enregistrement wholesale de Cloudflare majorés de 20% pour frais de service Os.</p>
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
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={handleAddExternalDomain}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black hover:bg-slate-800 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Connecter
                  </button>
                </div>
              </div>
            </div>
          )}
          {active === 'shipping' && (
            <div className="space-y-4 text-xs sm:text-sm">
              <h3 className="font-bold text-gray-900 text-sm">Zones de livraison</h3>
              <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-white shadow-sm">
                <div><p className="font-bold text-gray-900 font-medium">Côte d'Ivoire</p><p className="text-[10px] text-gray-500">1 000 XOF · 2-3 jours</p></div>
                <Button variant="ghost" size="sm">Éditer</Button>
              </div>
              <Button variant="secondary" size="sm">Ajouter une zone</Button>
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
          {active === 'billing' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Facturation & Informations de Facturation</h3>
              <p className="text-gray-500">Gérez les détails légaux de votre entreprise pour la génération automatique de vos factures de service Os.</p>

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Raison Sociale</label>
                    <input
                      type="text"
                      value={billingCompany}
                      onChange={e => setBillingCompany(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Numéro TVA / NIF (Optionnel)</label>
                    <input
                      type="text"
                      value={billingVat}
                      onChange={e => setBillingVat(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email de Facturation (Destinataire des factures)</label>
                  <input
                    type="email"
                    value={billingEmail}
                    onChange={e => setBillingEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                  />
                </div>

                <div className="p-4 bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-xl text-white shadow-lg relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 rounded-full bg-white/10" />
                  <div className="text-xs uppercase font-black opacity-80 tracking-widest mb-4">Mode de Paiement Actif</div>
                  <div className="text-sm font-semibold tracking-wider font-mono mb-4">{billingCard}</div>
                  <div className="flex justify-between items-end text-[10px]">
                    <div>
                      <div className="opacity-70">Titulaire de la carte</div>
                      <div className="font-bold uppercase tracking-wider">{billingCompany || 'Os Merchant'}</div>
                    </div>
                    <div className="bg-white/20 px-2.5 py-1 rounded-lg font-bold">VISA</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(getTenantStorageKey('billing_company'), billingCompany);
                    localStorage.setItem(getTenantStorageKey('billing_vat'), billingVat);
                    localStorage.setItem(getTenantStorageKey('billing_email'), billingEmail);
                    alert('🎉 Vos informations de facturation ont été enregistrées avec succès !');
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-md"
                >
                  Sauvegarder les détails
                </button>
              </div>
            </div>
          )}

          {active === 'users' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Utilisateurs & Permissions de l'Équipe</h3>
              <p className="text-gray-500">Ajoutez des collaborateurs pour gérer votre catalogue de produits, traiter les commandes et configurer votre boutique.</p>

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-800 text-xs">Utilisateurs actifs</h4>
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                    {staffUsers.map((user, idx) => (
                      <div key={idx} className="p-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                        <div>
                          <div className="font-bold text-gray-900">{user.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{user.email}</div>
                        </div>
                        <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100">
                  <h4 className="font-bold text-gray-800 text-xs">Inviter un nouveau membre</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nom complet"
                      value={newStaffName}
                      onChange={e => setNewStaffName(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    />
                    <input
                      type="email"
                      placeholder="Adresse email"
                      value={newStaffEmail}
                      onChange={e => setNewStaffEmail(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <select
                      value={newStaffRole}
                      onChange={e => setNewStaffRole(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    >
                      <option value="Administrateur">Administrateur (Tout accès)</option>
                      <option value="Gestionnaire">Gestionnaire (Produits & Commandes)</option>
                      <option value="Staff">Staff (Lecture seule)</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newStaffName.trim() || !newStaffEmail.trim()) {
                          alert('Veuillez remplir le nom et l’email du nouveau collaborateur.');
                          return;
                        }
                        const updated = [...staffUsers, { name: newStaffName, email: newStaffEmail, role: newStaffRole }];
                        setStaffUsers(updated);
                        localStorage.setItem(getTenantStorageKey('staff_users'), JSON.stringify(updated));
                        setNewStaffName('');
                        setNewStaffEmail('');
                        alert(`🎉 Invitation envoyée avec succès à ${newStaffEmail} !`);
                      }}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {active === 'checkout' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Style & Règles du Checkout (Passage de commande)</h3>
              <p className="text-gray-500">Personnalisez le formulaire de commande que vos clients remplissent lors de l'achat.</p>

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Moyen de contact client</label>
                  <select
                    value={checkoutContactMethod}
                    onChange={e => setCheckoutContactMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white"
                  >
                    <option value="email">Uniquement par Email</option>
                    <option value="phone">Uniquement par Téléphone (Optimal Afrique / Mobile Money)</option>
                    <option value="both">Email ou Téléphone portable</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nom de famille requis ?</label>
                  <select
                    value={checkoutLastName}
                    onChange={e => setCheckoutLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white"
                  >
                    <option value="required">Requis (Prénom & Nom obligatoires)</option>
                    <option value="optional">Optionnel</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nom d'entreprise / Raison Sociale</label>
                  <select
                    value={checkoutCompanyField}
                    onChange={e => setCheckoutCompanyField(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white"
                  >
                    <option value="hidden">Masqué (Recommandé pour simplifier l'achat)</option>
                    <option value="optional">Optionnel</option>
                    <option value="required">Requis</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Numéro de Téléphone de livraison</label>
                  <select
                    value={checkoutPhoneField}
                    onChange={e => setCheckoutPhoneField(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white"
                  >
                    <option value="required">Requis (Indispensable pour la livraison Express)</option>
                    <option value="optional">Optionnel</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(getTenantStorageKey('checkout_contact_method'), checkoutContactMethod);
                    localStorage.setItem(getTenantStorageKey('checkout_last_name'), checkoutLastName);
                    localStorage.setItem(getTenantStorageKey('checkout_company_field'), checkoutCompanyField);
                    localStorage.setItem(getTenantStorageKey('checkout_phone_field'), checkoutPhoneField);
                    alert('🎉 Règles de formulaire de commande enregistrées avec succès !');
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-md"
                >
                  Sauvegarder les règles
                </button>
              </div>
            </div>
          )}

          {active === 'accounts' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Comptes Clients & Identification</h3>
              <p className="text-gray-500">Configurez la façon dont vos clients se connectent et accèdent à l'historique de leurs commandes.</p>

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Mode d'accès des comptes clients</label>
                  <select
                    value={accountsStatus}
                    onChange={e => setAccountsStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white"
                  >
                    <option value="disabled">Comptes désactivés (Commande en invité uniquement)</option>
                    <option value="optional">Optionnel (Les clients peuvent s'inscrire s'ils le désirent)</option>
                    <option value="required">Obligatoire (Inscription requise pour commander)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-800 text-xs">Double Authentification (2FA)</div>
                      <div className="text-[11px] text-gray-400">Exiger un code de vérification SMS/Email pour sécuriser le compte client.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={accountsTwoFactor}
                      onChange={e => setAccountsTwoFactor(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-800 text-xs">Connexion unique SSO (Google / Apple)</div>
                      <div className="text-[11px] text-gray-400">Permettre l'inscription rapide en 1 clic.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={accountsSso}
                      onChange={e => setAccountsSso(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(getTenantStorageKey('accounts_status'), accountsStatus);
                    localStorage.setItem(getTenantStorageKey('accounts_two_factor'), accountsTwoFactor ? 'true' : 'false');
                    localStorage.setItem(getTenantStorageKey('accounts_sso'), accountsSso ? 'true' : 'false');
                    alert('🎉 Paramètres des comptes clients mis à jour !');
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-md"
                >
                  Enregistrer l'accès
                </button>
              </div>
            </div>
          )}

          {active === 'taxes' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Taxes, TVA & Droits de douane</h3>
              <p className="text-gray-500">Configurez la perception de taxes sur vos produits et sur les frais d'expédition.</p>

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Taux de Taxe / TVA standard (%)</label>
                  <input
                    type="number"
                    value={taxRateGlobal}
                    onChange={e => setTaxRateGlobal(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-800 text-xs">Inclure les taxes dans le prix des produits</div>
                      <div className="text-[11px] text-gray-400">Le prix affiché sur la boutique intègre déjà la taxe.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={taxIncludePrices}
                      onChange={e => setTaxIncludePrices(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-800 text-xs">Facturer des taxes sur les frais d'expédition</div>
                      <div className="text-[11px] text-gray-400">Applique le taux de taxe standard sur les livraisons.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={taxIncludeShipping}
                      onChange={e => setTaxIncludeShipping(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(getTenantStorageKey('tax_rate_global'), taxRateGlobal.toString());
                    localStorage.setItem(getTenantStorageKey('tax_include_prices'), taxIncludePrices ? 'true' : 'false');
                    localStorage.setItem(getTenantStorageKey('tax_include_shipping'), taxIncludeShipping ? 'true' : 'false');
                    alert('🎉 Paramètres fiscaux enregistrés avec succès !');
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-md"
                >
                  Sauvegarder les taxes
                </button>
              </div>
            </div>
          )}

          {active === 'locations' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Emplacements Physiques & Entrepôts</h3>
              <p className="text-gray-500">Gérez les emplacements physiques de vos stocks pour suivre correctement les quantités par région.</p>

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-800 text-xs">Emplacements d'inventaire actifs</h4>
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                    {storeLocations.map((loc) => (
                      <div key={loc.id} className="p-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                        <div>
                          <div className="font-bold text-gray-900">{loc.name}</div>
                          <div className="text-[10px] text-gray-400 font-medium">{loc.address}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (storeLocations.length <= 1) {
                              alert('Vous devez conserver au moins un emplacement physique pour vos stocks.');
                              return;
                            }
                            const updated = storeLocations.filter(l => l.id !== loc.id);
                            setStoreLocations(updated);
                            localStorage.setItem(getTenantStorageKey('store_locations'), JSON.stringify(updated));
                          }}
                          className="text-[10px] text-red-600 hover:underline"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100">
                  <h4 className="font-bold text-gray-800 text-xs">Ajouter un dépôt ou point de vente</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nom de l'entrepôt"
                      value={newLocName}
                      onChange={e => setNewLocName(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Adresse physique"
                      value={newLocAddr}
                      onChange={e => setNewLocAddr(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newLocName.trim() || !newLocAddr.trim()) {
                        alert('Veuillez remplir le nom et l’adresse du nouvel emplacement.');
                        return;
                      }
                      const updated = [...storeLocations, { id: `loc-${Date.now()}`, name: newLocName, address: newLocAddr }];
                      setStoreLocations(updated);
                      localStorage.setItem(getTenantStorageKey('store_locations'), JSON.stringify(updated));
                      setNewLocName('');
                      setNewLocAddr('');
                      alert(`🎉 Nouvel entrepôt "${newLocName}" configuré avec succès !`);
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                  >
                    Ajouter l'emplacement
                  </button>
                </div>
              </div>
            </div>
          )}

          {active === 'apps' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Applications de la Boutique (Add-ons)</h3>
              <p className="text-gray-500">Ajoutez des fonctionnalités avancées à votre CMS en activant des plugins tiers en un seul clic.</p>

              <div className="space-y-3 border-t border-gray-100 pt-4">
                {installedApps.map((app) => (
                  <div key={app.id} className="p-3.5 border border-gray-100 bg-gray-50 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-0.5 flex-1">
                      <div className="font-bold text-gray-900 flex items-center gap-2">
                        {app.name}
                        {app.active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
                      </div>
                      <div className="text-[11px] text-gray-500 leading-normal">{app.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = installedApps.map(a => a.id === app.id ? { ...a, active: !a.active } : a);
                        setInstalledApps(updated);
                        localStorage.setItem(getTenantStorageKey('installed_apps'), JSON.stringify(updated));
                        alert(`🎉 Application ${app.name} ${!app.active ? 'activée' : 'désactivée'} avec succès !`);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black shadow-sm transition-all ${
                        app.active
                          ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {app.active ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'channels' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Canaux de Vente</h3>
              <p className="text-gray-500">Synchronisez votre inventaire et vendez directement sur vos réseaux sociaux favoris.</p>

              <div className="space-y-3 border-t border-gray-100 pt-4">
                {salesChannels.map((chan) => (
                  <div key={chan.id} className="p-3.5 border border-gray-100 bg-gray-50 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900">{chan.name}</div>
                      <div className="text-[10px] font-semibold text-gray-400 uppercase mt-0.5 flex items-center gap-1">
                        {chan.connected ? (
                          <span className="text-emerald-600 flex items-center gap-1">● Connecté</span>
                        ) : (
                          <span className="text-gray-400">● Non configuré</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = salesChannels.map(c => c.id === chan.id ? { ...c, connected: !c.connected } : c);
                        setSalesChannels(updated);
                        localStorage.setItem(getTenantStorageKey('sales_channels'), JSON.stringify(updated));
                        alert(`🎉 Canal "${chan.name}" ${!chan.connected ? 'connecté' : 'déconnecté'} avec succès !`);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        chan.connected
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {chan.connected ? 'Déconnecter' : 'Connecter'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'events' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Pixels & Suivi Publicitaire (Analytics)</h3>
              <p className="text-gray-500">Intégrez vos pixels publicitaires de suivi de conversions pour piloter vos campagnes marketing.</p>

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">ID de mesure Google Analytics 4 (G-XXXXX)</label>
                  <input
                    type="text"
                    value={pixelGa}
                    onChange={e => setPixelGa(e.target.value)}
                    placeholder="Ex: G-A1B2C3D4E5"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">ID Pixel Facebook / Meta</label>
                  <input
                    type="text"
                    value={pixelFb}
                    onChange={e => setPixelFb(e.target.value)}
                    placeholder="Ex: 123456789012345"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">ID Pixel TikTok</label>
                  <input
                    type="text"
                    value={pixelTiktok}
                    onChange={e => setPixelTiktok(e.target.value)}
                    placeholder="Ex: C1D2E3F4G5H6I7J8"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(getTenantStorageKey('pixel_ga'), pixelGa);
                    localStorage.setItem(getTenantStorageKey('pixel_fb'), pixelFb);
                    localStorage.setItem(getTenantStorageKey('pixel_tiktok'), pixelTiktok);
                    alert('🎉 Vos codes de pixels publicitaires sont désormais branchés sur votre boutique en ligne !');
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-md"
                >
                  Enregistrer les Pixels
                </button>
              </div>
            </div>
          )}

          {active === 'notifications' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Gabarits d'E-mails Transationnels</h3>
              <p className="text-gray-500">Personnalisez les e-mails automatiques de confirmation de commande envoyés aux acheteurs.</p>

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Objet du mail de confirmation</label>
                  <input
                    type="text"
                    value={notifOrderSubject}
                    onChange={e => setNotifOrderSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Contenu textuel du mail</label>
                  <textarea
                    rows={4}
                    value={notifOrderBody}
                    onChange={e => setNotifOrderBody(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(getTenantStorageKey('notif_order_subject'), notifOrderSubject);
                    localStorage.setItem(getTenantStorageKey('notif_order_body'), notifOrderBody);
                    alert('🎉 Gabarit d’e-mail enregistré !');
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-md"
                >
                  Sauvegarder le modèle
                </button>
              </div>
            </div>
          )}

          {active === 'metafields' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Champs Personnalisés (Metafields)</h3>
              <p className="text-gray-500">Créez des structures de données personnalisées pour enrichir vos pages produits.</p>

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-800 text-xs">Définitions enregistrées</h4>
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                    {customMetafields.map((mf, idx) => (
                      <div key={idx} className="p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="font-bold text-gray-900">{mf.desc}</div>
                          <code className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                            {mf.namespace}.{mf.key}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100">
                  <h4 className="font-bold text-gray-800 text-xs">Ajouter une nouvelle définition</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nom (ex: Conseil lavage)"
                      value={newMetaDesc}
                      onChange={e => setNewMetaDesc(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Clé technique (ex: care_instructions)"
                      value={newMetaKey}
                      onChange={e => setNewMetaKey(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-mono bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newMetaDesc.trim() || !newMetaKey.trim()) {
                        alert('Veuillez remplir les deux champs.');
                        return;
                      }
                      const cleanKey = newMetaKey.trim().toLowerCase().replace(/\s+/g, '_');
                      const updated = [...customMetafields, { namespace: 'custom', key: cleanKey, desc: newMetaDesc }];
                      setCustomMetafields(updated);
                      localStorage.setItem(getTenantStorageKey('custom_metafields'), JSON.stringify(updated));
                      setNewMetaKey('');
                      setNewMetaDesc('');
                      alert(`🎉 Metafield "${newMetaDesc}" défini avec succès !`);
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                  >
                    Ajouter le Metafield
                  </button>
                </div>
              </div>
            </div>
          )}

          {active === 'languages' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Langues de la Boutique</h3>
              <p className="text-gray-500">Ajoutez des langues pour traduire automatiquement votre site et attirer des clients internationaux.</p>

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Langue de base de la boutique</label>
                  <select
                    value={primaryLang}
                    onChange={e => setPrimaryLang(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white font-medium text-gray-800"
                  >
                    <option value="fr">🇫🇷 Français (Langue par défaut)</option>
                    <option value="en">🇺🇸 Anglais (English)</option>
                    <option value="ar">🇦🇪 Arabe (العربية)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <div className="font-bold text-gray-800 text-xs">Activer les traductions automatiques par IA</div>
                    <div className="text-[11px] text-gray-400">Traduit automatiquement vos produits selon la langue du visiteur.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableTranslations}
                    onChange={e => setEnableTranslations(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(getTenantStorageKey('primary_lang'), primaryLang);
                    localStorage.setItem(getTenantStorageKey('enable_translations'), enableTranslations ? 'true' : 'false');
                    alert('🎉 Configuration des langues de la boutique mise à jour !');
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-md"
                >
                  Sauvegarder les langues
                </button>
              </div>
            </div>
          )}

          {active === 'privacy' && (
            <div className="space-y-5 text-xs sm:text-sm text-left">
              <h3 className="font-bold text-gray-900 text-sm">Confidentialité & RGPD des Clients</h3>
              <p className="text-gray-500">Configurez les bannières d'acceptation de cookies et la conformité légale de gestion des données personnelles.</p>

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-800 text-xs">Bannière de Consentement de Cookies</div>
                      <div className="text-[11px] text-gray-400">Affiche une bannière réglementaire en bas du site pour l'accord des visiteurs.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacyConsentBanner}
                      onChange={e => setPrivacyConsentBanner(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-800 text-xs">Anonymisation stricte des adresses IP</div>
                      <div className="text-[11px] text-gray-400">Anonymise automatiquement les adresses IP pour protéger l'identité des visiteurs.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacyAnonymizeIp}
                      onChange={e => setPrivacyAnonymizeIp(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(getTenantStorageKey('privacy_consent_banner'), privacyConsentBanner ? 'true' : 'false');
                    localStorage.setItem(getTenantStorageKey('privacy_anonymize_ip'), privacyAnonymizeIp ? 'true' : 'false');
                    alert('🎉 Préférences de confidentialité enregistrées avec succès !');
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-md"
                >
                  Sauvegarder les préférences
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
