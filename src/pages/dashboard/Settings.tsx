import { useState } from 'react';
import { useAuth, useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader, Button, Input, Modal, Badge } from './ui';
import { Save, Store, User, CreditCard, Bell, Globe, Lock, Mail, Phone, MapPin, Palette, Zap, Users, FileText, BarChart3, ShoppingCart, Package, Settings as SettingsIcon, Check, ChevronRight } from 'lucide-react';

const SETTINGS_RUBRICS = [
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

export default function Settings() {
  const { user } = useAuth();
  const { tenant, reload } = useTenant();
  const [activeRubric, setActiveRubric] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', sector: '', country: '', currency: 'XOF' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useState(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  });

  const loadForm = () => {
    if (tenant) setForm({ name: tenant.name, sector: tenant.sector || '', country: tenant.country || '', currency: tenant.currency });
  };
  useState(() => { if (tenant) loadForm(); });

  const save = async () => {
    if (!tenant) return;
    setSaving(true);
    await supabase.from('tenants').update({ name: form.name, sector: form.sector, country: form.country, currency: form.currency }).eq('id', tenant.id);
    await reload();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const renderRubricContent = (rubricId: string) => {
    switch (rubricId) {
      case 'store':
        return (
          <div className="space-y-4">
            <Input label="Nom de la boutique" value={form.name} onChange={v => setForm({ ...form, name: v })} />
            <Input label="Secteur d'activité" value={form.sector} onChange={v => setForm({ ...form, sector: v })} />
            <Input label="Pays" value={form.country} onChange={v => setForm({ ...form, country: v })} />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Devise</label>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400">
                <option value="XOF">XOF (Franc CFA)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="NGN">NGN (Naira)</option>
                <option value="GHS">GHS (Cedi)</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={save} disabled={saving || !form.name}><Save size={16} /> {saving ? 'Sauvegarde…' : 'Sauvegarder'}</Button>
              {saved && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> Enregistré!</span>}
            </div>
          </div>
        );
      case 'account':
        return (
          <div className="space-y-3">
            <div><span className="text-xs text-gray-400">Email</span><p className="text-sm font-medium text-gray-900">{user?.email}</p></div>
            <div><span className="text-xs text-gray-400">Plan</span><p className="text-sm font-medium text-gray-900 capitalize">{tenant?.plan || 'Starter'}</p></div>
            <div><span className="text-xs text-gray-400">Statut</span><Badge color={tenant?.status === 'active' ? 'green' : 'orange'}>{tenant?.status || 'Trial'}</Badge></div>
            <div><span className="text-xs text-gray-400">Cycle de facturation</span><p className="text-sm font-medium text-gray-900 capitalize">{tenant?.billing_cycle || 'Monthly'}</p></div>
          </div>
        );
      case 'payments':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Configurez vos passerelles de paiement.</p>
            {['Flutterwave', 'Paystack', 'Orange Money', 'MTN MoMo', 'CinetPay', 'Stripe'].map(g => (
              <div key={g} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{g}</span>
                <Button size="sm" variant="secondary">Configurer</Button>
              </div>
            ))}
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-3">
            {['Nouvelles commandes', 'Ruptures de stock', 'Nouveaux clients', 'Promotions', 'Rapports hebdomadaires'].map(n => (
              <label key={n} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-900">{n}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-500" />
              </label>
            ))}
          </div>
        );
      case 'shipping':
        return (
          <div className="space-y-3">
            <Input label="Adresse de l'entrepôt" value="" onChange={() => {}} placeholder="Rue, ville, pays" />
            <Input label="Délai de traitement (jours)" type="number" value="2" onChange={() => {}} />
            <Button variant="secondary"><Save size={14} /> Sauvegarder</Button>
          </div>
        );
      case 'domains':
        return (
          <div className="space-y-3">
            <Input label="Domaine personnalisé" value="" onChange={() => {}} placeholder="maboutique.com" />
            <Button variant="secondary">Vérifier le domaine</Button>
            <p className="text-xs text-gray-400">SSL automatique inclus avec tous les domaines.</p>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-3">
            <Input label="Mot de passe actuel" type="password" value="" onChange={() => {}} />
            <Input label="Nouveau mot de passe" type="password" value="" onChange={() => {}} />
            <Input label="Confirmer le mot de passe" type="password" value="" onChange={() => {}} />
            <Button variant="secondary"><Lock size={14} /> Mettre à jour</Button>
            <label className="flex items-center gap-2 pt-2"><input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Authentification à deux facteurs</span></label>
          </div>
        );
      case 'team':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Gérez les membres de votre équipe dans l'onglet Équipe du tableau de bord.</p>
            <Button variant="secondary"><Users size={14} /> Aller à l'équipe</Button>
          </div>
        );
      case 'taxes':
        return (
          <div className="space-y-3">
            <Input label="Taux de TVA (%)" type="number" value="0" onChange={() => {}} />
            <label className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Inclure la TVA dans les prix</span></label>
            <Button variant="secondary"><Save size={14} /> Sauvegarder</Button>
          </div>
        );
      case 'languages':
        return (
          <div className="space-y-3">
            {['Français', 'English', 'Wolof', 'Bambara', 'Swahili'].map(l => (
              <label key={l} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer">
                <input type="checkbox" defaultChecked={l === 'Français'} className="w-4 h-4 accent-brand-500" /> <span className="text-sm">{l}</span>
              </label>
            ))}
          </div>
        );
      case 'billing':
        return (
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 capitalize">{tenant?.plan || 'Starter'} Plan</p>
              <p className="text-xs text-gray-500 capitalize">{tenant?.billing_cycle || 'Monthly'} · {tenant?.status || 'Trial'}</p>
            </div>
            <Button variant="secondary">Changer de plan</Button>
            <Button variant="ghost">Voir les factures</Button>
          </div>
        );
      case 'legal':
        return (
          <div className="space-y-2">
            {['Conditions générales de vente', 'Politique de confidentialité', 'Mentions légales', 'Politique de retour'].map(l => (
              <div key={l} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-900">{l}</span>
                <Button size="sm" variant="secondary">Éditer</Button>
              </div>
            ))}
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-3">
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Activer le suivi analytics</span></label>
            <Input label="ID Google Analytics" value="" onChange={() => {}} placeholder="GA-XXXXXXX" />
            <Button variant="secondary"><Save size={14} /> Sauvegarder</Button>
          </div>
        );
      case 'checkout':
        return (
          <div className="space-y-3">
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Checkout invité (sans compte)</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Afficher la newsletter opt-in</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Forcer la création de compte</span></label>
            <Button variant="secondary"><Save size={14} /> Sauvegarder</Button>
          </div>
        );
      case 'inventory':
        return (
          <div className="space-y-3">
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Suivi de stock automatique</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-500" /> <span className="text-sm">Alerte de rupture (seuil: 5)</span></label>
            <Input label="Seuil d'alerte" type="number" value="5" onChange={() => {}} />
            <Button variant="secondary"><Save size={14} /> Sauvegarder</Button>
          </div>
        );
      case 'emails':
        return (
          <div className="space-y-3">
            <Input label="Email expéditeur" value="" onChange={() => {}} placeholder="contact@maboutique.com" />
            <Input label="Nom expéditeur" value="" onChange={() => {}} placeholder="Ma Boutique" />
            <Button variant="secondary"><Save size={14} /> Sauvegarder</Button>
          </div>
        );
      case 'phone':
        return (
          <div className="space-y-3">
            <Input label="Numéro de téléphone" value="" onChange={() => {}} placeholder="+225 07 00 00 00" />
            <Button variant="secondary"><Save size={14} /> Sauvegarder</Button>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Personnalisez l'apparence dans Online Store.</p>
            <Button variant="secondary"><Palette size={14} /> Aller à Online Store</Button>
          </div>
        );
      case 'integrations':
        return (
          <div className="space-y-3">
            {['WhatsApp Business', 'Instagram Shop', 'Facebook Pixel', 'Google Shopping', 'TikTok Shop'].map(i => (
              <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{i}</span>
                <Button size="sm" variant="secondary">Connecter</Button>
              </div>
            ))}
          </div>
        );
      default:
        return <p className="text-sm text-gray-400">Configuration en cours de développement.</p>;
    }
  };

  // Mobile: list view → tap opens modal
  if (isMobile) {
    return (
      <div>
        <PageHeader title="Paramètres" subtitle="Configurez votre boutique et votre compte" />
        <Card className="p-2">
          {SETTINGS_RUBRICS.map(r => {
            const Icon = r.icon;
            return (
              <button key={r.id} onClick={() => { setActiveRubric(r.id); if (r.id === 'store') loadForm(); }} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Icon size={16} className="text-gray-600" /></div>
                <span className="flex-1 text-left text-sm font-medium text-gray-900">{r.label}</span>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            );
          })}
        </Card>
        <Modal open={!!activeRubric} onClose={() => setActiveRubric(null)} title={SETTINGS_RUBRICS.find(r => r.id === activeRubric)?.label || ''} maxWidth="max-w-md">
          {activeRubric && renderRubricContent(activeRubric)}
          <div className="pt-4 mt-4 border-t border-gray-100">
            <Button variant="secondary" className="w-full" onClick={() => setActiveRubric(null)}>Terminé</Button>
          </div>
        </Modal>
      </div>
    );
  }

  // Desktop: two-column layout
  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Configurez votre boutique et votre compte" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-5xl">
        <Card className="p-2 lg:col-span-1">
          {SETTINGS_RUBRICS.map(r => {
            const Icon = r.icon;
            return (
              <button key={r.id} onClick={() => { setActiveRubric(r.id); if (r.id === 'store') loadForm(); }} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeRubric === r.id ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50 text-gray-700'}`}>
                <Icon size={16} />
                <span className="text-sm font-medium">{r.label}</span>
              </button>
            );
          })}
        </Card>
        <Card className="p-5 lg:col-span-2">
          {activeRubric ? renderRubricContent(activeRubric) : (
            <div className="text-center py-12">
              <SettingsIcon size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Sélectionnez une rubrique à gauche pour configurer.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
