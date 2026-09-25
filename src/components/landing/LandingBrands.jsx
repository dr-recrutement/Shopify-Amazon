import { Link } from 'react-router-dom';
import { Smartphone, Monitor, ArrowRight } from 'lucide-react';

// Example boutiques built with Sellia — many categories & industries.
const STORES = [
  { name: 'Mode Wax Dakar', category: 'Mode & Textile', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80', color: '#1A1A1A' },
  { name: 'TechZone', category: 'Electronique', image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80', color: '#0F172A' },
  { name: 'Glow Beauty', category: 'Beaute & Cosmetiques', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80', color: '#831843' },
  { name: 'Maison Doree', category: 'Bijoux & Accessoires', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80', color: '#78350F' },
  { name: 'SneakerHub', category: 'Chaussures & Sport', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', color: '#0C4A6E' },
  { name: 'Casa Living', category: 'Maison & Deco', image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80', color: '#3F3F46' },
  { name: 'Cafe du Marche', category: 'Epicerie & Boissons', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80', color: '#451A03' },
  { name: 'Librairie Lumiere', category: 'Livres & Culture', image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&q=80', color: '#1E293B' },
  { name: 'Saveurs d Afrique', category: 'Restaurant & Food', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80', color: '#7C2D12' },
  { name: 'Green Garden', category: 'Jardinerie & Plantes', image: 'https://images.unsplash.com/photo-1485955903006-788a8911ad6c?w=600&q=80', color: '#166534' },
  { name: 'FitZone', category: 'Sport & Fitness', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80', color: '#1E3A8A' },
  { name: 'BabySoft', category: 'Puericulture & Bebe', image: 'https://images.unsplash.com/photo-1522771930-9458d0058179?w=600&q=80', color: '#9D174D' },
];

function StoreCard({ store }) {
  return (
    <div className="snap-start shrink-0 w-44 sm:w-52 bg-white rounded-xl border border-[#E6E9EF] shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#EEF1F6] bg-[#FBFCFE]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-2 flex-1 truncate text-[10px] font-mono text-[#9AA5B5]">sellia.liafrik.com/store/{store.name.toLowerCase().replace(/\s/g, '-')}</span>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wide text-white px-2 py-0.5 rounded-full" style={{ background: store.color }}>{store.category}</span>
      </div>
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-[#202223] truncate">{store.name}</p>
        <span className="text-[9px] font-semibold text-[#008060] bg-[#008060]/10 px-1.5 py-0.5 rounded-full shrink-0">Sellia</span>
      </div>
    </div>
  );
}

export default function LandingBrands() {
  const loop = [...STORES, ...STORES];
  return (
    <section id="marques" className="py-20 lg:py-24 bg-[#F5F7FA] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h2 className="font-landing font-semibold text-2xl sm:text-[2rem] text-[#000000] tracking-tight leading-tight">
            Des solutions infinies pour chaque type de marque.
          </h2>
          <p className="mt-3 text-[#2D3A56] text-base sm:text-lg leading-relaxed">
            Lancez-vous rapidement avec l'essentiel, ou intégrez, créez et passez à l'échelle sur notre plateforme ouverte — choisie par des marques en B2C comme en B2B.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6 text-[#6D7175]">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold"><Monitor className="w-4 h-4" /> Desktop</span>
          <span className="w-px h-4 bg-[#D6DBE3]" />
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold"><Smartphone className="w-4 h-4" /> Mobile</span>
          <span className="hidden sm:inline w-px h-4 bg-[#D6DBE3]" />
          <span className="hidden sm:inline text-xs font-medium text-[#6D7175]">Défilement automatique · 12 catégories</span>
        </div>
      </div>

      {/* Auto-scrolling marquee — responsive card widths */}
      <div className="relative">
        <div className="flex gap-4 sm:gap-5 w-max animate-scroll-x hover:[animation-play-state:paused]">
          {loop.map((s, i) => (
            <StoreCard key={i} store={s} />
          ))}
        </div>
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#F5F7FA] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#F5F7FA] to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 text-center">
        <Link to="/register" className="inline-flex items-center gap-2 bg-[#008060] text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-[#00694d] transition shadow-lg shadow-[#008060]/20">
          Lancez votre boutique <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="mt-3 text-xs text-[#6D7175]">Boutiques 100% responsives — desktop & mobile, paramétrables indépendamment.</p>
      </div>
    </section>
  );
}