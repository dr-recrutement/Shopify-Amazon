import { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, Upload, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

export default function IconLibraryManager() {
  const { user } = useAuth();
  const [icons, setIcons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('général');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('icon_library').select('*').order('category').order('name');
    setIcons(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const upload = async (file) => {
    if (!file || !name.trim()) { alert("Donne un nom à l'icône avant de la téléverser."); return; }
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
      const path = `icon-library/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      const { error: insertError } = await supabase.from('icon_library').insert({ name: name.trim(), url: data.publicUrl, category: category.trim() || 'général' });
      if (insertError) throw insertError;
      setName('');
      await load();
    } catch (e) {
      alert(e.message || "Échec de l'ajout de l'icône");
    } finally { setUploading(false); }
  };

  const remove = async (icon) => {
    if (!confirm(`Retirer « ${icon.name} » de la bibliothèque ? Les icônes déjà utilisées dans des boutiques resteront affichées (l'URL reste valide), mais elle ne sera plus proposée pour de nouveaux choix.`)) return;
    const { error } = await supabase.from('icon_library').delete().eq('id', icon.id);
    if (error) { alert(error.message); return; }
    await supabase.from('platform_audit_log').insert({
      admin_id: user.id, admin_email: user.email, action: 'icon_removed',
      target_type: 'icon_library', target_id: icon.id, old_value: { name: icon.name, category: icon.category },
    });
    await load();
  };

  const grouped = icons.reduce((acc, ic) => { (acc[ic.category] = acc[ic.category] || []).push(ic); return acc; }, {});

  return (
    <div>
      <div className="flex items-center gap-2 mb-4"><ImageIcon className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Bibliothèque d'icônes</h2><span className="text-xs text-[#6D7175]">({icons.length})</span></div>
      <p className="text-xs text-[#6D7175] mb-4">Ces icônes sont proposées à tous les marchands dans le Theme Editor (garanties, atouts...), en plus de leur propre téléversement.</p>

      <div className="bg-white rounded-xl border border-[#E1E1E1] p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'icône (ex : Livraison rapide)" className="flex-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Catégorie" className="w-full sm:w-40 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" />
          <label className="flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-[#008060] rounded-lg px-4 py-2 cursor-pointer hover:bg-[#00694d] shrink-0">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Téléverser
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} disabled={uploading} />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#008060]" /></div>
      ) : icons.length === 0 ? (
        <p className="text-sm text-[#6D7175] text-center py-10">Bibliothèque vide — ajoute la première icône ci-dessus.</p>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-5">
            <p className="text-xs font-bold text-[#6D7175] uppercase tracking-wide mb-2">{cat}</p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {items.map((ic) => (
                <div key={ic.id} className="group relative aspect-square rounded-lg border border-[#E1E1E1] bg-white flex items-center justify-center p-2">
                  <img src={ic.url} alt={ic.name} className="w-full h-full object-contain" title={ic.name} />
                  <button onClick={() => remove(ic)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-[#E1E1E1] text-[#6D7175] hover:text-red-500 hover:border-red-300 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
