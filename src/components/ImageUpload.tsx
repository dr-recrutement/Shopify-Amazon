import { useRef, useState } from 'react';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (dataUrl: string) => void;
  /** Suggested upload width — the image is downscaled to keep localStorage small. */
  maxWidth?: number;
  className?: string;
}

/**
 * Upload field that reads a local file and stores it as a base64 data URL.
 * No external links, no remote uploads — the image lives entirely in the
 * merchant's browser storage, exactly like Shopify's file picker stores the
 * reference in the theme settings.
 *
 * Images are resized via a canvas to keep them small enough for localStorage.
 */
export function ImageUploadField({ label, value, onChange, maxWidth = 800, className = '' }: ImageUploadFieldProps) {
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
        onChange(canvas.toDataURL('image/jpeg', 0.82));
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
            {value ? 'Image téléversée ✓' : 'PNG, JPG, WebP — max 5 Mo'}
          </span>
        </div>
      </div>
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}
