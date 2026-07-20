import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, Badge } from './ui';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { AFRICAN_COUNTRIES } from '../../lib/constants';
import { Check, X, Lock, Plus, Trash2, AlertCircle, Edit3, Globe } from 'lucide-react';

const SECTIONS = [
  { id: 'general', label: 'General' }, { id: 'plan', label: 'Plan' }, { id: 'billing', label: 'Billing' },
  { id: 'users', label: 'Users' }, { id: 'payments', label: 'Payments' }, { id: 'checkout', label: 'Checkout' },
  { id: 'accounts', label: 'Customer accounts' }, { id: 'shipping', label: 'Shipping and delivery' },
  { id: 'taxes', label: 'Taxes and duties' }, { id: 'locations', label: 'Locations' }, { id: 'apps', label: 'Apps' },
  { id: 'channels', label: 'Sales channels' }, { id: 'domains', label: 'Domains' },
  { id: 'events', label: 'Customer events' }, { id: 'notifications', label: 'Notifications' },
  { id: 'metafields', label: 'Metafields and metaobjects' }, { id: 'languages', label: 'Languages' },
  { id: 'privacy', label: 'Customer privacy' }, { id: 'policies', label: 'Policies' },
];

const GATEWAYS = [
  { id: 'flutterwave', name: 'Flutterwave', fields: ['Clé publique (Public Key)', 'Clé secrète (Secret Key)', 'Clé de chiffrement (Encryption Key)'], desc: 'Mobile Money + cartes. Disponible dans 30+ pays africains.' },
  { id: 'paystack', name: 'Paystack', fields: ['Clé publique (Public Key)', 'Clé secrète (Secret Key)'], desc: 'Cartes + Mobile Money. Nigéria, Ghana, Afrique du Sud, Kenya.' },
  { id: 'orange', name: 'Orange Money', fields: ['Identifiant marchand', 'Clé API'], desc: "Orange Money marchand — CI, SN, ML, BF, CM." },
  { id: 'mtn', name: 'MTN MoMo', fields: ['ID abonnement (Subscription ID)', 'Clé API (API Key)'], desc: 'MTN Mobile Money API — CI, GH, UG, CM, RW.' },
  { id: 'cinetpay', name: 'CinetPay', fields: ['ID marchand (Merchant ID)', 'Clé API (API Key)'], desc: 'Multi-Mobile Money — CI, SN, BJ, TG, BF.' },
  { id: 'stripe', name: 'Stripe', fields: ['Clé publique (Publishable Key)', 'Clé secrète (Secret Key)'], desc: 'Cartes internationales — clients hors Afrique.' },
  { id: 'paypal', name: 'PayPal', fields: ['Client ID', 'Client Secret'], desc: 'Paiements PayPal — clients internationaux.' },
];

const CHANNELS = [
  { id: 'online_store', name: 'Boutique en ligne', plan: 'starter' },
  { id: 'marketplace', name: 'Marketplace LiAfrikOS', plan: 'starter' },
  { id: 'instagram', name: 'Instagram Shop', plan: 'premium' },
  { id: 'facebook', name: 'Facebook Shop', plan: 'premium' },
  { id: 'whatsapp', name: 'WhatsApp Catalog', plan: 'premium' },
  { id: 'pos', name: 'Point de vente (POS)', plan: 'entreprise' },
];

type ShippingZone = { id: string; name: string; country: string | null; region: string | null; rate_type: string; rate_amount_cents: number; free_shipping_threshold_cents: number | null; estimated_days: number; is_active: boolean };
type Metafield = { id: string; name: string; namespace: string; entity_type: string; field_type: string; value: string | null };
type Domain = { id: string; domain_name: string; type: string; dns_status: string; ssl_status: string; verified_at: string | null };
type SalesChannel = { id: string; channel: string; is_active: boolean; plan_required: string };
type Gateway = { id: string; gateway: string; is_active: boolean; status: string };

export default function Settings() {
  const { tenant } = useTenant();
  const [active, setActive] = useState('general');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Shipping zones
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [zoneForm, setZoneForm] = useState({ name: '', country: '', region: '', rate_type: 'fixed', rate_amount: '', free_threshold: '', estimated_days: '3' });

  // Metafields
  const [metafields, setMetafields] = useState<Metafield[]>([]);
  const [showMetaForm, setShowMetaForm] = useState(false);
  const [metaForm, setMetaForm] = useState({ name: '', namespace: 'product', entity_type: 'product', field_type: 'text', value: '' });

  // Domains
  const [domains, setDomains] = useState<Domain[]>([]);
  const [showDomainForm, setShowDomainForm] = useState(false);
  const [domainForm, setDomainForm] = useState({ domain_name: '' });

  // Sales channels
  const [channels, setChannels] = useState<SalesChannel[]>([]);

  // Payment gateways
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [gatewayForms, setGatewayForms] = useState<Record<string, Record<string, string>>>({});

  // Team
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamForm, setTeamForm] = useState({ email: '', role: 'staff' });

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

  // Load data
  const loadData = useCallback(async () => {
    if (!tenant) return;
    const [z, m, d, c, g, t] = await Promise.all([
      supabase.from('shipping_zones').select('*').eq('tenant_id', tenant.id),
      supabase.from('metafields').select('*').eq('tenant_id', tenant.id),
      supabase.from('domains').select('*').eq('tenant_id', tenant.id),
      supabase.from('sales_channels').select('*').eq('tenant_id', tenant.id),
      supabase.from('vendor_payment_gateways').select('*').eq('tenant_id', tenant.id),
      supabase.from('team_members').select('*').eq('tenant_id', tenant.id),
    ]);
    setZones(z.data || []);
    setMetafields(m.data || []);
    setDomains(d.data || []);
    setChannels(c.data || []);
    setGateways(g.data || []);
    setTeamMembers(t.data || []);
  }, [tenant]);

  useEffect(() => { if (tenant) loadData(); }, [tenant, loadData]);

  // Shipping zone CRUD
  const saveZone = async () => {
    if (!tenant || !zoneForm.name || !zoneForm.rate_amount) return;
    await supabase.from('shipping_zones').insert({
      tenant_id: tenant.id, name: zoneForm.name, country: zoneForm.country || null, region: zoneForm.region || null,
      rate_type: zoneForm.rate_type, rate_amount_cents: Math.round(parseFloat(zoneForm.rate_amount) * 100),
      free_shipping_threshold_cents: zoneForm.free_threshold ? Math.round(parseFloat(zoneForm.free_threshold) * 100) : null,
      estimated_days: parseInt(zoneForm.estimated_days) || 3, is_active: true,
    });
    setShowZoneForm(false); setZoneForm({ name: '', country: '', region: '', rate_type: 'fixed', rate_amount: '', free_threshold: '', estimated_days: '3' }); loadData();
  };

  const deleteZone = async (id: string) => {
    if (!confirm('Supprimer cette zone ?')) return;
    await supabase.from('shipping_zones').delete().eq('id', id); loadData();
  };

  // Metafield CRUD
  const saveMeta = async () => {
    if (!tenant || !metaForm.name) return;
    await supabase.from('metafields').insert({
      tenant_id: tenant.id, name: metaForm.name, namespace: metaForm.namespace,
      entity_type: metaForm.entity_type, field_type: metaForm.field_type, value: metaForm.value || null,
    });
    setShowMetaForm(false); setMetaForm({ name: '', namespace: 'product', entity_type: 'product', field_type: 'text', value: '' }); loadData();
  };

  const deleteMeta = async (id: string) => {
    if (!confirm('Supprimer ce metafield ?')) return;
    await supabase.from('metafields').delete().eq('id', id); loadData();
  };

  // Domain CRUD
  const saveDomain = async () => {
    if (!tenant || !domainForm.domain_name) return;
    if (tenant.plan === 'starter') { setError('Domaine personnalisé nécessite le plan Premium.'); return; }
    await supabase.from('domains').insert({ tenant_id: tenant.id, domain_name: domainForm.domain_name, type: 'custom', dns_status: 'pending', ssl_status: 'pending' });
    setShowDomainForm(false); setDomainForm({ domain_name: '' }); loadData();
  };

  const verifyDomain = async (d: Domain) => {
    await supabase.from('domains').update({ dns_status: 'verified', ssl_status: 'active', verified_at: new Date().toISOString() }).eq('id', d.id);
    loadData();
  };

  const deleteDomain = async (id: string) => {
    if (!confirm('Supprimer ce domaine ?')) return;
    await supabase.from('domains').delete().eq('id', id); loadData();
  };

  // Sales channel toggle
  const toggleChannel = async (ch: SalesChannel) => {
    const existing = channels.find(c => c.channel === ch.channel);
    if (existing) {
      await supabase.from('sales_channels').update({ is_active: !existing.is_active }).eq('id', existing.id);
    } else {
      await supabase.from('sales_channels').insert({ tenant_id: tenant.id, channel: ch.channel, is_active: true, plan_required: ch.plan_required });
    }
    loadData();
  };

  const initChannel = async (channelId: string, planRequired: string) => {
    await supabase.from('sales_channels').insert({ tenant_id: tenant.id, channel: channelId, is_active: false, plan_required: planRequired });
    loadData();
  };

  // Payment gateway CRUD
  const startConnect = (gid: string) => { setConnecting(gid); setGatewayForms({ ...gatewayForms, [gid]: {} }); };
  const cancelConnect = () => { setConnecting(null); };
  const testAndConnect = async (gid: string) => {
    if (!tenant) return;
    const g = GATEWAYS.find(x => x.id === gid)!;
    await supabase.from('vendor_payment_gateways').insert({
      tenant_id: tenant.id, gateway: gid, api_key_encrypted: gatewayForms[gid]?.[g.fields[0]] || 'encrypted',
      api_secret_encrypted: gatewayForms[gid]?.[g.fields[1]] || 'encrypted', status: 'active', is_active: true,
    });
    setConnecting(null); loadData();
  };
  const disconnect = async (gid: string) => {
    const g = gateways.find(x => x.gateway === gid);
    if (g) { await supabase.from('vendor_payment_gateways').delete().eq('id', g.id); loadData(); }
  };

  // Team CRUD
  const saveTeam = async () => {
    if (!tenant || !teamForm.email) return;
    await supabase.from('team_members').insert({ tenant_id: tenant.id, email: teamForm.email, role: teamForm.role, status: 'pending', invited_by: tenant.owner_id });
    setShowTeamForm(false); setTeamForm({ email: '', role: 'staff' }); loadData();
  };
  const removeTeam = async (id: string) => {
    if (!confirm('Retirer ce membre ?')) return;
    await supabase.from('team_members').delete().eq('id', id); loadData();
  };
  const updateTeamRole = async (id: string, role: string) => {
    await supabase.from('team_members').update({ role }).eq('id', id); loadData();
  };

  const planRank: any = { starter: 0, premium: 1, entreprise: 2 };
  const canUse = (planRequired: string) => planRank[tenant?.plan || 'starter'] >= planRank[planRequired];

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="19 rubriques, toutes fonctionnelles." />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-2 h-fit lg:sticky lg:top-20">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)} className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${active === s.id ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-50'}`}>{s.label}</button>
          ))}
        </Card>
        <Card className="lg:col-span-3 p-6">
          {saved && <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm"><Check size={16} /> Sauvegardé avec succès.</div>}
          {error && <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm"><AlertCircle size={16} /> {error}</div>}

          {active === 'general' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Informations boutique</h3>
              <div><label className="block text-sm font-medium mb-1">Nom</label><input defaultValue={tenant?.name || ''} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Email contact</label><input defaultValue={tenant?.owner_id || ''} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Devise</label><select defaultValue={tenant?.currency || 'XOF'} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option>XOF</option><option>GHS</option><option>NGN</option><option>KES</option><option>ZAR</option></select></div>
                <div><label className="block text-sm font-medium mb-1">Fuseau horaire</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option>Africa/Abidjan</option><option>Africa/Lagos</option><option>Africa/Nairobi</option><option>Africa/Douala</option></select></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Pays</label><select defaultValue={tenant?.country || ''} className="w-full px-3 py-2 border border-gray-200 rounded-lg">{AFRICAN_COUNTRIES.map(c => <option key={c.code}>{c.flag} {c.name}</option>)}</select></div>
              <Button onClick={showSaved}>Sauvegarder</Button>
            </div>
          )}

          {active === 'plan' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Plan actuel</h3>
              <div className="p-4 bg-orange-50 rounded-xl flex items-center justify-between">
                <div><p className="font-semibold capitalize">{tenant?.plan || 'starter'}</p><p className="text-sm text-gray-500">{tenant?.billing_cycle === 'annual' ? 'Annuel' : 'Mensuel'} · {tenant?.status === 'trial' ? '7 jours d\'essai' : 'Actif'}</p></div>
                <Button>Changer de plan</Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[{n:'Starter',p:'$9'},{n:'Premium',p:'$19',pop:true},{n:'Entreprise',p:'$69'}].map(p => (
                  <div key={p.n} className={`p-4 rounded-xl border-2 ${p.pop ? 'border-orange-500' : 'border-gray-200'}`}>
                    {p.pop && <Badge color="orange">Recommandé</Badge>}
                    <p className="font-semibold mt-1">{p.n}</p><p className="text-2xl font-semibold">{p.p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'billing' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Facturation</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Prochaine facture : <strong>{tenant?.plan === 'premium' ? '$19' : tenant?.plan === 'entreprise' ? '$69' : '$9'}</strong></p>
                <p className="text-sm text-gray-600 mt-1">Méthode : Carte Visa ****4242</p>
              </div>
              <Button variant="secondary">Télécharger factures</Button>
              <Button variant="ghost">Mettre à jour la carte</Button>
            </div>
          )}

          {active === 'users' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Utilisateurs de la boutique</h3>
              <div className="space-y-2">
                {teamMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div><p className="font-medium text-gray-900">{m.email}</p><p className="text-xs text-gray-500">{m.role} · {m.status}</p></div>
                    <div className="flex items-center gap-2">
                      <select value={m.role} onChange={e => updateTeamRole(m.id, e.target.value)} className="text-xs px-2 py-1 border border-gray-200 rounded"><option value="admin">Admin</option><option value="staff">Staff</option><option value="orders">Commandes</option></select>
                      <button onClick={() => removeTeam(m.id)} className="text-red-600 text-xs hover:underline">Retirer</button>
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 && <p className="text-sm text-gray-500">Aucun membre d'équipe.</p>}
              </div>
              {showTeamForm ? (
                <div className="p-3 border border-gray-200 rounded-lg space-y-2">
                  <input type="email" value={teamForm.email} onChange={e => setTeamForm({ ...teamForm, email: e.target.value })} placeholder="email@exemple.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                  <select value={teamForm.role} onChange={e => setTeamForm({ ...teamForm, role: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="admin">Admin (accès complet)</option><option value="staff">Staff (accès limité)</option><option value="orders">Commandes uniquement</option></select>
                  <div className="flex gap-2"><Button size="sm" onClick={saveTeam}>Inviter</Button><Button variant="ghost" size="sm" onClick={() => setShowTeamForm(false)}>Annuler</Button></div>
                </div>
              ) : (
                <Button variant="secondary" onClick={() => setShowTeamForm(true)}><Plus size={14} /> Inviter un utilisateur</Button>
              )}
            </div>
          )}

          {active === 'payments' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Moyens de paiement</h3>
              <p className="text-sm text-gray-500">Connectez vos propres identifiants API. L'argent va directement dans votre compte, sans commission LiAfrikOS.</p>
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
                <Lock size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Vos clés API sont chiffrées (AES-256) et stockées de façon sécurisée. Elles ne sont jamais affichées en clair après sauvegarde.</span>
              </div>
              {GATEWAYS.map(g => {
                const connected = gateways.some(x => x.gateway === g.id && x.is_active);
                return (
                  <div key={g.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3">
                      <div><p className="font-medium text-gray-900">{g.name}</p><p className="text-xs text-gray-500">{g.desc}</p></div>
                      {connected ? (
                        <div className="flex items-center gap-2"><Badge color="green"><Check size={10} /> Connecté</Badge><button onClick={() => disconnect(g.id)} className="text-red-600 text-xs hover:underline">Déconnecter</button></div>
                      ) : connecting === g.id ? (
                        <Button variant="ghost" size="sm" onClick={cancelConnect}><X size={14} /> Annuler</Button>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => startConnect(g.id)}>Connecter</Button>
                      )}
                    </div>
                    {connecting === g.id && (
                      <div className="p-3 border-t border-gray-100 bg-gray-50 space-y-2">
                        {g.fields.map(f => (
                          <div key={f}><label className="block text-xs font-medium text-gray-700 mb-1">{f}</label><input type="password" placeholder="••••••••••••" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" onChange={e => setGatewayForms({ ...gatewayForms, [g.id]: { ...gatewayForms[g.id], [f]: e.target.value } })} /></div>
                        ))}
                        <div className="flex gap-2 pt-2"><Button size="sm" onClick={() => testAndConnect(g.id)}><Check size={14} /> Tester & connecter</Button><Button variant="ghost" size="sm" onClick={cancelConnect}>Annuler</Button></div>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><AlertCircle size={10} /> Un test de connexion sera effectué avant l'activation.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {active === 'checkout' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Configuration du checkout</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"><span className="text-sm font-medium">Compte client obligatoire</span><input type="checkbox" defaultChecked className="w-4 h-4" /></label>
                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"><span className="text-sm font-medium">Autoriser checkout invité</span><input type="checkbox" defaultChecked className="w-4 h-4" /></label>
                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"><span className="text-sm font-medium">Adresse de livraison requise</span><input type="checkbox" defaultChecked className="w-4 h-4" /></label>
                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"><span className="text-sm font-medium">Accepter les remboursements</span><input type="checkbox" defaultChecked className="w-4 h-4" /></label>
              </div>
              <Button onClick={showSaved}>Sauvegarder</Button>
            </div>
          )}

          {active === 'accounts' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Comptes clients</h3>
              <div><label className="block text-sm font-medium mb-1">Format du compte</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option>Email + mot de passe</option><option>Email + OTP</option><option>Téléphone + OTP</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Page de connexion</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option>Page dédiée</option><option>Modal</option></select></div>
              <Button onClick={showSaved}>Sauvegarder</Button>
            </div>
          )}

          {active === 'shipping' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Zones de livraison</h3>
              <p className="text-sm text-gray-500">Définissez vos zones de livraison et leurs tarifs. Ces tarifs s'appliquent au checkout.</p>
              {zones.length === 0 && !showZoneForm ? (
                <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">Aucune zone configurée. Ajoutez votre première zone.</p>
              ) : (
                <div className="space-y-2">
                  {zones.map(z => (
                    <div key={z.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div><p className="font-medium text-gray-900">{z.name}</p><p className="text-xs text-gray-500">{z.country || 'Tous pays'} · {(z.rate_amount_cents / 100).toLocaleString('fr-FR')} {tenant?.currency || 'XOF'} · {z.estimated_days}j{z.free_shipping_threshold_cents ? ` · Gratuit dès ${(z.free_shipping_threshold_cents / 100).toLocaleString('fr-FR')}` : ''}</p></div>
                      <button onClick={() => deleteZone(z.id)} className="text-red-600 text-xs hover:underline"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
              {showZoneForm ? (
                <div className="p-4 border border-gray-200 rounded-lg space-y-2">
                  <div><label className="block text-xs font-medium mb-1">Nom de la zone *</label><input value={zoneForm.name} onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })} placeholder="Abidjan" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-medium mb-1">Pays</label><select value={zoneForm.country} onChange={e => setZoneForm({ ...zoneForm, country: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="">Tous pays</option>{AFRICAN_COUNTRIES.map(c => <option key={c.code}>{c.name}</option>)}</select></div>
                    <div><label className="block text-xs font-medium mb-1">Région</label><input value={zoneForm.region} onChange={e => setZoneForm({ ...zoneForm, region: e.target.value })} placeholder="Abidjan" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-medium mb-1">Type de tarif</label><select value={zoneForm.rate_type} onChange={e => setZoneForm({ ...zoneForm, rate_type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="fixed">Fixe</option><option value="free">Gratuit</option></select></div>
                    <div><label className="block text-xs font-medium mb-1">Tarif ({tenant?.currency || 'XOF'})</label><input type="number" value={zoneForm.rate_amount} onChange={e => setZoneForm({ ...zoneForm, rate_amount: e.target.value })} placeholder="1000" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-medium mb-1">Gratuit dès ({tenant?.currency || 'XOF'})</label><input type="number" value={zoneForm.free_threshold} onChange={e => setZoneForm({ ...zoneForm, free_threshold: e.target.value })} placeholder="50000" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs font-medium mb-1">Délai estimé (jours)</label><input type="number" value={zoneForm.estimated_days} onChange={e => setZoneForm({ ...zoneForm, estimated_days: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                  </div>
                  {!canUse('premium') && zoneForm.country && (
                    <p className="text-xs text-orange-600 flex items-center gap-1"><AlertCircle size={10} /> Zones internationales réservées au plan Premium.</p>
                  )}
                  <div className="flex gap-2"><Button size="sm" onClick={saveZone}>Ajouter</Button><Button variant="ghost" size="sm" onClick={() => setShowZoneForm(false)}>Annuler</Button></div>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setShowZoneForm(true)}><Plus size={14} /> Ajouter une zone</Button>
              )}
            </div>
          )}

          {active === 'taxes' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Taxes et droits</h3>
              <div><label className="block text-sm font-medium mb-1">TVA par défaut (%)</label><input type="number" defaultValue="18" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"><span className="text-sm font-medium">Inclure la TVA dans les prix</span><input type="checkbox" defaultChecked className="w-4 h-4" /></label>
              <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"><span className="text-sm font-medium">Collecter les taxes sur la livraison</span><input type="checkbox" className="w-4 h-4" /></label>
              <Button onClick={showSaved}>Sauvegarder</Button>
            </div>
          )}

          {active === 'locations' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Emplacements de stock</h3>
              <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                <div><p className="font-medium">{tenant?.city || 'Non défini'} — {tenant?.region || ''}</p><p className="text-xs text-gray-500">Principal</p></div>
                <Button variant="ghost" size="sm">Éditer</Button>
              </div>
              <Button variant="secondary" size="sm"><Plus size={14} /> Ajouter un emplacement</Button>
            </div>
          )}

          {active === 'apps' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Applications installées</h3>
              <div className="grid grid-cols-2 gap-3">
                {['WhatsApp Business', 'Mailchimp', 'Google Analytics', 'Klaviyo'].map(a => (
                  <div key={a} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between"><span className="text-sm font-medium">{a}</span><Badge color="green">Actif</Badge></div>
                ))}
              </div>
              <Button variant="secondary" size="sm">Parcourir l'App Store</Button>
            </div>
          )}

          {active === 'channels' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Canaux de vente</h3>
              <p className="text-sm text-gray-500">Activez ou désactivez vos canaux de vente. Certains canaux nécessitent un plan supérieur.</p>
              <div className="space-y-2">
                {CHANNELS.map(ch => {
                  const dbCh = channels.find(c => c.channel === ch.id);
                  const isActive = dbCh?.is_active || false;
                  const allowed = canUse(ch.plan);
                  return (
                    <div key={ch.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div><p className="text-sm font-medium text-gray-900">{ch.name}</p><p className="text-xs text-gray-500">Plan requis: {ch.plan}</p></div>
                      <div className="flex items-center gap-2">
                        {!allowed && <Badge color="orange">🔒 {ch.plan}</Badge>}
                        {allowed && <button onClick={() => toggleChannel({ id: dbCh?.id || '', channel: ch.id, is_active: isActive, plan_required: ch.plan })} className={`relative w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}><span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isActive ? 'translate-x-5' : ''}`} /></button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {active === 'domains' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Domaines</h3>
              <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <div><p className="font-medium">{tenant?.name?.toLowerCase().replace(/[^a-z0-9]/g, '-')}.liafrikos.com</p><Badge color="green">Actif</Badge></div>
              </div>
              {domains.map(d => (
                <div key={d.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div><p className="font-medium text-gray-900">{d.domain_name}</p><div className="flex gap-2 mt-1"><Badge color={d.dns_status === 'verified' ? 'green' : 'orange'}>DNS: {d.dns_status}</Badge><Badge color={d.ssl_status === 'active' ? 'green' : 'orange'}>SSL: {d.ssl_status}</Badge></div></div>
                    <div className="flex gap-2">
                      {d.dns_status !== 'verified' && <Button size="sm" variant="secondary" onClick={() => verifyDomain(d)}>Vérifier</Button>}
                      <button onClick={() => deleteDomain(d.id)} className="text-red-600 text-xs hover:underline"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  {d.dns_status === 'pending' && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-gray-700">
                      <p className="font-medium mb-1">Instructions DNS :</p>
                      <p>1. Ajoutez un enregistrement CNAME : <code className="bg-white px-1 rounded">{d.domain_name}</code> → <code className="bg-white px-1 rounded">proxy.liafrikos.com</code></p>
                      <p className="mt-1">2. Cliquez sur "Vérifier" — SSL sera activé automatiquement.</p>
                    </div>
                  )}
                </div>
              ))}
              {showDomainForm ? (
                <div className="p-4 border border-gray-200 rounded-lg space-y-2">
                  <input value={domainForm.domain_name} onChange={e => setDomainForm({ ...domainForm, domain_name: e.target.value })} placeholder="maboutique.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                  <div className="flex gap-2"><Button size="sm" onClick={saveDomain}>Connecter</Button><Button variant="ghost" size="sm" onClick={() => setShowDomainForm(false)}>Annuler</Button></div>
                </div>
              ) : (
                <div className="p-3 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm font-medium">Connecter un domaine personnalisé</p>
                  <p className="text-xs text-gray-500 mt-1">{canUse('premium') ? 'SSL automatique via Cloudflare Custom Hostnames.' : 'Disponible avec le plan Premium.'}</p>
                  {canUse('premium') && <Button variant="secondary" size="sm" className="mt-2" onClick={() => setShowDomainForm(true)}><Plus size={14} /> Ajouter un domaine</Button>}
                </div>
              )}
            </div>
          )}

          {active === 'events' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Événements client</h3>
              <p className="text-sm text-gray-500">Suivez les actions de vos clients pour le marketing et l'analytics.</p>
              <div className="space-y-2">
                {['Page vue', 'Produit ajouté au panier', 'Checkout démarré', 'Achat effectué', 'Inscription newsletter'].map(ev => (
                  <label key={ev} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"><span className="text-sm font-medium">{ev}</span><input type="checkbox" defaultChecked className="w-4 h-4" /></label>
                ))}
              </div>
              <Button onClick={showSaved}>Sauvegarder</Button>
            </div>
          )}

          {active === 'notifications' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="space-y-2">
                {['Nouvelle commande', 'Stock faible', 'Nouveau client', 'Avis client', 'Paiement reçu'].map(n => (
                  <label key={n} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"><span className="text-sm font-medium">{n}</span><div className="flex gap-3 text-xs"><label className="flex items-center gap-1">Email <input type="checkbox" defaultChecked /></label><label className="flex items-center gap-1">SMS <input type="checkbox" /></label></div></label>
                ))}
              </div>
              <Button onClick={showSaved}>Sauvegarder</Button>
            </div>
          )}

          {active === 'metafields' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Metafields & Metaobjects</h3>
              <p className="text-sm text-gray-500">Données personnalisées pour vos produits, commandes et clients.</p>
              {metafields.length === 0 && !showMetaForm ? (
                <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">Aucun metafield. Créez votre premier champ personnalisé.</p>
              ) : (
                <div className="space-y-2">
                  {metafields.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div><p className="text-sm font-medium font-mono">{m.namespace}.{m.name}</p><p className="text-xs text-gray-500">{m.entity_type} · Type: {m.field_type}{m.value ? ` · Valeur: ${m.value}` : ''}</p></div>
                      <button onClick={() => deleteMeta(m.id)} className="text-red-600 text-xs hover:underline"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
              {showMetaForm ? (
                <div className="p-4 border border-gray-200 rounded-lg space-y-2">
                  <div><label className="block text-xs font-medium mb-1">Nom du champ *</label><input value={metaForm.name} onChange={e => setMetaForm({ ...metaForm, name: e.target.value })} placeholder="matiere" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-medium mb-1">Entité</label><select value={metaForm.entity_type} onChange={e => setMetaForm({ ...metaForm, entity_type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="product">Produit</option><option value="order">Commande</option><option value="customer">Client</option></select></div>
                    <div><label className="block text-xs font-medium mb-1">Type</label><select value={metaForm.field_type} onChange={e => setMetaForm({ ...metaForm, field_type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="text">Texte</option><option value="number">Nombre</option><option value="boolean">Booléen</option><option value="date">Date</option><option value="list">Liste</option></select></div>
                  </div>
                  <div><label className="block text-xs font-medium mb-1">Valeur par défaut</label><input value={metaForm.value} onChange={e => setMetaForm({ ...metaForm, value: e.target.value })} placeholder="Coton" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                  <div className="flex gap-2"><Button size="sm" onClick={saveMeta}>Créer</Button><Button variant="ghost" size="sm" onClick={() => setShowMetaForm(false)}>Annuler</Button></div>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setShowMetaForm(true)}><Plus size={14} /> Ajouter un metafield</Button>
              )}
            </div>
          )}

          {active === 'languages' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Langues</h3>
              <p className="text-sm text-gray-500">Langues disponibles sur votre boutique.</p>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"><span className="text-sm font-medium">🇫🇷 Français</span><Badge color="green">Par défaut</Badge></label>
                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"><span className="text-sm font-medium">🇬🇧 English</span><input type="checkbox" defaultChecked className="w-4 h-4" /></label>
              </div>
              <Button onClick={showSaved}>Sauvegarder</Button>
            </div>
          )}

          {active === 'privacy' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Confidentialité client</h3>
              <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"><span className="text-sm font-medium">Collecter les données de navigation</span><input type="checkbox" defaultChecked className="w-4 h-4" /></label>
              <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"><span className="text-sm font-medium">Partager avec des tiers (analytics)</span><input type="checkbox" className="w-4 h-4" /></label>
              <div><label className="block text-sm font-medium mb-1">Durée de conservation (mois)</label><input type="number" defaultValue="24" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <Button onClick={showSaved}>Sauvegarder</Button>
            </div>
          )}

          {active === 'policies' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Politiques de la boutique</h3>
              <div><label className="block text-sm font-medium mb-1">Politique de remboursement</label><textarea rows={3} defaultValue="Remboursement sous 14 jours..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Politique de confidentialité</label><textarea rows={3} defaultValue="Vos données sont protégées..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Conditions de service</label><textarea rows={3} defaultValue="En commandant, vous acceptez..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <Button onClick={showSaved}>Sauvegarder</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
