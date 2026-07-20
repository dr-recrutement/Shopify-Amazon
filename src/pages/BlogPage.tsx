import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Calendar, Tag, ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';

const ARTICLES = [
  { id: 1, title: 'Comment vendre sur WhatsApp Business en Afrique', category: 'Marketing', date: '15 Jul 2026', excerpt: "WhatsApp est le canal de vente n°1 en Afrique. Voici comment exploiter WhatsApp Business pour transformer vos conversations en ventes.", readTime: '8 min' },
  { id: 2, title: 'Mobile Money : guide complet pour vendeurs africains', category: 'Paiements', date: '12 Jul 2026', excerpt: 'Flutterwave, Paystack, Orange Money, MTN MoMo — quelles différences, comment choisir, comment configurer.', readTime: '12 min' },
  { id: 3, title: '5 stratégies marketing pour le marché africain', category: 'Marketing', date: '10 Jul 2026', excerpt: "Du bouche-à-oreille digital aux influenceurs locaux, les stratégies qui fonctionnent vraiment sur le continent.", readTime: '10 min' },
  { id: 4, title: 'Gérer ses stocks en mode informel', category: 'Gestion', date: '08 Jul 2026', excerpt: "Vendre en ligne ne signifie pas avoir un entrepôt. Comment gérer ses stocks quand on part de chez soi.", readTime: '7 min' },
  { id: 5, title: 'L\'IA au service du vendeur africain', category: 'IA', date: '05 Jul 2026', excerpt: "Descriptions produits, logos, publicités, chatbot — comment l'IA LiAfrikOS vous fait gagner 10h par semaine.", readTime: '9 min' },
  { id: 6, title: 'Livraison en Afrique : solutions et bonnes pratiques', category: 'Logistique', date: '02 Jul 2026', excerpt: "Moto-taxi, coursier, transporteur, point relais — comment organiser une livraison fiable sans budget énorme.", readTime: '11 min' },
];

const CATEGORIES = ['Tous', 'Marketing', 'Paiements', 'Gestion', 'IA', 'Logistique'];

export default function BlogPage() {
  const [cat, setCat] = useState('Tous');
  const [q, setQ] = useState('');
  const filtered = ARTICLES.filter(a => (cat === 'Tous' || a.category === cat) && (a.title.toLowerCase().includes(q.toLowerCase()) || a.excerpt.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">Blog LiAfrikOS</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Tendances e-commerce africain, success stories, conseils marketing et guides pratiques.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${cat === c ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{c}</button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(a => (
            <article key={a.id} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
              <div className="aspect-[16/9] bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                <Tag size={32} className="text-orange-300" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">{a.category}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {a.date}</span>
                  <span>· {a.readTime}</span>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">{a.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{a.excerpt}</p>
                <button className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:underline">
                  Lire l'article <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </article>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-500 py-12">Aucun article trouvé.</p>}
      </div>
      <Footer />
    </div>
  );
}
