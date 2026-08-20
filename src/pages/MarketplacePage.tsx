import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, Button } from '../pages/dashboard/ui';
import { Star, MapPin, ShoppingBag, ArrowRight } from 'lucide-react';


const shops = [
  { name: 'Boutique Aïcha', country: '🇨🇮 Côte d\'Ivoire', category: 'Mode', rating: 4.8, products: 124, verified: true },
  { name: 'Accra Tech Hub', country: '🇬🇭 Ghana', category: 'High-tech', rating: 4.9, products: 89, verified: true },
  { name: 'Fatou Couture', country: '🇸🇳 Sénégal', category: 'Mode', rating: 4.7, products: 56, verified: false },
  { name: 'Lagos Beauty', country: '🇳🇬 Nigeria', category: 'Beauté', rating: 4.9, products: 203, verified: true },
  { name: 'Cairo Electronics', country: '🇪🇬 Égypte', category: 'High-tech', rating: 4.6, products: 145, verified: true },
  { name: 'Nairobi Crafts', country: '🇰🇪 Kenya', category: 'Artisanat', rating: 4.8, products: 78, verified: false },
];

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="text-center mb-12">
          <h1 className="font-serif-display text-4xl font-bold text-gray-900">Marketplace mondiale</h1>
          <p className="mt-3 text-gray-600">Découvrez des milliers de boutiques vérifiées, partout dans le monde.</p>
        </div>
        <div className="flex gap-2 mb-6 flex-wrap">
          {['Tous', 'Mode', 'High-tech', 'Beauté', 'Artisanat', 'Restauration', 'Services'].map((c, i) => (
            <button key={c} className={`px-4 py-2 rounded-lg text-sm font-medium ${i === 0 ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}>{c}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map(s => (
            <Card key={s.name} className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
              <div className="aspect-[4/3] bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center">
                <ShoppingBag size={40} className="text-brand-600" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  {s.verified && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">✓ Vérifiée</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {s.country}</span>
                  <span className="flex items-center gap-1"><Star size={12} className="text-brand-500" fill="currentColor" /> {s.rating}</span>
                  <span>{s.products} produits</span>
                </div>
                <Button variant="secondary" size="sm" className="w-full">Visiter <ArrowRight size={14} /></Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
