import { useState, useEffect, useCallback, useRef } from 'react';
import { Image as ImageIcon, Upload, Trash2, Search, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';

const BUCKET = 'product-images';

// No dedicated media table exists (mediafile is a legacy/Base44-export-only
// table with no RLS wired for this app). Storage itself already tracks
// what's needed (name, size, mimetype, created_at) - so this lists real
// bucket contents under a per-tenant prefix instead of a separate ledger
// that could drift from what's actually there.
export default function MediaLibrary() {
  const { store, loading } = useCurrentStore();
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);

  const prefix = store?.id ? `media/${store.id}` : null;

  const load = useCallback(async () => {
    if (!prefix) return;
    setFilesLoading(true);
    try {
      const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw error;
      const withUrls = (data || []).filter((f) => f.id).map((f) => {
        const path = `${prefix}/${f.name}`;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const mime = f.metadata?.mimetype || '';
        return { path, name: f.name, url: pub.publicUrl, size: f.metadata?.size, type: mime.startsWith('video') ? 'video' : mime.startsWith('image') ? 'image' : 'document' };
      });
      setFiles(withUrls);
    } catch (e) {
      console.error('Failed to load media library:', e);
      setFiles([]);
    } finally { setFilesLoading(false); }
  }, [prefix]);

  useEffect(() => { load(); }, [load]);

  const upload = async (fileList) => {
    if (!fileList?.length || !prefix) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${safeName || 'file.' + ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
        if (error) throw error;
      }
      await load();
    } catch (e) {
      alert(e.message || "Échec du téléversement");
    } finally { setUploading(false); }
  };

  const remove = async (f) => {
    if (!confirm('Supprimer ce fichier ?')) return;
    const { error } = await supabase.storage.from(BUCKET).remove([f.path]);
    if (error) { alert(error.message); return; }
    setFiles((l) => l.filter((x) => x.path !== f.path));
  };
  const copyUrl = (url, path) => { navigator.clipboard.writeText(url); setCopied(path); setTimeout(() => setCopied(null), 1500); };

  const filtered = files.filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  if (loading || filesLoading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6"><ImageIcon className="w-5 h-5 text-[#6D7175]" /><h1 className="text-xl font-bold text-[#202223]">Banque de médias</h1></div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={`mb-5 rounded-2xl border-2 border-dashed cursor-pointer transition py-8 flex flex-col items-center justify-center gap-2 ${drag ? 'border-[#008060] bg-[#008060]/5' : 'border-[#E1E1E1] hover:border-[#008060]/50'}`}
      >
        {uploading ? <><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /><p className="text-sm font-semibold text-[#008060]">Téléversement…</p></> : <><Upload className="w-7 h-7 text-[#6D7175]" /><p className="text-sm font-semibold text-[#202223]">Glissez vos images ou vidéos ici</p><p className="text-xs text-[#6D7175]">ou cliquez pour parcourir · PNG · JPG · WEBP · MP4</p></>}
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
      </div>

      <div className="flex items-center gap-2 bg-white border border-[#E1E1E1] rounded-lg px-3 py-2 mb-4"><Search className="w-4 h-4 text-[#6D7175]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un fichier" className="outline-none text-sm w-full" /></div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-[#E1E1E1] p-10 text-center"><ImageIcon className="w-10 h-10 text-[#C9C9C9] mx-auto mb-3" /><p className="text-sm text-[#6D7175]">Aucun média. Téléversez vos premières images.</p></div>
        ) : filtered.map((f) => (
          <div key={f.path} className="group bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
            <div className="aspect-square bg-[#F4F4F4] overflow-hidden flex items-center justify-center">
              {f.type === 'video' ? <video src={f.url} className="w-full h-full object-cover" /> : f.type === 'image' ? <img src={f.url} alt={f.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-[#C9C9C9]" />}
            </div>
            <div className="p-2.5">
              <p className="text-xs font-medium text-[#202223] truncate">{f.name}</p>
              <div className="flex items-center justify-between mt-1.5">
                <button onClick={() => copyUrl(f.url, f.path)} className="text-[#6D7175] hover:text-[#008060]">{copied === f.path ? <Check className="w-3.5 h-3.5 text-[#008060]" /> : <Copy className="w-3.5 h-3.5" />}</button>
                <button onClick={() => remove(f)} className="text-[#6D7175] hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
