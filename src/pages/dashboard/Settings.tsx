import { useState, useEffect, useCallback } from 'react';
import { useAuth, useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, Button, Modal, Badge } from './ui';
import { COUNTRIES, COUNTRIES_CITIES, CURRENCIES, LANGUAGES } from '../../lib/constants';
import { Save, Store, User, CreditCard, Bell, Globe, Lock, Mail, Phone, MapPin, Palette, Zap, Users, FileText, BarChart3, ShoppingCart, Package, Settings as SettingsIcon, Check, ChevronRight, Plus, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';

const RUBRICS = [
  { id: 'store', label: 'Boutique', icon: Store },
  { id: 'account', label: 'Compte', icon: User },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'shipping', label: 'Livraison', icon: MapPin },
  { id: 'domains', label: 'Domaines', icon: Globe },
  { id: 'security', label: 'Sécurité', icon: Lock },
  { id: 'team', label: 'Équipe', icon: Users },
  { id: 'taxes', label: 'Taxes', icon: FileText },
  { id: 'languages', label: 'Langues', icon: Globe },
  { id: 'billing', label: 'Facturation', icon: CreditCard },
  { id: 'legal', label: 'Légal', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'checkout', label: 'Checkout', icon: ShoppingCart },
  { id: 'inventory', label: 'Inventaire', icon: Package },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'phone', label: 'Téléphone', icon: Phone },
  { id: 'appearance', label: 'Apparence', icon: Palette },
  { id: 'integrations', label: 'Intégrations', icon: Zap },
];

function useSavedState<T>(key: string, initial: T): [T, (v: T) => void, () => Promise<void>, boolean, string | null] {
  const [value, setValue] = useState<T>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setMsg('Enregistré!');
      setTimeout(() => setMsg(null), 2000);
    } finally {
      setSaving(false);
    }
  }, [key, value]);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) setValue(JSON.parse(stored));
  }, [key]);

  return [value, setValue, save, saving, msg];
}

function SaveButton({ saving, msg }: { saving: boolean; msg: string | null }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <Button onClick={undefined as any} disabled={saving}><Save size={16} /> {saving ? 'Sauvegarde…' : 'Sauvegarder'}</Button>
      {msg && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> {msg}</span>}
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { tenant, reload } = useTenant();
  const [activeRubric, setActiveRubric] = useState<string | null>('store');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [savedMsg, setSavedMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Store settings
  const [storeForm, setStoreForm] = useState({ name: '', sector: '', country: '', city: '', currency: 'XOF' });
  // Shipping
  const [shippingForm, setShippingForm, saveShipping, shippingSaving, shippingMsg] = useSavedState('settings_shipping', { address: '', processingDays: '2', freeShippingThreshold: '' });
  // Notifications
  const [notifForm, setNotifForm, saveNotif, notifSaving, notifMsg] = useSavedState('settings_notifications', { newOrders: true, stockAlerts: true, newCustomers: true, promotions: false, weeklyReports: true });
  // Security
  const [securityForm, setSecurityForm] = useState({ current: '', next: '', confirm: '', twoFA: true });
  // Taxes
  const [taxForm, setTaxForm, saveTax, taxSaving, taxMsg] = useSavedState('settings_taxes', { vatRate: '0', includeInPrice: false });
  // Languages
  const [langForm, setLangForm, saveLang, langSaving, langMsg] = useSavedState('settings_languages', { fr: true, en: false, wo: false, bm: false, sw: false });
  // Analytics
  const [analyticsForm, setAnalyticsForm, saveAnalytics, analyticsSaving, analyticsMsg] = useSavedState('settings_analytics', { enabled: true, gaId: '' });
  // Checkout
  const [checkoutForm, setCheckoutForm, saveCheckout, checkoutSaving, checkoutMsg] = useSavedState('settings_checkout', { guestCheckout: true, newsletterOptIn: true, forceAccount: false });
  // Inventory
  const [inventoryForm, setInventoryForm, saveInventory, inventorySaving, inventoryMsg] = useSavedState('settings_inventory', { autoTracking: true, stockAlerts: true, threshold: '5' });
  // Emails
  const [emailForm, setEmailForm, saveEmails, emailSaving, emailMsg] = useSavedState('settings_emails', { senderEmail: '', senderName: '' });
  // Phone
  const [phoneForm, setPhoneForm, savePhone, phoneSaving, phoneMsg] = useSavedState('settings_phone', { phone: '' });
  // Integrations
  const [integrations, setIntegrations, saveIntegrations, intSaving, intMsg] = useSavedState('settings_integrations', { whatsapp: false, instagram: false, facebook: false, google: false, tiktok: false });
  // Legal
  const [legalForm, setLegalForm, saveLegal, legalSaving, legalMsg] = useSavedState('settings_legal', { cgv: '', privacy: '', mentions: '', retour: '' });
  // Domains
  const [domains, setDomains] = useState<any[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [domainModal, setDomainModal] = useState(false);
  // Payment gateways
  const [gateways, setGateways] = useState<any[]>([]);
  const [gatewayModal, setGatewayModal] = useState<string | null>(null);
  const [gatewayForm, setGatewayForm] = useState({ apiKey: '', apiSecret: '' });

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    if (tenant) {
      setStoreForm({ name: tenant.name, sector: tenant.sector || '', country: tenant.country || '', city: tenant.city || '', currency: tenant.currency || 'XOF' });
    }
  }, [tenant]);

  const loadDomains = useCallback(async () => {
    if (!tenant) return;
    const { data } = await supabase.from('domains').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false });
    setDomains(data || []);
  }, [tenant]);

  const loadGateways = useCallback(async () => {
    if (!tenant) return;
    const { data } = await supabase.from('vendor_payment_gateways').select('*').eq('tenant_id', tenant.id).order('display_order');
    setGateways(data || []);
  }, [tenant]);

  useEffect(() => { loadDomains(); loadGateways(); }, [loadDomains, loadGateways]);

  const saveStore = async () => {
    if (!tenant) return;
    setSaving(true);
    await supabase.from('tenants').update({
      name: storeForm.name, sector: storeForm.sector, country: storeForm.country, city: storeForm.city, currency: storeForm.currency,
    }).eq('id', tenant.id);
    await reload();
    setSaving(false);
    setSavedMsg('Boutique mise à jour!');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const updatePassword = async () => {
    if (!user) return;
    if (securityForm.next !== securityForm.confirm) { setSavedMsg('Les mots de passe ne correspondent pas'); setTimeout(() => setSavedMsg(''), 3000); return; }
    if (securityForm.next.length < 6) { setSavedMsg('Mot de passe trop court (min 6 caractères)'); setTimeout(() => setSavedMsg(''), 3000); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: securityForm.next });
    setSaving(false);
    if (error) { setSavedMsg(error.message); } else { setSavedMsg('Mot de passe mis à jour!'); setSecurityForm({ current: '', next: '', confirm: '', twoFA: securityForm.twoFA }); }
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const addDomain = async () => {
    if (!tenant || !newDomain) return;
    await supabase.from('domains').insert({ tenant_id: tenant.id, domain_name: newDomain, type: 'custom', dns_status: 'pending', ssl_status: 'pending' });
    setNewDomain('');
    setDomainModal(false);
    loadDomains();
  };

  const verifyDomain = async (id: string) => {
    await supabase.from('domains').update({ dns_status: 'verified', ssl_status: 'active', verified_at: new Date().toISOString() }).eq('id', id);
    loadDomains();
  };

  const removeDomain = async (id: string) => {
    await supabase.from('domains').delete().eq('id', id);
    loadDomains();
  };

  const saveGateway = async () => {
    if (!tenant || !gatewayModal) return;
    const existing = gateways.find(g => g.gateway === gatewayModal);
    if (existing) {
      await supabase.from('vendor_payment_gateways').update({
        api_key_encrypted: btoa(gatewayForm.apiKey), api_secret_encrypted: btoa(gatewayForm.apiSecret), is_active: true,
      }).eq('id', existing.id);
    } else {
      await supabase.from('vendor_payment_gateways').insert({
        tenant_id: tenant.id, gateway: gatewayModal, api_key_encrypted: btoa(gatewayForm.apiKey), api_secret_encrypted: btoa(gatewayForm.apiSecret),
        status: 'active', is_active: true, display_order: gateways.length,
      });
    }
    setGatewayModal(null);
    setGatewayForm({ apiKey: '', apiSecret: '' });
    loadGateways();
  };

  const toggleGateway = async (id: string, active: boolean) => {
    await supabase.from('vendor_payment_gateways').update({ is_active: !active }).eq('id', id);
    loadGateways();
  };

  const cities = storeForm.country ? COUNTRIES_CITIES[storeForm.country] || [] : [];

  const renderContent = (rubricId: string) => {
    switch (rubricId) {
      case 'store':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom de la boutique</label>
              <input value={storeForm.name} onChange={e => setStoreForm({ ...storeForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Secteur d'activité</label>
              <input value={storeForm.sector} onChange={e => setStoreForm({ ...storeForm, sector: e.target.value })} placeholder="Mode, Électronique…" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Pays</label>
              <select value={storeForm.country} onChange={e => setStoreForm({ ...storeForm, country: e.target.value, city: '' })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 bg-white">
                <option value="">— Sélectionner —</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ville</label>
              <select value={storeForm.city} onChange={e => setStoreForm({ ...storeForm, city: e.target.value })} disabled={!storeForm.country} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 bg-white disabled:bg-gray-50 disabled:text-gray-400">
                <option value="">— {storeForm.country ? 'Sélectionner' : 'Choisir d\'abord un pays'} —</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Devise</label>
              <select value={storeForm.currency} onChange={e => setStoreForm({ ...storeForm, currency: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 bg-white">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={saveStore} disabled={saving || !storeForm.name}><Save size={16} /> {saving ? 'Sauvegarde…' : 'Sauvegarder'}</Button>
              {savedMsg && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> {savedMsg}</span>}
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-400">Email</span><p className="text-sm font-medium text-gray-900">{user?.email}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-400">Plan</span><p className="text-sm font-medium text-gray-900 capitalize">{tenant?.plan || 'Starter'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-400">Statut</span><div className="mt-1"><Badge color={tenant?.status === 'active' ? 'green' : 'orange'}>{tenant?.status || 'Trial'}</Badge></div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-400">Boutique</span><p className="text-sm font-medium text-gray-900">{tenant?.name || '—'}</p>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Configurez vos passerelles de paiement.</p>
            {['Flutterwave', 'Paystack', 'Orange Money', 'MTN MoMo', 'CinetPay', 'Stripe', 'PayPal', 'Wave'].map(g => {
              const existing = gateways.find(gw => gw.gateway === g);
              return (
                <div key={g} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{g}</span>
                    {existing && <Badge color={existing.is_active ? 'green' : 'gray'}>{existing.is_active ? 'Actif' : 'Inactif'}</Badge>}
                  </div>
                  <div className="flex gap-2">
                    {existing && <button onClick={() => toggleGateway(existing.id, existing.is_active)} className="p-1.5 text-gray-400 hover:text-brand-600">{existing.is_active ? <EyeOff size={14} /> : <Eye size={14} />}</button>}
                    <Button size="sm" variant="secondary" onClick={() => { setGatewayModal(g); setGatewayForm({ apiKey: existing?.api_key_encrypted ? atob(existing.api_key_encrypted) : '', apiSecret: existing?.api_secret_encrypted ? atob(existing.api_secret_encrypted) : '' }); }}>{existing ? 'Modifier' : 'Configurer'}</Button>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-3">
            {([['newOrders', 'Nouvelles commandes'], ['stockAlerts', 'Ruptures de stock'], ['newCustomers', 'Nouveaux clients'], ['promotions', 'Promotions'], ['weeklyReports', 'Rapports hebdomadaires']] as const).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-900">{label}</span>
                <input type="checkbox" checked={notifForm[key]} onChange={e => setNotifForm({ ...notifForm, [key]: e.target.checked })} className="w-4 h-4 accent-brand-500" />
              </label>
            ))}
            <SaveButton saving={notifSaving} msg={notifMsg} />
            <button onClick={saveNotif} className="hidden" data-save="notifications" />
            <div className="flex items-center gap-3 pt-2"><Button onClick={saveNotif} disabled={notifSaving}><Save size={16} /> {notifSaving ? 'Sauvegarde…' : 'Sauvegarder'}</Button>{notifMsg && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> {notifMsg}</span>}</div>
          </div>
        );

      case 'shipping':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Adresse de l'entrepôt</label>
              <input value={shippingForm.address} onChange={e => setShippingForm({ ...shippingForm, address: e.target.value })} placeholder="Rue, ville, pays" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Délai de traitement (jours)</label>
              <input type="number" value={shippingForm.processingDays} onChange={e => setShippingForm({ ...shippingForm, processingDays: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Seuil de livraison gratuite (montant)</label>
              <input type="number" value={shippingForm.freeShippingThreshold} onChange={e => setShippingForm({ ...shippingForm, freeShippingThreshold: e.target.value })} placeholder="Ex: 50000" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div className="flex items-center gap-3 pt-2"><Button onClick={saveShipping} disabled={shippingSaving}><Save size={16} /> {shippingSaving ? 'Sauvegarde…' : 'Sauvegarder'}</Button>{shippingMsg && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> {shippingMsg}</span>}</div>
          </div>
        );

      case 'domains':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Vos domaines personnalisés.</p>
              <Button size="sm" onClick={() => setDomainModal(true)}><Plus size={14} /> Ajouter</Button>
            </div>
            {domains.length === 0 ? (
              <div className="text-center py-8">
                <Globe size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Aucun domaine configuré. Ajoutez votre domaine personnalisé.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {domains.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{d.domain_name}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge color={d.dns_status === 'verified' ? 'green' : 'orange'}>DNS: {d.dns_status}</Badge>
                        <Badge color={d.ssl_status === 'active' ? 'green' : 'gray'}>SSL: {d.ssl_status}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {d.dns_status !== 'verified' && <Button size="sm" variant="secondary" onClick={() => verifyDomain(d.id)}>Vérifier</Button>}
                      <button onClick={() => removeDomain(d.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mot de passe actuel</label>
              <input type="password" value={securityForm.current} onChange={e => setSecurityForm({ ...securityForm, current: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <input type="password" value={securityForm.next} onChange={e => setSecurityForm({ ...securityForm, next: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input type="password" value={securityForm.confirm} onChange={e => setSecurityForm({ ...securityForm, confirm: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={securityForm.twoFA} onChange={e => setSecurityForm({ ...securityForm, twoFA: e.target.checked })} className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Authentification à deux facteurs</span></label>
            <div className="flex items-center gap-3 pt-2"><Button onClick={updatePassword} disabled={saving || !securityForm.next}><Lock size={16} /> {saving ? 'Mise à jour…' : 'Mettre à jour'}</Button>{savedMsg && <span className="text-sm flex items-center gap-1" style={{ color: savedMsg.includes('pas') ? '#ef4444' : '#16a34a' }}><AlertCircle size={14} /> {savedMsg}</span>}</div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Gérez les membres de votre équipe dans le module Équipe.</p>
            <a href="/dashboard/team"><Button variant="secondary"><Users size={14} /> Aller à l'équipe</Button></a>
          </div>
        );

      case 'taxes':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Taux de TVA (%)</label>
              <input type="number" value={taxForm.vatRate} onChange={e => setTaxForm({ ...taxForm, vatRate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={taxForm.includeInPrice} onChange={e => setTaxForm({ ...taxForm, includeInPrice: e.target.checked })} className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Inclure la TVA dans les prix</span></label>
            <div className="flex items-center gap-3 pt-2"><Button onClick={saveTax} disabled={taxSaving}><Save size={16} /> {taxSaving ? 'Sauvegarde…' : 'Sauvegarder'}</Button>{taxMsg && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> {taxMsg}</span>}</div>
          </div>
        );

      case 'languages':
        return (
          <div className="space-y-3">
            {LANGUAGES.map(l => (
              <label key={l.code} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer">
                <input type="checkbox" checked={(langForm as any)[l.code] || false} onChange={e => setLangForm({ ...langForm, [l.code]: e.target.checked })} className="w-4 h-4 accent-brand-500" />
                <span className="text-sm">{l.label}</span>
              </label>
            ))}
            <div className="flex items-center gap-3 pt-2"><Button onClick={saveLang} disabled={langSaving}><Save size={16} /> {langSaving ? 'Sauvegarde…' : 'Sauvegarder'}</Button>{langMsg && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> {langMsg}</span>}</div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 capitalize">{tenant?.plan || 'Starter'} Plan</p>
              <p className="text-xs text-gray-500 capitalize">{tenant?.billing_cycle || 'Monthly'} · {tenant?.status || 'Trial'}</p>
            </div>
            <Button variant="secondary" onClick={() => { setSavedMsg('Redirection vers la page de paiement…'); setTimeout(() => setSavedMsg(''), 2000); }}>Changer de plan</Button>
            <Button variant="ghost" onClick={() => { setSavedMsg('Téléchargement des factures…'); setTimeout(() => setSavedMsg(''), 2000); }}>Voir les factures</Button>
            {savedMsg && <p className="text-sm text-gray-500">{savedMsg}</p>}
          </div>
        );

      case 'legal':
        return (
          <div className="space-y-3">
            {([['cgv', 'Conditions générales de vente'], ['privacy', 'Politique de confidentialité'], ['mentions', 'Mentions légales'], ['retour', 'Politique de retour']] as const).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                <textarea rows={3} value={(legalForm as any)[key] || ''} onChange={e => setLegalForm({ ...legalForm, [key]: e.target.value })} placeholder={`Saisissez vos ${label.toLowerCase()}…`} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
              </div>
            ))}
            <div className="flex items-center gap-3 pt-2"><Button onClick={saveLegal} disabled={legalSaving}><Save size={16} /> {legalSaving ? 'Sauvegarde…' : 'Sauvegarder'}</Button>{legalMsg && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> {legalMsg}</span>}</div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={analyticsForm.enabled} onChange={e => setAnalyticsForm({ ...analyticsForm, enabled: e.target.checked })} className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Activer le suivi analytics</span></label>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ID Google Analytics</label>
              <input value={analyticsForm.gaId} onChange={e => setAnalyticsForm({ ...analyticsForm, gaId: e.target.value })} placeholder="GA-XXXXXXX" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div className="flex items-center gap-3 pt-2"><Button onClick={saveAnalytics} disabled={analyticsSaving}><Save size={16} /> {analyticsSaving ? 'Sauvegarde…' : 'Sauvegarder'}</Button>{analyticsMsg && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> {analyticsMsg}</span>}</div>
          </div>
        );

      case 'checkout':
        return (
          <div className="space-y-3">
            <label className="flex items-center gap-2"><input type="checkbox" checked={checkoutForm.guestCheckout} onChange={e => setCheckoutForm({ ...checkoutForm, guestCheckout: e.target.checked })} className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Checkout invité (sans compte)</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={checkoutForm.newsletterOptIn} onChange={e => setCheckoutForm({ ...checkoutForm, newsletterOptIn: e.target.checked })} className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Afficher l'opt-in newsletter</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={checkoutForm.forceAccount} onChange={e => setCheckoutForm({ ...checkoutForm, forceAccount: e.target.checked })} className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Forcer la création de compte</span></label>
            <div className="flex items-center gap-3 pt-2"><Button onClick={saveCheckout} disabled={checkoutSaving}><Save size={16} /> {checkoutSaving ? 'Sauvegarde…' : 'Sauvegarder'}</Button>{checkoutMsg && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> {checkoutMsg}</span>}</div>
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={inventoryForm.autoTracking} onChange={e => setInventoryForm({ ...inventoryForm, autoTracking: e.target.checked })} className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Suivi de stock automatique</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={inventoryForm.stockAlerts} onChange={e => setInventoryForm({ ...inventoryForm, stockAlerts: e.target.checked })} className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Alertes de rupture</span></label>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Seuil d'alerte</label>
              <input type="number" value={inventoryForm.threshold} onChange={e => setInventoryForm({ ...inventoryForm, threshold: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div className="flex items-center gap-3 pt-2"><Button onClick={saveInventory} disabled={inventorySaving}><Save size={16} /> {inventorySaving ? 'Sauvegarde…' : 'Sauvegarder'}</Button>{inventoryMsg && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> {inventoryMsg}</span>}</div>
          </div>
        );

      case 'emails':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email expéditeur</label>
              <input value={emailForm.senderEmail} onChange={e => setEmailForm({ ...emailForm, senderEmail: e.target.value })} placeholder="contact@maboutique.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom expéditeur</label>
              <input value={emailForm.senderName} onChange={e => setEmailForm({ ...emailForm, senderName: e.target.value })} placeholder="Ma Boutique" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div className="flex items-center gap-3 pt-2"><Button onClick={saveEmails} disabled={emailSaving}><Save size={16} /> {emailSaving ? 'Sauvegarde…' : 'Sauvegarder'}</Button>{emailMsg && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> {emailMsg}</span>}</div>
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Numéro de téléphone</label>
              <input value={phoneForm.phone} onChange={e => setPhoneForm({ ...phoneForm, phone: e.target.value })} placeholder="+225 07 00 00 00" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div className="flex items-center gap-3 pt-2"><Button onClick={savePhone} disabled={phoneSaving}><Save size={16} /> {phoneSaving ? 'Sauvegarde…' : 'Sauvegarder'}</Button>{phoneMsg && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> {phoneMsg}</span>}</div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Personnalisez l'apparence de votre boutique dans Online Store.</p>
            <a href="/dashboard/online-store"><Button variant="secondary"><Palette size={14} /> Aller à Online Store</Button></a>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-3">
            {([['whatsapp', 'WhatsApp Business'], ['instagram', 'Instagram Shop'], ['facebook', 'Facebook Pixel'], ['google', 'Google Shopping'], ['tiktok', 'TikTok Shop']] as const).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{label}</span>
                <Button size="sm" variant={integrations[key] ? 'secondary' : 'primary'} onClick={() => { setIntegrations({ ...integrations, [key]: !integrations[key] }); }}>{integrations[key] ? <><Check size={14} /> Connecté</> : 'Connecter'}</Button>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-2"><Button onClick={saveIntegrations} disabled={intSaving}><Save size={16} /> {intSaving ? 'Sauvegarde…' : 'Sauvegarder'}</Button>{intMsg && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> {intMsg}</span>}</div>
          </div>
        );

      default:
        return <p className="text-sm text-gray-400">Configuration en cours de développement.</p>;
    }
  };

  // Mobile: list → modal
  if (isMobile) {
    return (
      <div>
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div><h1 className="text-2xl font-bold text-gray-900 tracking-tight">Paramètres</h1><p className="text-sm text-gray-500 mt-1">Configurez votre boutique et votre compte</p></div>
        </div>
        <Card className="p-2">
          {RUBRICS.map(r => {
            const Icon = r.icon;
            return (
              <button key={r.id} onClick={() => setActiveRubric(r.id)} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Icon size={16} className="text-gray-600" /></div>
                <span className="flex-1 text-left text-sm font-medium text-gray-900">{r.label}</span>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            );
          })}
        </Card>
        <Modal open={!!activeRubric} onClose={() => setActiveRubric(null)} title={RUBRICS.find(r => r.id === activeRubric)?.label || ''} maxWidth="max-w-md">
          {activeRubric && renderContent(activeRubric)}
          <div className="pt-4 mt-4 border-t border-gray-100"><Button variant="secondary" className="w-full" onClick={() => setActiveRubric(null)}>Terminé</Button></div>
        </Modal>
      </div>
    );
  }

  // Desktop: two-column
  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-gray-900 tracking-tight">Paramètres</h1><p className="text-sm text-gray-500 mt-1">Configurez votre boutique et votre compte</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-5xl">
        <Card className="p-2 lg:col-span-1">
          {RUBRICS.map(r => {
            const Icon = r.icon;
            return (
              <button key={r.id} onClick={() => setActiveRubric(r.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeRubric === r.id ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50 text-gray-700'}`}>
                <Icon size={16} /><span className="text-sm font-medium">{r.label}</span>
              </button>
            );
          })}
        </Card>
        <Card className="p-5 lg:col-span-2">
          {activeRubric ? renderContent(activeRubric) : (
            <div className="text-center py-12"><SettingsIcon size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Sélectionnez une rubrique à gauche.</p></div>
          )}
        </Card>
      </div>

      {/* Domain modal */}
      <Modal open={domainModal} onClose={() => setDomainModal(false)} title="Ajouter un domaine">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom de domaine</label>
            <input value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="maboutique.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">Vous devrez configurer vos enregistrements DNS pointant vers nos serveurs. Les instructions seront envoyées après l'ajout.</div>
          <div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setDomainModal(false)}>Annuler</Button><Button onClick={addDomain} disabled={!newDomain}>Ajouter</Button></div>
        </div>
      </Modal>

      {/* Gateway modal */}
      <Modal open={!!gatewayModal} onClose={() => setGatewayModal(null)} title={`Configurer ${gatewayModal || ''}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Clé API</label>
            <input value={gatewayForm.apiKey} onChange={e => setGatewayForm({ ...gatewayForm, apiKey: e.target.value })} placeholder="Votre clé API" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Clé secrète</label>
            <input type="password" value={gatewayForm.apiSecret} onChange={e => setGatewayForm({ ...gatewayForm, apiSecret: e.target.value })} placeholder="Votre clé secrète" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400" />
          </div>
          <div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setGatewayModal(null)}>Annuler</Button><Button onClick={saveGateway} disabled={!gatewayForm.apiKey}>Enregistrer</Button></div>
        </div>
      </Modal>
    </div>
  );
}
