import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import CollectionForm from '@/components/admin/CollectionForm';
import {
  LayoutGrid, Loader2, ArrowLeft, AlertCircle, Plus, Pencil, Trash2, Image as ImageIcon,
} from 'lucide-react';

export default function Collections() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*, product_category_assignments(count)')
        .eq('tenant_id', store.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setCollections((data || []).map((row) => ({
        ...row,
        image: row.image_url,
        product_ids: [], // loaded on demand by CollectionForm when editing
        product_count: row.product_category_assignments?.[0]?.count || 0,
      })));
    } catch (e) {
      console.error('Failed to load collections:', e);
      setCollections([]);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const openEdit = async (c) => {
    const { data } = await supabase.from('product_category_assignments').select('product_id').eq('category_id', c.id);
    setEditing({ ...c, product_ids: (data || []).map((r) => r.product_id) });
    setFormOpen(true);
  };

  const remove = async (c) => {
    if (!confirm(`Supprimer la collection « ${c.name} » ?`)) return;
    const { error } = await supabase.from('product_categories').delete().eq('id', c.id);
    if (error) { alert(error.message); return; }
    setCollections((l) => l.filter((x) => x.id !== c.id));
  };

  if (storeLoading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Créez d'abord votre boutique</h1>
        <Link to="/store-setup" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#00694d] mt-3">Configurer ma boutique</Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F4F4F4]">
      <div className="sticky top-0 z-10 bg-white border-b border-[#E1E1E1] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="text-[#6D7175] hover:text-[#202223]"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-base font-bold text-[#202223] flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-[#008060]" /> Collections</h1>
            <p className="text-xs text-[#6D7175]">{store.name} · {collections.length} collection(s)</p>
          </div>
        </div>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-3 sm:px-4 py-2 rounded-md hover:bg-[#00694d] shrink-0">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>

      <div className="px-4 sm:px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-[#E1E1E1]">
            <LayoutGrid className="w-10 h-10 text-[#C9C9C9] mb-2" />
            <p className="text-sm font-medium text-[#202223]">Aucune collection</p>
            <p className="text-xs text-[#6D7175] mt-1 mb-4">Organisez vos produits par thème ou catégorie.</p>
            <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#00694d]"><Plus className="w-4 h-4" /> Créer une collection</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {collections.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden group hover:shadow-md transition">
                <div className="aspect-[4/3] bg-[#F4F4F4] overflow-hidden">
                  {c.image ? <img src={c.image} alt={c.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-[#C9C9C9]" /></div>}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-[#202223] truncate">{c.name}</p>
                  <p className="text-[11px] text-[#6D7175] mt-0.5">{c.product_count} produit(s)</p>
                  {c.description && <p className="text-xs text-[#6D7175] mt-1 line-clamp-2">{c.description}</p>}
                  <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openEdit(c)} className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium text-[#6D7175] border border-[#E1E1E1] rounded py-1 hover:bg-black/5"><Pencil className="w-3 h-3" /> Éditer</button>
                    <button onClick={() => remove(c)} className="flex items-center justify-center px-2 text-[#6D7175] border border-[#E1E1E1] rounded hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CollectionForm open={formOpen} onOpenChange={setFormOpen} store={store} collection={editing} onSaved={load} />
    </div>
  );
}