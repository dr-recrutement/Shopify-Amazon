import { useRef, useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

/**
 * Real click-to-zoom viewer. Previously, logos, favicons, banners and
 * product photos were only ever visible as tiny fixed-size thumbnails
 * (48×48 in the branding fields, small grid cells for product photos) —
 * there was no way to actually inspect an image at real size. Desktop:
 * click to enter a 2× zoom that follows the cursor (the same "hover
 * zoom" pattern Shopify/Amazon product pages use). Mobile: opens the
 * image full-screen in a scrollable container — native pinch-to-zoom
 * works there since nothing here disables touch gestures.
 */
export function ImageLightbox({ src, alt, open, onClose }: { src: string; alt?: string; open: boolean; onClose: () => void }) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const containerRef = useRef<HTMLDivElement>(null);

  if (!open || !src) return null;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!zoomed || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 animate-[toast-in_0.15s_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Aperçu image'}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Fermer"
      >
        <X size={24} />
      </button>
      <div
        ref={containerRef}
        onClick={e => { e.stopPropagation(); setZoomed(z => !z); }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoomed(false)}
        className="relative max-w-[92vw] max-h-[85vh] overflow-hidden rounded-lg"
      >
        <img
          src={src}
          alt={alt || ''}
          className={`max-w-[92vw] max-h-[85vh] object-contain select-none transition-transform duration-200 ${zoomed ? 'scale-[2] cursor-zoom-out' : 'cursor-zoom-in'}`}
          style={zoomed ? { transformOrigin: origin } : undefined}
          draggable={false}
        />
        {!zoomed && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 pointer-events-none">
            <ZoomIn size={12} /> Cliquez pour zoomer
          </div>
        )}
      </div>
    </div>
  );
}
