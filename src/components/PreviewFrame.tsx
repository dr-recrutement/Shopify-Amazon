import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders the theme preview inside a real <iframe>.
 *
 * Why this exists: the device switcher used to just narrow a <div> with
 * `max-w-[340px]`. But every responsive class in the rendered sections
 * (`md:grid-cols-3`, `sm:flex-row`, `md:text-5xl` — 38+ of them in
 * theme-engine.tsx) is a VIEWPORT media query. On a desktop browser the
 * viewport stays ~1920px wide no matter how narrow that div is, so `md:`
 * and `lg:` rules stayed active and the merchant saw a horizontally
 * squished DESKTOP layout — not the mobile layout their customers
 * actually get. Switching to "Mobile" changed the width and nothing else.
 *
 * An iframe has its own viewport, so media queries resolve against the
 * simulated device width and the preview becomes genuinely accurate.
 *
 * The parent document's stylesheets are copied in (Tailwind is a single
 * compiled sheet in this app, plus the theme's injected <style> tags), and
 * re-copied whenever `styleKey` changes so live theme edits still apply
 * instantly.
 */
export function PreviewFrame({
  width,
  children,
  className = '',
  styleKey = '',
  minHeight = 450,
}: {
  width: number | null;
  children: React.ReactNode;
  className?: string;
  styleKey?: string;
  minHeight?: number;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [height, setHeight] = useState(minHeight);

  // Establish the iframe document (head styles + a body mount point).
  const syncStyles = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    doc.head.querySelectorAll('[data-preview-style]').forEach(n => n.remove());
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.setAttribute('data-preview-style', '');
      doc.head.appendChild(clone);
    });
  };

  const handleLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    doc.body.style.margin = '0';
    doc.body.style.background = 'transparent';
    syncStyles();
    setMountNode(doc.body);
  };

  // Some browsers fire load before the ref callback runs; also handle the
  // already-loaded case so the portal target is never missed.
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (doc && doc.readyState === 'complete' && !mountNode) handleLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-copy styles when the theme changes so edits show up live.
  useEffect(() => {
    if (mountNode) syncStyles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleKey, mountNode]);

  // Grow the iframe to fit its content — an iframe won't auto-size, and a
  // fixed height would either clip long pages or leave dead space.
  useEffect(() => {
    if (!mountNode) return;
    const update = () => {
      const h = mountNode.scrollHeight;
      if (h > 0) setHeight(Math.max(h, minHeight));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(mountNode);
    const t = setInterval(update, 500); // catches async image/font reflow
    return () => { ro.disconnect(); clearInterval(t); };
  }, [mountNode, minHeight, styleKey]);

  return (
    <iframe
      ref={iframeRef}
      onLoad={handleLoad}
      title="Aperçu de la boutique"
      className={className}
      style={{ width: width ? `${width}px` : '100%', height: `${height}px`, border: 'none', display: 'block' }}
    >
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
}
