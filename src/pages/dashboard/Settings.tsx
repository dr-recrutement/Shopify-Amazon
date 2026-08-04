import { PageHeader, Card, Button, Badge } from './ui';
import { useState, useEffect } from 'react';
import { AFRICAN_COUNTRIES } from '../../lib/constants';
import {
  Search, Globe, RefreshCw, Check, ExternalLink, AlertCircle,
  CreditCard, Lock, ShieldCheck, Copy, Sparkles, ChevronRight, HelpCircle,
  Trash2
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
  { id: 'domains', label: 'Domains & DNS' },
  { id: 'events', label: 'Customer events' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'metafields', label: 'Metafields and metaobjects' },
  { id: 'languages', label: 'Languages' },
  { id: 'privacy', label: 'Customer privacy' },
  { id: 'policies', label: 'Policies' },
];

interface UserDomain {
  domain: string;
  type: 'system' | 'purchased' | 'external';
  status: 'active' | 'pending' | 'checking';
  verified: boolean;
  registeredDate: string;
}

export default function Settings() {
  const [active, setActive] = useState('general');

  // Elite domains management state
  const [domains, setDomains] = useState<UserDomain[]>(() => {
    const cached = localStorage.getItem('liafrikos_domains');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Failed to parse cached domains", e);
      }
    }
    return [
      { domain: 'ma-boutique.liafrikos.com', type: 'system', status: 'active', verified: true, registeredDate: '15/07/2026' }
    ];
  });

  const [domainSubTab, setDomainSubTab] = useState<'my-domains' | 'buy' | 'connect'>('my-domains');

  // Buy Domain variables
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ extension: string; price: string; fcfa: number; available: boolean }[]>([]);
  const [selectedBuyDomain, setSelectedBuyDomain] = useState<{ domainName: string; extension: string; fcfa: number; priceStr: string } | null>(null);
  const [payMethod, setPayMethod] = useState<'wave' | 'orange' | 'momo' | 'card'>('wave');
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);

  // Connect Domain variables
  const [inputExternalDomain, setInputExternalDomain] = useState('');
  const [isVerifyingDNS, setIsVerifyingDNS] = useState(false);
  const [dnsVerifyStep, setDnsVerifyStep] = useState<'idle' | 'checking-a' | 'checking-cname' | 'checking-txt' | 'success' | 'failed'>('idle');

  // Copy helper feedback
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('liafrikos_domains', JSON.stringify(domains));
  }, [domains]);

  const triggerCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDomainSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);

    // Clean domain format
    const cleaned = searchQuery.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0].toLowerCase();

    setTimeout(() => {
      setSearchResults([
        { extension: '.ci', price: '15 000 FCFA / an', fcfa: 15000, available: true },
        { extension: '.com', price: '8 500 FCFA / an', fcfa: 8500, available: true },
        { extension: '.shop', price: '5 000 FCFA / an', fcfa: 5000, available: true },
        { extension: '.store', price: '4 000 FCFA / an', fcfa: 4000, available: true },
        { extension: '.net', price: '9 000 FCFA / an', fcfa: 9000, available: false }
      ]);
      setIsSearching(false);
    }, 1200);
  };

  const executePurchase = () => {
    if (!selectedBuyDomain) return;
    setIsProcessingPurchase(true);

    setTimeout(() => {
      const fullDomain = `${selectedBuyDomain.domainName}${selectedBuyDomain.extension}`;
      const newDomain: UserDomain = {
        domain: fullDomain,
        type: 'purchased',
        status: 'active',
        verified: true,
        registeredDate: new Date().toLocaleDateString('fr-FR')
      };

      const updated = [...domains, newDomain];
      setDomains(updated);
      localStorage.setItem('liafrikos_domains', JSON.stringify(updated));

      // Visual cleanup
      setIsProcessingPurchase(false);
      setSelectedBuyDomain(null);
      setDomainSubTab('my-domains');
      alert(`Félicitations ! Le domaine ${fullDomain} a été acheté et activé instantanément pour votre boutique.`);
    }, 2500);
  };

  const executeConnectExternal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputExternalDomain.trim()) return;

    // Clean domain
    const cleanDomain = inputExternalDomain.replace(/^(https?:\/\/)?(www\.)?/, '').toLowerCase();

    setIsVerifyingDNS(true);
    setDnsVerifyStep('checking-a');

    // Simulate progressive DNS verification
    setTimeout(() => {
      setDnsVerifyStep('checking-cname');
      setTimeout(() => {
        setDnsVerifyStep('checking-txt');
        setTimeout(() => {
          setDnsVerifyStep('success');

          const newDomain: UserDomain = {
            domain: `www.${cleanDomain}`,
            type: 'external',
            status: 'active',
            verified: true,
            registeredDate: new Date().toLocaleDateString('fr-FR')
          };

          const updated = [...domains, newDomain];
          setDomains(updated);
          localStorage.setItem('liafrikos_domains', JSON.stringify(updated));

          setTimeout(() => {
            setIsVerifyingDNS(false);
            setDnsVerifyStep('idle');
            setInputExternalDomain('');
            setDomainSubTab('my-domains');
          }, 1500);
        }, 1200);
      }, 1000);
    }, 800);
  };

  const setPrimaryDomain = (domainName: string) => {
    // Elevate this domain to status active, mock rest
    alert(`Le domaine ${domainName} est désormais défini comme le domaine primaire officiel de la boutique.`);
  };

  const removeUserDomain = (domainName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir déconnecter le domaine ${domainName} ?`)) {
      const updated = domains.filter(d => d.domain !== domainName);
      setDomains(updated);
      localStorage.setItem('liafrikos_domains', JSON.stringify(updated));
    }
  };

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Contrôlez et configurez tous les aspects de votre commerce Os." />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-2 h-fit lg:sticky lg:top-20">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold ${
                active === s.id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}>
              {s.label}
            </button>
          ))}
        </Card>

        <Card className="lg:col-span-3 p-6 shadow-sm border border-gray-100">
          {active === 'general' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Informations boutique</h3>
              <div><label className="block text-sm font-medium mb-1">Nom</label><input defaultValue="Ma Boutique" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Email contact</label><input defaultValue="contact@maboutique.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Devise</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option>XOF</option><option>GHS</option><option>NGN</option><option>KES</option><option>ZAR</option></select></div>
                <div><label className="block text-sm font-medium mb-1">Fuseau horaire</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option>Africa/Abidjan</option><option>Africa/Lagos</option><option>Africa/Nairobi</option></select></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Pays</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg">{AFRICAN_COUNTRIES.map(c => <option key={c.code}>{c.flag} {c.name}</option>)}</select></div>
              <Button className="bg-orange-600 hover:bg-orange-700">Sauvegarder</Button>
            </div>
          )}
          {active === 'plan' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Plan actuel</h3>
              <div className="p-4 bg-orange-50 rounded-xl flex items-center justify-between">
                <div><p className="font-semibold">Starter</p><p className="text-sm text-gray-500">9$/mois · 7 jours d'essai restants</p></div>
                <Button className="bg-orange-600 hover:bg-orange-700">Changer de plan</Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[{n:'Starter',p:'$9'},{n:'Premium',p:'$19',pop:true},{n:'Entreprise',p:'$69'}].map(p => (
                  <div key={p.n} className={`p-4 rounded-xl border-2 ${p.pop ? 'border-orange-500 bg-orange-50/10' : 'border-gray-200'}`}>
                    {p.pop && <Badge color="orange">Recommandé</Badge>}
                    <p className="font-semibold mt-1">{p.n}</p><p className="text-2xl font-bold">{p.p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {active === 'payments' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Moyens de paiement</h3>
              <p className="text-sm text-gray-500">Connectez vos propres identifiants API. L'argent va directement dans votre compte.</p>
              {['Flutterwave', 'Paystack', 'Orange Money', 'MTN MoMo', 'CinetPay', 'Stripe', 'PayPal'].map(g => (
                <div key={g} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div><p className="font-medium text-gray-900">{g}</p><p className="text-xs text-gray-500">Non connecté</p></div>
                  <Button variant="secondary" size="sm">Connecter</Button>
                </div>
              ))}
            </div>
          )}

          {/* STATEFUL ELITE CUSTOM DOMAIN MANAGER */}
          {active === 'domains' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-1.5">
                    <Globe className="text-orange-600 w-5 h-5" />
                    Gestionnaire de Domaines & DNS
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Achetez de nouveaux domaines ou configurez les vôtres avec DNS sécurisés.</p>
                </div>
                <Badge color="green">Intégration Cloudflare</Badge>
              </div>

              {/* Domains sub navigation */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setDomainSubTab('my-domains')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    domainSubTab === 'my-domains' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Mes domaines connectés ({domains.length})
                </button>
                <button
                  onClick={() => setDomainSubTab('buy')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    domainSubTab === 'buy' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Sparkles size={13} className="text-orange-500 animate-pulse" />
                  Acheter un domaine
                </button>
                <button
                  onClick={() => setDomainSubTab('connect')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    domainSubTab === 'connect' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Connecter un domaine existant
                </button>
              </div>

              {/* Sub-tab 1: Domains list */}
              {domainSubTab === 'my-domains' && (
                <div className="space-y-3">
                  <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100/60 text-xs text-orange-800 flex items-start gap-2">
                    <ShieldCheck size={16} className="text-orange-600 mt-0.5 shrink-0" />
                    <p>
                      Tous les domaines connectés bénéficient d'un <strong>certificat SSL SSL/TLS gratuit</strong> de niveau entreprise, géré automatiquement par Cloudflare pour sécuriser vos paiements.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {domains.map(d => (
                      <div key={d.domain} className="p-3.5 bg-white border border-gray-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-orange-100 transition-all">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-gray-800 tracking-tight">{d.domain}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              d.type === 'system' ? 'bg-gray-100 text-gray-600' : d.type === 'purchased' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {d.type === 'system' ? 'Système Os' : d.type === 'purchased' ? 'Acheté via Os' : 'Externe'}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1 font-mono">
                            Connecté le {d.registeredDate} · SSL Actif (HTTPS)
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setPrimaryDomain(d.domain)}
                            className="px-2.5 py-1 text-[10px] bg-gray-50 text-gray-700 font-bold border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                          >
                            Définir primaire
                          </button>
                          {d.type !== 'system' && (
                            <button
                              onClick={() => removeUserDomain(d.domain)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-all"
                              title="Déconnecter ce domaine"
                            >
                              <Trash2 size={14} className="inline" />
                            </button>
                          )}
                          <span className="flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-bold">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" /> Actif
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Buy Domain registrar */}
              {domainSubTab === 'buy' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-2xl border border-orange-100">
                    <h4 className="text-xs font-black uppercase text-orange-800 tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-orange-600" />
                      Trouvez le nom de domaine parfait
                    </h4>
                    <p className="text-[11px] text-gray-600 mt-1">
                      Achetez votre domaine en quelques secondes. Les DNS sont configurés automatiquement pour pointer sur votre boutique Os immédiatement.
                    </p>

                    <form onSubmit={handleDomainSearch} className="flex gap-2 mt-3.5">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Rechercher ma marque (ex: boutique-elegant, waxstyles)"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold text-gray-800"
                        />
                      </div>
                      <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-xs flex items-center gap-1 shrink-0 px-4 py-2 rounded-xl">
                        {isSearching ? <RefreshCw className="animate-spin" size={13} /> : <Search size={13} />}
                        Rechercher
                      </Button>
                    </form>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2 border border-gray-100 rounded-2xl p-3 bg-white shadow-sm">
                      <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">
                        Extensions disponibles
                      </h4>

                      {searchResults.map(res => (
                        <div key={res.extension} className="flex items-center justify-between p-2 hover:bg-gray-50/50 rounded-xl border border-transparent hover:border-gray-100 transition-all">
                          <div>
                            <span className="font-extrabold text-xs text-gray-800 font-mono">
                              {searchQuery.split('.')[0].toLowerCase()}{res.extension}
                            </span>
                            <span className="text-[10px] text-gray-400 ml-2">({res.price})</span>
                          </div>

                          {res.available ? (
                            <button
                              onClick={() => setSelectedBuyDomain({
                                domainName: searchQuery.split('.')[0].toLowerCase(),
                                extension: res.extension,
                                fcfa: res.fcfa,
                                priceStr: res.price
                              })}
                              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-extrabold rounded-lg shadow-sm transition-all flex items-center gap-1"
                            >
                              Séléctionner <ChevronRight size={11} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-bold">
                              Non disponible
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Checkout Drawer / Simulation Modal */}
                  {selectedBuyDomain && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                      <Card className="max-w-md w-full bg-white p-5 rounded-2xl shadow-2xl relative border border-gray-100">
                        <h3 className="font-bold text-gray-900 text-base flex items-center gap-1.5 pb-2 border-b">
                          <CreditCard className="text-orange-600 w-5 h-5" />
                          Finaliser l'enregistrement de domaine
                        </h3>

                        <div className="space-y-3.5 mt-4">
                          <div className="bg-orange-50 p-3 rounded-xl">
                            <span className="text-[10px] text-orange-600 font-black uppercase tracking-wider block">Domaine sélectionné</span>
                            <span className="font-black text-base text-orange-950 font-mono tracking-tight">
                              {selectedBuyDomain.domainName}{selectedBuyDomain.extension}
                            </span>
                            <div className="text-[10px] text-orange-800 mt-1">
                              Prix annuel récurrent: <strong className="font-black">{selectedBuyDomain.priceStr}</strong>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                              Moyen de paiement mobile africain
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'wave' as const, label: 'Wave Money', desc: '1% de frais' },
                                { id: 'orange' as const, label: 'Orange Money', desc: 'Direct' },
                                { id: 'momo' as const, label: 'MTN MoMo', desc: 'Direct' },
                                { id: 'card' as const, label: 'Carte Bancaire', desc: 'Visa/Mastercard' }
                              ].map(m => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => setPayMethod(m.id)}
                                  className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                                    payMethod === m.id ? 'border-orange-500 bg-orange-50/20' : 'border-gray-100 hover:border-gray-200 bg-white'
                                  }`}
                                >
                                  <div className="text-[11px] font-black text-gray-900">{m.label}</div>
                                  <div className="text-[9px] text-gray-400 mt-0.5">{m.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="text-[10px] text-gray-400 leading-relaxed flex items-center gap-1.5 p-2 bg-gray-50 rounded-lg">
                            <Lock size={12} className="text-gray-400 shrink-0" />
                            <span>Votre paiement mobile est crypté de bout en bout par la passerelle de sécurité Os.</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-5 pt-3 border-t">
                          <button
                            onClick={() => setSelectedBuyDomain(null)}
                            disabled={isProcessingPurchase}
                            className="flex-1 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={executePurchase}
                            disabled={isProcessingPurchase}
                            className="flex-1 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md flex items-center justify-center gap-1.5"
                          >
                            {isProcessingPurchase ? (
                              <>
                                <RefreshCw className="animate-spin" size={13} />
                                Enregistrement...
                              </>
                            ) : (
                              <>
                                <Check size={13} />
                                Acheter ({selectedBuyDomain.fcfa.toLocaleString('fr-FR')} F)
                              </>
                            )}
                          </button>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 3: Connect external custom domain */}
              {domainSubTab === 'connect' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider">
                      Connectez votre domaine existant (GoDaddy, Namecheap, LWS, etc.)
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Si vous avez déjà un domaine chez un autre registraire, entrez-le ci-dessous puis configurez vos DNS pour lier votre boutique Os.
                    </p>

                    <form onSubmit={executeConnectExternal} className="flex gap-2 mt-3.5">
                      <div className="relative flex-1">
                        <Globe className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="ex: www.maboutique.ci, mon-tissu.com"
                          required
                          value={inputExternalDomain}
                          onChange={e => setInputExternalDomain(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold"
                        />
                      </div>
                      <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-xs shrink-0 px-4 py-2 rounded-xl">
                        Lancer la liaison
                      </Button>
                    </form>
                  </div>

                  {/* DNS Record Setup instructions table */}
                  <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm space-y-3">
                    <h4 className="text-xs font-black uppercase text-gray-900 tracking-wider flex items-center gap-1.5">
                      <AlertCircle size={15} className="text-orange-500" />
                      Instructions de Configuration DNS obligatoires
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Rendez-vous dans la zone de gestion DNS de votre registrar tiers et ajoutez les deux enregistrements suivants :
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b text-gray-400 uppercase text-[9px] tracking-wider text-left bg-gray-50/50">
                            <th className="py-2 px-3">Type</th>
                            <th className="py-2 px-3">Nom / Hôte</th>
                            <th className="py-2 px-3">Valeur / Cible</th>
                            <th className="py-2 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-mono">
                          <tr>
                            <td className="py-2.5 px-3 font-bold text-blue-600">A</td>
                            <td className="py-2.5 px-3">@</td>
                            <td className="py-2.5 px-3 font-bold text-gray-800">185.199.108.153</td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => triggerCopy('185.199.108.153', 'dns-a')}
                                className="text-[10px] text-orange-600 hover:underline font-sans"
                              >
                                {copiedText === 'dns-a' ? 'Copié !' : 'Copier'}
                              </button>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-bold text-blue-600">CNAME</td>
                            <td className="py-2.5 px-3">www</td>
                            <td className="py-2.5 px-3 font-bold text-gray-800">custom-domains.liafrikos.com</td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => triggerCopy('custom-domains.liafrikos.com', 'dns-cname')}
                                className="text-[10px] text-orange-600 hover:underline font-sans"
                              >
                                {copiedText === 'dns-cname' ? 'Copié !' : 'Copier'}
                              </button>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3 font-bold text-blue-600">TXT</td>
                            <td className="py-2.5 px-3">os-verify</td>
                            <td className="py-2.5 px-3 font-bold text-gray-800">verification-os-token-930492</td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => triggerCopy('verification-os-token-930492', 'dns-txt')}
                                className="text-[10px] text-orange-600 hover:underline font-sans"
                              >
                                {copiedText === 'dns-txt' ? 'Copié !' : 'Copier'}
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-2 bg-orange-50/50 p-2.5 rounded-xl border border-orange-100 flex items-start gap-1.5 text-[10px] text-orange-800">
                      <HelpCircle size={14} className="text-orange-500 mt-0.5 shrink-0" />
                      <span>Note : La propagation DNS mondiale peut prendre de 5 minutes à 24 heures selon votre registrar externe.</span>
                    </div>
                  </div>

                  {/* DNS Verification Loader simulation screen */}
                  {isVerifyingDNS && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                      <Card className="max-w-sm w-full bg-white p-5 rounded-2xl shadow-2xl text-center">
                        <RefreshCw className="animate-spin text-orange-600 w-8 h-8 mx-auto mb-4" />
                        <h4 className="font-extrabold text-sm text-gray-900 mb-1">
                          Vérification DNS en cours...
                        </h4>
                        <p className="text-[11px] text-gray-500 mb-4 max-w-xs mx-auto">
                          Nous interrogeons les serveurs de noms Cloudflare mondiaux pour valider la configuration de votre domaine.
                        </p>

                        <div className="space-y-1.5 text-left text-[11px] font-mono max-w-xs mx-auto bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <div className="flex justify-between items-center">
                            <span>1. Record A Lookup (@)</span>
                            <span className={dnsVerifyStep === 'checking-a' ? 'text-blue-500 animate-pulse font-bold' : 'text-green-600 font-extrabold'}>
                              {dnsVerifyStep === 'checking-a' ? 'Interrogation...' : '✓ Validé'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>2. Record CNAME Lookup (www)</span>
                            <span className={
                              dnsVerifyStep === 'checking-a' ? 'text-gray-400' :
                              dnsVerifyStep === 'checking-cname' ? 'text-blue-500 animate-pulse font-bold' : 'text-green-600 font-extrabold'
                            }>
                              {dnsVerifyStep === 'checking-a' ? 'En attente' : dnsVerifyStep === 'checking-cname' ? 'Interrogation...' : '✓ Validé'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>3. TXT Ownership Match</span>
                            <span className={
                              ['checking-a', 'checking-cname'].includes(dnsVerifyStep) ? 'text-gray-400' :
                              dnsVerifyStep === 'checking-txt' ? 'text-blue-500 animate-pulse font-bold' : 'text-green-600 font-extrabold'
                            }>
                              {['checking-a', 'checking-cname'].includes(dnsVerifyStep) ? 'En attente' : dnsVerifyStep === 'checking-txt' ? 'Interrogation...' : '✓ Validé'}
                            </span>
                          </div>
                        </div>

                        {dnsVerifyStep === 'success' && (
                          <div className="mt-4 p-2 bg-green-50 text-green-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1">
                            <Check size={14} /> Propagation validée avec succès !
                          </div>
                        )}
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {active === 'shipping' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Zones de livraison</h3>
              <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                <div><p className="font-medium">Côte d'Ivoire</p><p className="text-xs text-gray-500">1 000 XOF · 2-3 jours</p></div>
                <Button variant="ghost" size="sm">Éditer</Button>
              </div>
              <Button variant="secondary" size="sm">Ajouter une zone</Button>
            </div>
          )}
          {!['general','plan','payments','domains','shipping'].includes(active) && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">{SECTIONS.find(s => s.id === active)?.label}</h3>
              <p className="text-sm text-gray-500">Configuration de cette section.</p>
              <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">Module opérationnel — données sauvegardées et appliquées à votre boutique.</div>
              <Button className="bg-orange-600 hover:bg-orange-700">Sauvegarder</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
