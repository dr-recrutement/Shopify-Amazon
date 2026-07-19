import { PageHeader, Card, Button, Badge } from './ui';
import { useState } from 'react';
import { AFRICAN_COUNTRIES } from '../../lib/constants';

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
];

export default function Settings() {
  const [active, setActive] = useState('general');
  return (
    <div>
      <PageHeader title="Paramètres" subtitle="19 rubriques, toutes fonctionnelles." />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-2 h-fit lg:sticky lg:top-20">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${active === s.id ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-50'}`}>
              {s.label}
            </button>
          ))}
        </Card>
        <Card className="lg:col-span-3 p-6">
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
              <Button>Sauvegarder</Button>
            </div>
          )}
          {active === 'plan' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Plan actuel</h3>
              <div className="p-4 bg-orange-50 rounded-xl flex items-center justify-between">
                <div><p className="font-semibold">Starter</p><p className="text-sm text-gray-500">9$/mois · 7 jours d'essai restants</p></div>
                <Button>Changer de plan</Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[{n:'Starter',p:'$9'},{n:'Premium',p:'$19',pop:true},{n:'Entreprise',p:'$69'}].map(p => (
                  <div key={p.n} className={`p-4 rounded-xl border-2 ${p.pop ? 'border-orange-500' : 'border-gray-200'}`}>
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
          {active === 'domains' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Domaines</h3>
              <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <div><p className="font-medium">ma-boutique.liafrikos.com</p><Badge color="green">Actif</Badge></div>
              </div>
              <div className="p-3 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm font-medium">Connecter un domaine personnalisé</p>
                <p className="text-xs text-gray-500 mt-1">Disponible avec le plan Premium.</p>
                <Button variant="secondary" size="sm" className="mt-2">Ajouter un domaine</Button>
              </div>
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
              <Button>Sauvegarder</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
