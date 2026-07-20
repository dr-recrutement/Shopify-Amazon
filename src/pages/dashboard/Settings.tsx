import { PageHeader, Card, Button, Badge } from './ui';
import { useState } from 'react';
import { AFRICAN_COUNTRIES } from '../../lib/constants';
import { Check, X, Lock, Plus, Trash2, AlertCircle } from 'lucide-react';

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

const GATEWAYS = [
  { id: 'flutterwave', name: 'Flutterwave', fields: ['Clé publique (Public Key)', 'Clé secrète (Secret Key)', 'Clé de chiffrement (Encryption Key)'], desc: 'Mobile Money + cartes. Disponible dans 30+ pays africains.' },
  { id: 'paystack', name: 'Paystack', fields: ['Clé publique (Public Key)', 'Clé secrète (Secret Key)'], desc: 'Cartes + Mobile Money. Nigéria, Ghana, Afrique du Sud, Kenya.' },
  { id: 'orange', name: 'Orange Money', fields: ['Identifiant marchand', 'Clé API'], desc: "Orange Money marchand — CI, SN, ML, BF, CM." },
  { id: 'mtn', name: 'MTN MoMo', fields: ['ID abonnement (Subscription ID)', 'Clé API (API Key)'], desc: 'MTN Mobile Money API — CI, GH, UG, CM, RW.' },
  { id: 'cinetpay', name: 'CinetPay', fields: ['ID marchand (Merchant ID)', 'Clé API (API Key)'], desc: 'Multi-Mobile Money — CI, SN, BJ, TG, BF.' },
  { id: 'stripe', name: 'Stripe', fields: ['Clé publique (Publishable Key)', 'Clé secrète (Secret Key)'], desc: 'Cartes internationales — clients hors Afrique.' },
  { id: 'paypal', name: 'PayPal', fields: ['Client ID', 'Client Secret'], desc: 'Paiements PayPal — clients internationaux.' },
];

export default function Settings() {
  const [active, setActive] = useState('general');
  const [connected, setConnected] = useState<Record<string, boolean>>({ flutterwave: true });
  const [connecting, setConnecting] = useState<string | null>(null);
  const [gatewayForms, setGatewayForms] = useState<Record<string, Record<string, string>>>({});
  const [saved, setSaved] = useState(false);

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

  const startConnect = (gid: string) => {
    setConnecting(gid);
    setGatewayForms({ ...gatewayForms, [gid]: {} });
  };

  const cancelConnect = () => {
    setConnecting(null);
    setGatewayForms({ ...gatewayForms, [connecting!]: {} });
  };

  const testAndConnect = (gid: string) => {
    setConnected({ ...connected, [gid]: true });
    setConnecting(null);
  };

  const disconnect = (gid: string) => {
    setConnected({ ...connected, [gid]: false });
  };

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
          {saved && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              <Check size={16} /> Sauvegardé avec succès.
            </div>
          )}

          {active === 'general' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Informations boutique</h3>
              <div><label className="block text-sm font-medium mb-1">Nom</label><input defaultValue="Ma Boutique" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Email contact</label><input defaultValue="contact@maboutique.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Devise</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option>XOF</option><option>GHS</option><option>NGN</option><option>KES</option><option>ZAR</option></select></div>
                <div><label className="block text-sm font-medium mb-1">Fuseau horaire</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option>Africa/Abidjan</option><option>Africa/Lagos</option><option>Africa/Nairobi</option><option>Africa/Douala</option></select></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Pays</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg">{AFRICAN_COUNTRIES.map(c => <option key={c.code}>{c.flag} {c.name}</option>)}</select></div>
              <Button onClick={showSaved}>Sauvegarder</Button>
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
                <p className="text-sm text-gray-600">Prochaine facture : <strong>$9</strong> le 26 juillet 2026</p>
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
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div><p className="font-medium text-gray-900">Vous</p><p className="text-xs text-gray-500">Propriétaire</p></div>
                  <Badge color="orange">Propriétaire</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div><p className="font-medium text-gray-900">admin@maboutique.com</p><p className="text-xs text-gray-500">Admin</p></div>
                  <button className="text-red-600 text-sm hover:underline">Retirer</button>
                </div>
              </div>
              <Button variant="secondary"><Plus size={14} /> Inviter un utilisateur</Button>
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
              {GATEWAYS.map(g => (
                <div key={g.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium text-gray-900">{g.name}</p>
                      <p className="text-xs text-gray-500">{g.desc}</p>
                    </div>
                    {connected[g.id] ? (
                      <div className="flex items-center gap-2">
                        <Badge color="green"><Check size={10} /> Connecté</Badge>
                        <button onClick={() => disconnect(g.id)} className="text-red-600 text-xs hover:underline">Déconnecter</button>
                      </div>
                    ) : connecting === g.id ? (
                      <Button variant="ghost" size="sm" onClick={cancelConnect}><X size={14} /> Annuler</Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => startConnect(g.id)}>Connecter</Button>
                    )}
                  </div>
                  {connecting === g.id && (
                    <div className="p-3 border-t border-gray-100 bg-gray-50 space-y-2">
                      {g.fields.map(f => (
                        <div key={f}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{f}</label>
                          <input type="password" placeholder="••••••••••••" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" onChange={e => setGatewayForms({ ...gatewayForms, [g.id]: { ...gatewayForms[g.id], [f]: e.target.value } })} />
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={() => testAndConnect(g.id)}><Check size={14} /> Tester & connecter</Button>
                        <Button variant="ghost" size="sm" onClick={cancelConnect}>Annuler</Button>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1"><AlertCircle size={10} /> Un test de connexion sera effectué avant l'activation.</p>
                    </div>
                  )}
                </div>
              ))}
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
              <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                <div><p className="font-medium">Côte d'Ivoire</p><p className="text-xs text-gray-500">1 000 XOF · 2-3 jours</p></div>
                <Button variant="ghost" size="sm">Éditer</Button>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                <div><p className="font-medium">Sénégal</p><p className="text-xs text-gray-500">2 500 XOF · 3-5 jours</p></div>
                <Button variant="ghost" size="sm">Éditer</Button>
              </div>
              <Button variant="secondary" size="sm"><Plus size={14} /> Ajouter une zone</Button>
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
                <div><p className="font-medium">Abidjan — Cocody</p><p className="text-xs text-gray-500">Principal · 450 produits</p></div>
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
                  <div key={a} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium">{a}</span>
                    <Badge color="green">Actif</Badge>
                  </div>
                ))}
              </div>
              <Button variant="secondary" size="sm">Parcourir l'App Store</Button>
            </div>
          )}

          {active === 'channels' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Canaux de vente</h3>
              <div className="space-y-2">
                {['Boutique en ligne', 'Marketplace LiAfrikOS', 'Instagram Shop', 'Facebook Shop', 'WhatsApp Catalog'].map(ch => (
                  <div key={ch} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-sm font-medium">{ch}</span>
                    <Badge color="green">Connecté</Badge>
                  </div>
                ))}
              </div>
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
                <p className="text-xs text-gray-500 mt-1">Disponible avec le plan Premium. SSL automatique via Cloudflare Custom Hostnames.</p>
                <Button variant="secondary" size="sm" className="mt-2"><Plus size={14} /> Ajouter un domaine</Button>
              </div>
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
              <p className="text-sm text-gray-500">Données personnalisées pour vos produits, collections et clients.</p>
              <div className="space-y-2">
                <div className="p-3 border border-gray-200 rounded-lg"><p className="text-sm font-medium">product.taille_guide</p><p className="text-xs text-gray-500">Type: Texte · 12 produits</p></div>
                <div className="p-3 border border-gray-200 rounded-lg"><p className="text-sm font-medium">product.matiere</p><p className="text-xs text-gray-500">Type: Liste · 8 produits</p></div>
              </div>
              <Button variant="secondary" size="sm"><Plus size={14} /> Ajouter un metafield</Button>
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
