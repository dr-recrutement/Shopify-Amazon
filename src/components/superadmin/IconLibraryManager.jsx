import { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, Upload, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

// Turns a filename like "fast-delivery_icon (2).svg" into a readable
// default name ("Fast delivery icon 2") - used when bulk-uploading, where
// typing one name per file would defeat the point of "bulk".
function nameFromFilename(filename) {
  const base = filename.replace(/\.[^.]+$/, '');
  const cleaned = base.replace(/[-_]+/g, ' ').replace(/[()]/g, '').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export default function IconLibraryManager() {
  const { user } = useAuth();
  const [icons, setIcons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('général');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('icon_library').select('*').order('category').order('name');
    setIcons(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const uploadOne = async (file, iconName) => {
    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const path = `icon-library/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    const { error: insertError } = await supabase.from('icon_library').insert({ name: iconName, url: data.publicUrl, category: category.trim() || 'général' });
    if (insertError) throw insertError;
  };

  // A single file keeps the typed name as-is (matches the previous
  // behavior exactly); several files at once each get their own name
  // derived from their filename - typing one name for a batch of icons
  // wouldn't make sense, and forcing one-at-a-time defeats "bulk" entirely.
  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    if (files.length === 1 && !name.trim()) { alert("Donne un nom à l'icône avant de la téléverser, ou sélectionne plusieurs fichiers pour un chargement en masse (le nom sera déduit de chaque fichier)."); return; }
    setUploading(true);
    setProgress({ done: 0, total: files.length });
    const failed = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const iconName = files.length === 1 ? name.trim() : nameFromFilename(file.name);
      try {
        await uploadOne(file, iconName);
      } catch (e) {
        failed.push(`${file.name} (${e.message})`);
      }
      setProgress({ done: i + 1, total: files.length });
    }
    setName('');
    setUploading(false);
    setProgress(null);
    await load();
    if (failed.length > 0) alert(`${failed.length} icône(s) n'ont pas pu être ajoutées :\n${failed.join('\n')}`);
  };

  const rename = async (icon, newName) => {
    const { error } = await supabase.from('icon_library').update({ name: newName }).eq('id', icon.id);
    if (error) { alert(error.message); return; }
    await load();
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
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom (pour 1 seule icône)" className="flex-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Catégorie" className="w-full sm:w-40 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" />
          <label className="flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-[#008060] rounded-lg px-4 py-2 cursor-pointer hover:bg-[#00694d] shrink-0">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {uploading && progress ? `${progress.done}/${progress.total}` : 'Téléverser'}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { uploadFiles(e.target.files); e.target.value = ''; }} disabled={uploading} />
          </label>
        </div>
        <p className="text-[10px] text-[#6D7175] mt-2">Sélectionnez plusieurs fichiers à la fois pour un chargement en masse — le nom de chaque icône sera déduit automatiquement de son nom de fichier (renommable ensuite si besoin). La catégorie choisie s'applique à tout le lot.</p>
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
                  <button
                    onClick={() => {
                      const next = prompt('Renommer cette icône :', ic.name);
                      if (next && next.trim() && next.trim() !== ic.name) rename(ic, next.trim());
                    }}
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-end justify-center pb-0.5 transition"
                    title="Cliquer pour renommer"
                  >
                    <span className="text-[8px] bg-black/60 text-white px-1 rounded truncate max-w-full">{ic.name}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
