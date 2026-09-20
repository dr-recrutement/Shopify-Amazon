import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { THEMES } from '@/lib/themes';
import ThemePreview from '@/components/theme/ThemePreview';

const CATEGORIES = ['Tous', 'E-commerce', 'Marketplace', 'Business', 'Blog', 'Portfolio', 'Restaurant'];

export default function ThemeGallery() {
  const navigate = useNavigate();
  const [active, setActive] = useState('Tous');
  const [applied, setApplied] = useState(() => localStorage.getItem('sellia_theme') || 'aurora');

  const list = active === 'Tous' ? THEMES : THEMES.filter((t) => t.category === active);

  const apply = (id) => {
    localStorage.setItem('sellia_theme', id);
    localStorage.removeItem('sellia_theme_custom');
    setApplied(id);
    setTimeout(() => navigate('/theme-editor'), 350);
  };

  return (
    <div className="min-h-full bg-[#F4F4F4]">
      <div className="sticky top-0 z-10 bg-white border-b border-[#E1E1E1] px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-[#6D7175] hover:text-[#202223]"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-base font-bold text-[#202223] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#008060]" /> Bibliothèque de thèmes</h1>
            <p className="text-xs text-[#6D7175]">Choisissez un point de départ premium, puis personnalisez-le dans l'éditeur.</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-5">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActive(cat)} className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${active === cat ? 'bg-[#202223] text-white' : 'bg-white text-[#202223] border border-[#E1E1E1] hover:bg-black/5'}`}>{cat}</button>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {list.map((t) => {
          const isApplied = applied === t.id;
          return (
            <div key={t.id} className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden shadow-sm hover:shadow-lg transition hover:-translate-y-0.5 flex flex-col">
              <div className="border-b border-[#E1E1E1] bg-[#F4F4F4]">
                <ThemePreview theme={t} />
              </div>
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#202223]">{t.name}</h3>
                    <span className="text-[10px] font-semibold bg-[#008060]/10 text-[#008060] px-2 py-0.5 rounded-full">{t.category}</span>
                    {isApplied && <span className="text-[10px] font-semibold bg-[#202223] text-white px-2 py-0.5 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Actif</span>}
                  </div>
                  <p className="text-xs text-[#6D7175] mt-1">{t.description}</p>
                </div>
                <button onClick={() => apply(t.id)} className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-md whitespace-nowrap ${isApplied ? 'bg-[#E1E1E1] text-[#6D7175] cursor-default' : 'bg-[#008060] text-white hover:bg-[#00694d]'}`}>
                  {isApplied ? 'Utilisé' : 'Utiliser ce thème'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}