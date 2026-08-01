import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { HelpCircle, Search, ChevronDown, Mail, MessageSquare, BookOpen, ShoppingBag, CreditCard, Truck, Settings } from 'lucide-react';
import { useState } from 'react';

const CATEGORIES = [
  { icon: ShoppingBag, name: 'Boutique & Produits', count: 8 },
  { icon: CreditCard, name: 'Paiements & Mobile Money', count: 12 },
  { icon: Truck, name: 'Livraison & Logistique', count: 6 },
  { icon: Settings, name: 'Compte & Paramètres', count: 10 },
  { icon: BookOpen, name: 'Marketing & Croissance', count: 9 },
  { icon: HelpCircle, name: 'Autres questions', count: 5 },
];

const FAQS = [
  { cat: 'Boutique & Produits', q: 'Comment ajouter mon premier produit ?', a: 'Allez dans Dashboard > Produits > Ajouter. Remplissez le nom, le prix, ajoutez des photos. L\'IA peut générer la description automatiquement.' },
  { cat: 'Boutique & Produits', q: 'Puis-je vendre sans stock ?', a: 'Oui. Vous pouvez prendre des commandes et les expédier ensuite, ou utiliser le modèle de précommande. Le module Markets permet aussi de gérer la disponibilité par région.' },
  { cat: 'Paiements & Mobile Money', q: 'Comment configurer Flutterwave ?', a: 'Dashboard > Paramètres > Payments > Ajouter une passerelle. Sélectionnez Flutterwave, entrez votre clé API secrète et votre clé publique. Les paiements arrivent directement sur votre compte Flutterwave.' },
  { cat: 'Paiements & Mobile Money', q: 'Combien de temps pour recevoir mon argent ?', a: 'Cela dépend de la passerelle. Flutterwave et Paystack virent en 24-48h. Orange Money et MTN MoMo sont instantanés. Stripe prend 2-7 jours selon votre pays.' },
  { cat: 'Paiements & Mobile Money', q: 'OS prend-il une commission ?', a: 'Non. Jamais. Aucune commission sur vos ventes, quel que soit votre plan. L\'argent va directement dans votre compte.' },
  { cat: 'Livraison & Logistique', q: 'Comment gérer la livraison ?', a: 'OS supporte la livraison flexible : moto-taxi, coursier, transporteur, point relais. Configurez vos zones et frais dans Paramètres > Shipping.' },
  { cat: 'Compte & Paramètres', q: 'Comment changer ma devise ?', a: 'Paramètres > General > Devise principale. La devise est initialement déduite de votre pays à l\'onboarding. Vous pouvez la changer, avec conversion indicative de vos prix.' },
  { cat: 'Compte & Paramètres', q: 'Puis-je avoir plusieurs boutiques ?', a: 'Oui, avec les plans Premium et Entreprise. Chaque boutique a son propre sous-domaine, son panier isolé et son thème.' },
  { cat: 'Marketing & Croissance', q: 'Comment utiliser le chatbot IA ?', a: 'Dashboard > Agentic > Chatbot vendeur. Activez-le, configurez vos FAQ, et le chatbot répondra vos clients 24/7 sur WhatsApp, Messenger et Telegram.' },
  { cat: 'Marketing & Croissance', q: 'Comment créer une campagne WhatsApp ?', a: 'Dashboard > Marketing > Créer une campagne. Sélectionnez le canal WhatsApp, votre audience, rédigez le message (ou utilisez l\'IA), et envoyez ou programmez.' },
];

export default function HelpPage() {
  const [q, setQ] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCat, setActiveCat] = useState('Tous');

  const filtered = FAQS.filter(f => (activeCat === 'Tous' || f.cat === activeCat) && (f.q.toLowerCase().includes(q.toLowerCase()) || f.a.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">Centre d'aide</h1>
          <p className="mt-4 text-lg text-gray-600">Trouvez rapidement une réponse à vos questions.</p>
        </div>

        <div className="relative max-w-xl mx-auto mb-12">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher dans l'aide..." className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            return (
              <button key={c.name} onClick={() => setActiveCat(c.name)} className={`p-4 rounded-xl border-2 transition-all text-center ${activeCat === c.name ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-300'}`}>
                <Icon size={20} className={`mx-auto mb-2 ${activeCat === c.name ? 'text-orange-600' : 'text-gray-400'}`} />
                <div className="text-xs font-medium text-gray-900">{c.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{c.count} articles</div>
              </button>
            );
          })}
        </div>

        {activeCat !== 'Tous' && (
          <button onClick={() => setActiveCat('Tous')} className="mb-4 text-sm text-orange-600 hover:underline">← Toutes les catégories</button>
        )}

        <div className="space-y-3">
          {filtered.map((f, i) => (
            <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50">
                <span className="font-medium text-gray-900 text-sm">{f.q}</span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{f.a}</div>
              )}
            </div>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-500 py-8">Aucun résultat. Contactez le support.</p>}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-orange-50 rounded-2xl">
            <Mail className="text-orange-600 mb-3" size={24} />
            <h3 className="font-semibold text-gray-900">Email</h3>
            <p className="text-sm text-gray-600 mt-1">support@liafrik.com</p>
            <p className="text-sm text-gray-600">cs@liafrik.com</p>
            <p className="text-xs text-gray-500 mt-1">Réponse sous 24h</p>
          </div>
          <div className="p-6 bg-green-50 rounded-2xl">
            <MessageSquare className="text-green-600 mb-3" size={24} />
            <h3 className="font-semibold text-gray-900">Chat en direct</h3>
            <p className="text-sm text-gray-600 mt-1">Disponible selon votre plan</p>
            <p className="text-xs text-gray-500 mt-1">Starter: email · Premium: prioritaire · Entreprise: dédié + WhatsApp</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
