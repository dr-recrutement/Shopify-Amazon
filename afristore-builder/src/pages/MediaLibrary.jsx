import { useState, useEffect, useCallback, useRef } from 'react';
import { Image as ImageIcon, Upload, Trash2, Search, Loader2, Copy, Check, X, Folder } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';

export default function MediaLibrary() {
  const { store, loading } = useCurrentStore();
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setFiles(await base44.entities.MediaFile.filter({ store_id: store.id }, '-created_date', 200));
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const upload = async (fileList) => {
    if (!fileList?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'document';
        await base44.entities.MediaFile.create({ store_id: store.id, name: file.name, url: file_url, type, mime: file.type, size: file.size, folder: 'general' });
      }
      await load();
    } finally { setUploading(false); }
  };

  const remove = async (id) => { if (confirm('Supprimer ce fichier ?')) { await base44.entities.MediaFile.delete(id); await load(); } };
  const copyUrl = (url, id) => { navigator.clipboard.writeText(url); setCopied(id); setTimeout(() => setCopied(null), 1500); };

  const folders = ['all', ...new Set(files.map((f) => f.folder))];
  const filtered = files.filter((f) => (folder === 'all' || f.folder === folder) && (!search || f.name.toLowerCase().includes(search.toLowerCase())));

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

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

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-[#E1E1E1] rounded-lg px-3 py-2 flex-1"><Search className="w-4 h-4 text-[#6D7175]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un fichier" className="outline-none text-sm w-full" /></div>
        <div className="flex gap-2 overflow-x-auto">
          {folders.map((f) => <button key={f} onClick={() => setFolder(f)} className={`text-xs font-semibold px-3 py-2 rounded-full whitespace-nowrap transition flex items-center gap-1 ${folder === f ? 'bg-[#008060] text-white' : 'bg-white border border-[#E1E1E1] text-[#6D7175] hover:bg-black/5'}`}><Folder className="w-3.5 h-3.5" /> {f === 'all' ? 'Tous' : f}</button>)}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-[#E1E1E1] p-10 text-center"><ImageIcon className="w-10 h-10 text-[#C9C9C9] mx-auto mb-3" /><p className="text-sm text-[#6D7175]">Aucun média. Téléversez vos premières images.</p></div>
        ) : filtered.map((f) => (
          <div key={f.id} className="group bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
            <div className="aspect-square bg-[#F4F4F4] overflow-hidden flex items-center justify-center">
              {f.type === 'video' ? <video src={f.url} className="w-full h-full object-cover" /> : f.type === 'image' ? <img src={f.url} alt={f.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-[#C9C9C9]" />}
            </div>
            <div className="p-2.5">
              <p className="text-xs font-medium text-[#202223] truncate">{f.name}</p>
              <div className="flex items-center justify-between mt-1.5">
                <button onClick={() => copyUrl(f.url, f.id)} className="text-[#6D7175] hover:text-[#008060]">{copied === f.id ? <Check className="w-3.5 h-3.5 text-[#008060]" /> : <Copy className="w-3.5 h-3.5" />}</button>
                <button onClick={() => remove(f.id)} className="text-[#6D7175] hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}