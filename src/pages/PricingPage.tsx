import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, Button } from '../pages/dashboard/ui';
import { CheckCircle2 } from 'lucide-react';
import { PLANS } from '../lib/constants';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-medium mb-4">
            <CheckCircle2 size={14} /> 0% de commission — pour toujours
          </div>
          <h1 className="font-serif-display text-4xl font-bold text-gray-900">Des tarifs simples et transparents</h1>
          <p className="mt-3 text-gray-600">7 jours d'essai gratuit inclus. Aucune carte bancaire requise.</p>

          {/* Monthly / Annual billing toggle selector with 15% discount badge */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
              Facturation Mensuelle
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
              className="relative w-14 h-7 bg-brand-600 rounded-full transition-colors focus:outline-none"
            >
              <span
                className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform ${
                  billingPeriod === 'annual' ? 'translate-x-7' : ''
                }`}
              />
            </button>
            <span className={`text-sm font-medium flex items-center gap-1.5 ${billingPeriod === 'annual' ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
              Facturation Annuelle
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                -15% de réduction
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map(p => {
            // Apply 15% discount for annual billing
            const currentPrice = billingPeriod === 'monthly' ? p.price : parseFloat((p.price * 0.85).toFixed(2));
            const yearlyTotal = (p.price * 12 * 0.85).toFixed(2);

            return (
              <Card key={p.id} className={`p-8 relative flex flex-col justify-between ${p.popular ? 'border-2 border-brand-500 shadow-xl' : 'border border-gray-100'}`}>
                <div>
                  {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-600 text-white text-xs font-semibold rounded-full">Le plus populaire</div>}
                  <h3 className="font-serif-display text-2xl font-bold">{p.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${currentPrice}</span>
                    <span className="text-gray-500">/mois</span>
                  </div>
                  {billingPeriod === 'annual' ? (
                    <p className="mt-1 text-xs text-brand-600 font-semibold">Facturé ${yearlyTotal}/an (économie de 15%)</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">ou ${p.annualPrice}/an (~2 mois offerts)</p>
                  )}
                  <ul className="mt-6 space-y-3 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-green-600 mt-0.5" /> {p.products === -1 ? 'Produits illimités' : `${p.products} produits`}</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-green-600 mt-0.5" /> {p.staff === -1 ? 'Staff illimité' : `${p.staff} staff`}</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-green-600 mt-0.5" /> {p.aiGenerations === -1 ? 'IA illimitée' : `${p.aiGenerations} générations IA/mois`}</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={16} className={p.customDomain ? 'text-green-600 mt-0.5' : 'text-gray-300 mt-0.5'} /> Domaine personnalisé</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={16} className={p.videoAI ? 'text-green-600 mt-0.5' : 'text-gray-300 mt-0.5'} /> Vidéos TikTok IA</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={16} className={p.chatbotAI ? 'text-green-600 mt-0.5' : 'text-gray-300 mt-0.5'} /> Chatbot IA</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={16} className={p.marketplaceListing ? 'text-green-600 mt-0.5' : 'text-gray-300 mt-0.5'} /> Marketplace Os</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={16} className={p.verifiedBadge ? 'text-green-600 mt-0.5' : 'text-gray-300 mt-0.5'} /> Badge vérifiée</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={16} className={p.apiAccess ? 'text-green-600 mt-0.5' : 'text-gray-300 mt-0.5'} /> API développeur</li>
                  </ul>
                </div>
                <Link to="/register" className={`mt-8 block text-center py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-95 ${p.popular ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>Commencer</Link>
              </Card>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
