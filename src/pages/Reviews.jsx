import { useState, useEffect, useCallback, useMemo } from 'react';
import { Star, Check, X, Trash2, Loader2, Search, MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';

function Stars({ n }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map((i) => <Star key={i} className={`w-3.5 h-3.5 ${i <= n ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />)}</div>;
}

export default function Reviews() {
  const { store, loading } = useCurrentStore();
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    if (!store?.id) return;
    setReviews(await base44.entities.Review.filter({ store_id: store.id }, '-created_date', 500));
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => reviews.filter((r) => {
    const m = !search || r.customer_name?.toLowerCase().includes(search.toLowerCase()) || r.product_title?.toLowerCase().includes(search.toLowerCase()) || r.body?.toLowerCase().includes(search.toLowerCase());
    const f = filter === 'all' ? true : r.status === filter;
    return m && f;
  }), [reviews, search, filter]);

  const setStatus = async (id, status) => { await base44.entities.Review.update(id, { status }); await load(); };
  const remove = async (id) => { if (confirm('Supprimer cet avis ?')) { await base44.entities.Review.delete(id); await load(); } };

  const stats = useMemo(() => ({
    pending: reviews.filter((r) => r.status === 'pending').length,
    approved: reviews.filter((r) => r.status === 'approved').length,
    avg: reviews.filter((r) => r.status === 'approved').length ? (reviews.filter((r) => r.status === 'approved').reduce((s, r) => s + r.rating, 0) / reviews.filter((r) => r.status === 'approved').length).toFixed(1) : '—',
  }), [reviews]);

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-[#6D7175]" />
        <h1 className="text-xl font-bold text-[#202223]">Avis clients</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4 text-center"><p className="text-2xl font-bold text-[#202223]">{stats.avg}</p><Stars n={Math.round(Number(stats.avg) || 0)} /><p className="text-xs text-[#6D7175] mt-1">Note moyenne</p></div>
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4 text-center"><p className="text-2xl font-bold text-amber-500">{stats.pending}</p><p className="text-xs text-[#6D7175] mt-1">En attente</p></div>
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4 text-center"><p className="text-2xl font-bold text-[#008060]">{stats.approved}</p><p className="text-xs text-[#6D7175] mt-1">Approuvés</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-[#E1E1E1] rounded-lg px-3 py-2 flex-1"><Search className="w-4 h-4 text-[#6D7175]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un avis" className="outline-none text-sm w-full" /></div>
        <div className="flex gap-2">
          {[['all', 'Tous'], ['pending', 'En attente'], ['approved', 'Approuvés'], ['rejected', 'Rejetés']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`text-xs font-semibold px-3 py-2 rounded-full transition ${filter === k ? 'bg-[#008060] text-white' : 'bg-white border border-[#E1E1E1] text-[#6D7175] hover:bg-black/5'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E1E1E1] p-10 text-center"><Star className="w-10 h-10 text-[#C9C9C9] mx-auto mb-3" /><p className="text-sm text-[#6D7175]">Aucun avis pour le moment.</p></div>
        ) : filtered.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-[#E1E1E1] p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap"><Stars n={r.rating} /><p className="text-sm font-bold text-[#202223]">{r.customer_name}</p><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'approved' ? 'bg-[#008060]/10 text-[#008060]' : r.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>{r.status}</span></div>
                {r.product_title && <p className="text-xs text-[#6D7175] mt-0.5">Produit : {r.product_title}</p>}
                {r.title && <p className="text-sm font-semibold text-[#202223] mt-2">{r.title}</p>}
                <p className="text-sm text-[#6D7175] mt-1">{r.body}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {r.status !== 'approved' && <button onClick={() => setStatus(r.id, 'approved')} title="Approuver" className="w-8 h-8 rounded-md border border-[#E1E1E1] flex items-center justify-center text-[#008060] hover:bg-[#008060]/10"><Check className="w-4 h-4" /></button>}
                {r.status !== 'rejected' && <button onClick={() => setStatus(r.id, 'rejected')} title="Rejeter" className="w-8 h-8 rounded-md border border-[#E1E1E1] flex items-center justify-center text-amber-600 hover:bg-amber-50"><X className="w-4 h-4" /></button>}
                <button onClick={() => remove(r.id)} title="Supprimer" className="w-8 h-8 rounded-md border border-[#E1E1E1] flex items-center justify-center text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}