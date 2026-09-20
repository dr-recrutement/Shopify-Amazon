import { useState, useRef, useEffect } from 'react';
import ThemeRenderer from './ThemeRenderer';

// Renders a theme at a fixed design width (desktop storefront) and scales it
// down to fit the card, giving a real "screenshot" thumbnail of the full page.
const DESIGN_WIDTH = 1280;

export default function ThemePreview({ theme, className = 'h-[300px] sm:h-[420px]' }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / DESIGN_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={`w-full overflow-hidden relative bg-[#F4F4F4] ${className}`}>
      <div style={{ width: DESIGN_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ThemeRenderer theme={theme} sections={theme.sections} mode="gallery" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(244,244,244,0.9), rgba(244,244,244,0))' }} />
    </div>
  );
}