import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, Button } from '../pages/dashboard/ui';
import { MapPin, ShoppingBag, ArrowRight } from 'lucide-react';
import { useSeo } from '../lib/seo';
import { supabase } from '../lib/supabase';
import { GLOBAL_COUNTRIES } from '../lib/constants';

const CATEGORIES = ['Tous', 'Mode & vêtements', 'High-tech & électronique', 'Restauration', 'Pharmacie & santé', 'Artisanat', 'Beauté & cosmétiques', 'Services', 'Grossiste', 'Créateur de contenu'];

interface PublicShop {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  sector: string | null;
}

export default function MarketplacePage() {
  useSeo({ title: 'Marketplace', description: 'Découvrez les boutiques et produits vendus par les marchands Sellia à travers le monde.' });
  const [shops, setShops] = useState<PublicShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Tous');

  useEffect(() => {
    // Real, published tenants only (tenants.slug IS NOT NULL is the same
    // "live storefront" signal the sitemap and storefront resolver use) —
    // publicly readable via RLS (public_select_published_tenants), no
    // fabricated showcase shops.
    supabase.from('tenants').select('id,name,slug,country,sector').not('slug', 'is', null).then(({ data }) => {
      if (data) setShops(data as PublicShop[]);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => category === 'Tous' ? shops : shops.filter(s => s.sector === category), [shops, category]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="text-center mb-12">
          <h1 className="font-serif-display text-4xl font-bold text-gray-900">Marketplace mondiale</h1>
          <p className="mt-3 text-gray-600">Découvrez les boutiques Sellia publiées, partout dans le monde.</p>
        </div>
        <div className="flex gap-2 mb-6 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${category === c ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="aspect-[4/3] bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingBag size={32} className="text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900">{shops.length === 0 ? 'Aucune boutique publiée pour le moment' : 'Aucune boutique dans cette catégorie'}</h3>
            <p className="text-sm text-gray-500 mt-1">{shops.length === 0 ? 'Les boutiques apparaîtront ici dès qu\'elles seront publiées.' : 'Essayez une autre catégorie.'}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(s => {
              const countryInfo = GLOBAL_COUNTRIES.find(c => c.code === s.country);
              return (
                <Card key={s.id} className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className="aspect-[4/3] bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center">
                    <ShoppingBag size={40} className="text-brand-600" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-1">{s.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      {countryInfo && <span className="flex items-center gap-1"><MapPin size={12} /> {countryInfo.flag} {countryInfo.name}</span>}
                      {s.sector && <span>{s.sector}</span>}
                    </div>
                    <Link to={`/s/${s.slug}`}>
                      <Button variant="secondary" size="sm" className="w-full">Visiter <ArrowRight size={14} /></Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
