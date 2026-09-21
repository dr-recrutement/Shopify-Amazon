import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { Monitor, Smartphone, ExternalLink, Loader2, Store, ArrowLeft } from 'lucide-react';

export default function StorePreview() {
  const { store, loading } = useCurrentStore();
  const [device, setDevice] = useState('desktop');

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center px-4">
        <Store className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Créez votre boutique</h1>
        <Link to="/store-setup" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-3">Configurer ma boutique</Link>
      </div>
    );
  }

  const url = store.slug ? `${window.location.origin}/store/${store.slug}` : '';
  const isMobile = device === 'mobile';

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Link to="/dashboard" className="text-[#6D7175] hover:text-[#202223]"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold text-[#202223]">Aperçu de la boutique</h1>
      </div>

      {!url ? (
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-10 text-center">
          <Store className="w-8 h-8 text-[#C9C9C9] mx-auto mb-2" />
          <p className="text-sm text-[#202223] font-medium">Aucun slug défini pour cette boutique.</p>
          <Link to="/store-settings" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-[#008060] hover:underline">Configurer le slug</Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="inline-flex rounded-full border border-[#E1E1E1] bg-white p-1">
              <button onClick={() => setDevice('desktop')} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition ${!isMobile ? 'bg-[#008060] text-white' : 'text-[#6D7175]'}`}><Monitor className="w-3.5 h-3.5" /> Bureau</button>
              <button onClick={() => setDevice('mobile')} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition ${isMobile ? 'bg-[#008060] text-white' : 'text-[#6D7175]'}`}><Smartphone className="w-3.5 h-3.5" /> Mobile</button>
            </div>
            <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-[#008060] hover:underline"><ExternalLink className="w-3.5 h-3.5" /> Ouvrir</a>
          </div>

          <div className={`mx-auto transition-all ${isMobile ? 'w-[390px] max-w-full' : 'w-full'}`}>
            <div className={`bg-white rounded-2xl border border-[#E1E1E1] overflow-hidden shadow-sm ${isMobile ? 'rounded-[2rem] border-[8px] border-[#0A0A0A]' : ''}`}>
              <div className={`${isMobile ? 'h-6 bg-[#0A0A0A]' : 'hidden'} flex items-center justify-center`}><div className="w-20 h-4 bg-[#0A0A0A] rounded-b-xl" /></div>
              <iframe src={url} title="Aperçu boutique" className="w-full" style={{ height: isMobile ? '72vh' : '78vh', border: 'none' }} />
            </div>
            <p className="text-center text-xs text-[#6D7175] mt-3 truncate">{url}</p>
          </div>
        </>
      )}
    </div>
  );
}