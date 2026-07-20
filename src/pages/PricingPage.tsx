import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, Button } from '../pages/dashboard/ui';
import { CheckCircle2 } from 'lucide-react';
import { PLANS } from '../lib/constants';
import { Link } from 'react-router-dom';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
            <CheckCircle2 size={14} /> 0% de commission — pour toujours
          </div>
          <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">Des tarifs simples et transparents</h1>
          <p className="mt-3 text-gray-600">7 jours d'essai gratuit inclus. Aucune carte bancaire requise.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map(p => (
            <Card key={p.id} className={`p-8 relative ${p.popular ? 'border-2 border-orange-500 shadow-xl' : 'border border-gray-100'}`}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-600 text-white text-xs font-semibold rounded-full">Le plus populaire</div>}
              <h3 className="font-serif-display text-2xl font-semibold">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold">${p.price}</span><span className="text-gray-500">/mois</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">ou ${p.annualPrice}/an (-2 mois)</p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-green-600 mt-0.5" /> {p.products === -1 ? 'Produits illimités' : `${p.products} produits`}</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-green-600 mt-0.5" /> {p.staff === -1 ? 'Staff illimité' : `${p.staff} staff`}</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-green-600 mt-0.5" /> {p.aiGenerations === -1 ? 'IA illimitée' : `${p.aiGenerations} générations IA/mois`}</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className={p.customDomain ? 'text-green-600 mt-0.5' : 'text-gray-300 mt-0.5'} /> Domaine personnalisé</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className={p.videoAI ? 'text-green-600 mt-0.5' : 'text-gray-300 mt-0.5'} /> Vidéos TikTok IA</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className={p.chatbotAI ? 'text-green-600 mt-0.5' : 'text-gray-300 mt-0.5'} /> Chatbot IA</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className={p.marketplaceListing ? 'text-green-600 mt-0.5' : 'text-gray-300 mt-0.5'} /> Marketplace LiAfrikOS</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className={p.verifiedBadge ? 'text-green-600 mt-0.5' : 'text-gray-300 mt-0.5'} /> Badge vérifiée</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className={p.apiAccess ? 'text-green-600 mt-0.5' : 'text-gray-300 mt-0.5'} /> API développeur</li>
              </ul>
              <Link to="/register" className={`mt-8 block text-center py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-95 ${p.popular ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>Commencer</Link>
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
