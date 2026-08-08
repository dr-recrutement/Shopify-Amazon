import { useRef, useState } from 'react';
import { Upload, Trash2, Image as ImageIcon, Plus, Star } from 'lucide-react';

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (dataUrl: string) => void;
  /** Suggested upload width — the image is downscaled to keep localStorage small. */
  maxWidth?: number;
  /** Recommended dimensions shown to the merchant as guidance. */
  dimensionsHint?: string;
  className?: string;
}

/**
 * Upload field that reads a local file and stores it as a base64 data URL.
 * No external links, no remote uploads — the image lives entirely in the
 * merchant's browser storage, exactly like Shopify's file picker stores the
 * reference in the theme settings.
 *
 * Images are resized via a canvas to keep them small enough for localStorage.
 * Recommended source dimensions: square 800×800 px (products), 1600×600 px
 * (banners). Files are downscaled to `maxWidth` and JPEG-compressed at 0.78.
 */
export function ImageUploadField({ label, value, onChange, maxWidth = 800, dimensionsHint, className = '' }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('L’image dépasse 5 Mo. Veuillez choisir un fichier plus léger.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Downscale via canvas to keep localStorage usage reasonable.
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { onChange(reader.result as string); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        onChange(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = () => setError('Impossible de lire cette image.');
      img.src = reader.result as string;
    };
    reader.onerror = () => setError('Échec de la lecture du fichier.');
    reader.readAsDataURL(file);
  };

  return (
    <div className={className}>
      {label && <label className="block text-[10px] font-medium text-gray-500 mb-1">{label}</label>}
      <div className="flex items-center gap-2">
        <div
          className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0"
          style={value ? { backgroundImage: `url(${value})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {!value && <ImageIcon size={16} className="text-gray-300" />}
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-brand-600 text-white rounded hover:bg-brand-700 transition-colors"
            >
              <Upload size={11} /> Téléverser
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-500 border border-gray-200 rounded hover:text-red-600 hover:border-red-200 transition-colors"
              >
                <Trash2 size={11} /> Retirer
              </button>
            )}
          </div>
          <span className="text-[9px] text-gray-400">
            {value ? 'Image téléversée ✓' : (dimensionsHint || 'PNG, JPG, WebP — max 5 Mo')}
          </span>
        </div>
      </div>
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Multi-image gallery — Shopify product media picker (multiple uploads, drag
// to reorder, set primary, remove). Stores each image as a compressed base64
// data URL so the whole gallery lives in the product record (no CDN needed).
// ---------------------------------------------------------------------------

const MAX_PRODUCT_IMAGES = 8;
const PRODUCT_IMG_MAX_WIDTH = 800;

function compressImage(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Type non supporté')); return; }
    if (file.size > 5 * 1024 * 1024) { reject(new Error('Fichier > 5 Mo')); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(reader.result as string); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = () => reject(new Error('Lecture impossible'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Lecture impossible'));
    reader.readAsDataURL(file);
  });
}

interface MultiImageUploadProps {
  label?: string;
  value: string[];
  onChange: (images: string[]) => void;
  dimensionsHint?: string;
}

export function MultiImageUpload({ label, value, onChange, dimensionsHint }: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const images = value || [];

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const remaining = MAX_PRODUCT_IMAGES - images.length;
      const toAdd = Array.from(files).slice(0, remaining);
      const compressed: string[] = [];
      for (const f of toAdd) {
        try { compressed.push(await compressImage(f, PRODUCT_IMG_MAX_WIDTH)); }
        catch (e) { setError(e instanceof Error ? e.message : 'Erreur'); }
      }
      if (compressed.length > 0) onChange([...images, ...compressed]);
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const setPrimary = (idx: number) => {
    const picked = images[idx];
    const rest = images.filter((_, i) => i !== idx);
    onChange([picked, ...rest]);
  };

  const onDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) return;
    const next = [...images];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, moved);
    onChange(next);
    setDragIdx(null);
  };

  return (
    <div>
      {label && <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{label}</label>}
      <div className="grid grid-cols-4 gap-2">
        {images.map((img, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={e => e.preventDefault()}
            onDrop={e => onDrop(e, i)}
            className={`relative group aspect-square rounded-lg border overflow-hidden bg-gray-50 cursor-move ${i === 0 ? 'border-brand-500 ring-2 ring-brand-200' : 'border-gray-200'}`}
            style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            {i === 0 && (
              <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-brand-600 text-white text-[8px] font-black uppercase">
                <Star size={8} /> Principale
              </span>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              {i !== 0 && (
                <button type="button" onClick={() => setPrimary(i)} title="Définir comme principale" className="p-1 bg-white/90 rounded text-gray-700 hover:text-brand-600">
                  <Star size={11} />
                </button>
              )}
              <button type="button" onClick={() => removeAt(i)} title="Supprimer" className="p-1 bg-white/90 rounded text-gray-700 hover:text-red-600">
                <Trash2 size={11} />
              </button>
            </div>
            <span className="absolute bottom-1 right-1 text-[8px] text-white/80 bg-black/40 px-1 rounded">{i + 1}</span>
          </div>
        ))}
        {images.length < MAX_PRODUCT_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-brand-400 hover:text-brand-600 transition-colors disabled:opacity-50"
          >
            {busy ? <span className="text-[9px] animate-pulse">Compression…</span> : <>
              <Plus size={16} />
              <span className="text-[9px] font-medium">Ajouter</span>
            </>}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
      />
      <div className="mt-1.5 flex items-center justify-between">
        <p className="text-[10px] text-gray-400">{dimensionsHint || 'Recommandé : 800×800 px · carré · max 5 Mo/image'}</p>
        <p className="text-[10px] text-gray-400">{images.length}/{MAX_PRODUCT_IMAGES}</p>
      </div>
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}
