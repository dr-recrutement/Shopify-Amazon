import { useState } from 'react';
import { Image } from '@/components/ui/image';
import { Upload, Link2, X, Star, Check, ArrowRight } from 'lucide-react';
import { ensureGoogleFonts } from '@/lib/fonts';
import { supabase } from '@/api/supabaseClient';

const SECTION_LABELS = {
  announcement: 'Annonce', header: 'En-tête', hero: 'Bannière', productGrid: 'Produits',
  imageText: 'Image + texte', multicolumn: 'Colonnes', testimonials: 'Avis',
  blogList: 'Articles', gallery: 'Galerie', cta: 'Appel à l’action',
  newsletter: 'Newsletter', footer: 'Pied de page', collectionList: 'Catégories',
  trustbar: 'Garanties', menu: 'Carte', pricing: 'Tarifs', iconGrid: 'Icônes', custom: 'Libre',
};

function normalizeLink(l) {
  // Backward compat: existing themes store links as plain strings
  // ("Accueil"). New links are {label, url}. Either way this always
  // returns a real href the storefront can navigate to.
  if (typeof l === 'string') return { label: l, url: '#' };
  return { label: l?.label || '', url: l?.url || '#' };
}

function NavLink({ link, storefront, storeSlug, className, style }) {
  const { label, url } = normalizeLink(link);
  if (!storefront) return <span className={className} style={style}>{label}</span>;
  const resolved = url === '#products' ? '#sellia-products' : url;
  const isAnchor = resolved.startsWith('#');
  const onClick = isAnchor ? (e) => {
    e.preventDefault();
    const id = resolved.slice(1);
    const el = id ? document.getElementById(id) : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  } : undefined;
  const href = resolved.startsWith('/store/') || resolved.startsWith('http') || isAnchor ? resolved
    : storeSlug ? `/store/${storeSlug}${resolved.startsWith('/') ? resolved : '/' + resolved}` : resolved;
  return <a href={href} onClick={onClick} className={className} style={style}>{label}</a>;
}

function Stars({ n, color }) {
  if (!n) return null;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="w-3 h-3" style={{ color }} fill={i < n ? color : 'none'} />
      ))}
    </div>
  );
}

function scrollToProducts() {
  const el = document.getElementById('sellia-products');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}

function NewsletterBlock({ c, p, primary, primaryText, headingFont, storefront, tenantId }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !tenantId) return;
    setBusy(true);
    setError('');
    try {
      const { error: insertError } = await supabase.from('newsletter_subscribers').insert({
        tenant_id: tenantId,
        email: email.trim().toLowerCase(),
        source: 'theme_newsletter_block',
      });
      // A unique (tenant_id, email) constraint means re-subscribing just
      // errors instead of duplicating - treat that as success too, not a
      // failure the visitor needs to see.
      if (insertError && insertError.code !== '23505') throw insertError;
      setDone(true);
      setEmail('');
      setTimeout(() => setDone(false), 4000);
    } catch (err) {
      setError(err.message || "Échec de l'inscription");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="px-5 sm:px-10 py-14 text-center">
      <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: headingFont, color: p.dark }}>{c.title}</h2>
      <p className="mt-3 text-sm max-w-md mx-auto" style={{ color: p.muted }}>{c.subtitle}</p>
      {done ? (
        <p className="mt-6 text-sm font-semibold" style={{ color: primary }}>Merci ! Votre inscription est confirmée.</p>
      ) : (
        <form onSubmit={storefront ? submit : (e) => e.preventDefault()} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={c.placeholder} className="flex-1 px-4 py-3 rounded-md text-sm border" style={{ borderColor: p.border, background: p.surface, color: p.text }} />
          <button type="submit" disabled={busy} className="px-6 py-3 sellia-btn text-sm font-semibold transition hover:opacity-90 disabled:opacity-60" style={{ background: primary, color: primaryText }}>{busy ? '…' : c.buttonLabel}</button>
        </form>
      )}
      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function ImageReplace({ sectionId, path, onUpload, onSetUrl }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    await onUpload(sectionId, path, file);
    setBusy(false);
    setOpen(false);
  };
  if (!open) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title="Remplacer l’image"
        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-md bg-black/60 text-white flex items-center justify-center hover:bg-black/80 backdrop-blur"
      >
        <Upload className="w-3.5 h-3.5" />
      </button>
    );
  }
  return (
    <div onClick={(e) => e.stopPropagation()} className="absolute top-2 right-2 z-20 w-56 bg-white rounded-lg shadow-xl border border-[#E1E1E1] p-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-[#202223]">Remplacer l’image</span>
        <button onClick={() => setOpen(false)} className="text-[#6D7175]"><X className="w-3.5 h-3.5" /></button>
      </div>
      <label className="flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-[#008060] rounded-md py-1.5 cursor-pointer hover:bg-[#00694d] mb-2">
        <Upload className="w-3.5 h-3.5" /> {busy ? 'Téléversement…' : 'Téléverser un fichier'}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={busy} />
      </label>
      <div className="flex gap-1">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="ou coller une URL" className="flex-1 px-2 py-1.5 border border-[#E1E1E1] rounded text-[11px]" />
        <button onClick={() => { if (url) { onSetUrl(sectionId, path, url); setOpen(false); } }} className="px-2 py-1.5 bg-[#202223] text-white rounded text-[11px]"><Link2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

function Img({ src, className, fittingType = 'fill', editor, sectionId, path, onUpload, onSetUrl }) {
  return (
    <div className={`relative ${className}`}>
      <Image src={src} className="w-full h-full" fittingType={fittingType} />
      {editor && <ImageReplace sectionId={sectionId} path={path} onUpload={onUpload} onSetUrl={onSetUrl} />}
    </div>
  );
}

function SectionShell({ section, editor, selectedId, onSelect, children }) {
  if (editor) {
    return (
      <div
        onClick={() => onSelect(section.id)}
        className={`relative cursor-pointer transition ${selectedId === section.id ? 'outline outline-2 outline-[#008060] outline-offset-[-2px]' : 'hover:outline hover:outline-2 hover:outline-[#008060]/40 hover:outline-offset-[-2px]'}`}
      >
        <span className="absolute top-1.5 left-1.5 z-10 text-[10px] font-semibold bg-white/90 text-[#202223] px-1.5 py-0.5 rounded shadow-sm">{SECTION_LABELS[section.type] || section.type}</span>
        {children}
      </div>
    );
  }
  return <div>{children}</div>;
}

export default function ThemeRenderer({ theme, sections, mode = 'gallery', selectedId, onSelectSection, onSetImage, onUploadFile, onAddToCart, onNavigate, storeSlug, tenantId }) {
  const p = theme.palette;
  const editor = mode === 'editor';
  const storefront = mode === 'storefront';
  const visible = sections.filter((s) => s.visible);
  const firstPgId = visible.find((s) => s.type === 'productGrid')?.id;
  const wrap = (s, content) => (
    <SectionShell key={s.id} section={s} editor={editor} selectedId={selectedId} onSelect={onSelectSection}>
      {content}
    </SectionShell>
  );
  const accent = p.accent;
  const primary = p.primary;

  const radius = { pill: '9999px', rounded: '10px', square: '4px' }[theme.buttonStyle] || '10px';
  ensureGoogleFonts([theme.fonts?.heading, theme.fonts?.body].filter(Boolean));

  return (
    <div style={{ background: p.bg, color: p.text, fontFamily: theme.fonts?.body, '--sellia-radius': radius }}>
      <style>{`.sellia-btn { border-radius: var(--sellia-radius); }`}</style>
      {visible.map((s) => {
        const c = s.props || {};
        const ip = { editor, sectionId: s.id, onUpload: onUploadFile, onSetUrl: onSetImage };

        switch (s.type) {
          case 'announcement':
            if (c.style === 'scrolling') {
              return wrap(s, (
                <div className="overflow-hidden py-2.5" style={{ background: c.bg, color: c.text }}>
                  <style>{`@keyframes sellia-marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}</style>
                  <div className="whitespace-nowrap inline-block text-[11px] font-semibold tracking-wide" style={{ animation: 'sellia-marquee 16s linear infinite' }}>{c.message}</div>
                </div>
              ));
            }
            return wrap(s, <div className="text-center py-2.5 px-4 text-[11px] font-semibold tracking-wide" style={{ background: c.bg, color: c.text }}>{c.message}</div>);

          case 'header':
            return wrap(s, (
              <div
                className={`flex items-center justify-between px-5 sm:px-8 py-4 border-b ${storefront && c.sticky ? 'sticky top-0 z-30' : ''}`}
                style={{ borderColor: p.border, background: c.bg || p.bg, justifyContent: c.align === 'center' ? 'center' : 'space-between', gap: c.align === 'center' ? '2rem' : undefined }}
              >
                {c.logoImage
                  ? <span onClick={(e) => { if (storefront) { e.stopPropagation(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} className={storefront ? 'cursor-pointer' : ''}><Img src={c.logoImage} className="h-8 sm:h-9 w-24 sm:w-32" fittingType="fit" {...ip} path="logoImage" /></span>
                  : <span onClick={(e) => { if (storefront) { e.stopPropagation(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} className={`font-bold tracking-[0.25em] text-sm sm:text-base ${storefront ? 'cursor-pointer' : ''}`} style={{ fontFamily: theme.fonts?.heading, color: c.textColor || p.dark }}>{c.logo}</span>}
                <nav className="hidden sm:flex gap-6 text-xs font-medium">{(c.links || []).map((l, i) => <NavLink key={i} link={l} storefront={storefront} storeSlug={storeSlug} style={{ color: c.textColor || p.text }} />)}</nav>
                <nav className="sm:hidden flex gap-3 text-[11px] font-medium">{(c.links || []).slice(0, 3).map((l, i) => <NavLink key={i} link={l} storefront={storefront} storeSlug={storeSlug} style={{ color: c.textColor || p.text }} />)}</nav>
              </div>
            ));

          case 'hero':
            return wrap(s, (
              <div className="relative">
                <Img src={c.image} className="h-[300px] sm:h-[460px]" {...ip} path="image" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0) 70%)' }} />
                <div className="absolute inset-0 flex items-center">
                  <div className="p-6 sm:p-14 max-w-xl" style={{ textAlign: c.align }}>
                    <h1 className="text-3xl sm:text-5xl font-bold leading-[1.1] text-white" style={{ fontFamily: theme.fonts?.heading }}>{c.title}</h1>
                    <p className="mt-4 text-sm sm:text-lg text-white/90 max-w-md">{c.subtitle}</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {(c.buttons || []).map((b, i) => (
                        <button key={i} onClick={(e) => { if (storefront) { e.stopPropagation(); scrollToProducts(); } }} className="text-xs sm:text-sm font-semibold px-5 py-3 sellia-btn transition hover:opacity-90" style={b.variant === 'primary' ? { background: primary, color: p.primaryText } : { border: '1px solid #fff', color: '#fff' }}>{b.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ));

          case 'trustbar':
            return wrap(s, (
              <div className="border-y" style={{ borderColor: p.border, background: p.surface }}>
                <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-3 px-5 py-5">
                  {(c.items || []).map((it, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs sm:text-sm font-medium" style={{ color: p.text }}>
                      {it.iconImage ? <img src={it.iconImage} alt="" className="w-5 h-5 object-contain" /> : <span className="text-base">{it.icon}</span>}
                      {it.text}
                    </div>
                  ))}
                </div>
              </div>
            ));

          case 'collectionList':
            return wrap(s, (
              <div className="px-5 sm:px-10 py-12">
                <h2 className="text-xl sm:text-3xl font-bold text-center mb-8" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{c.title}</h2>
                <div className={`grid grid-cols-2 sm:grid-cols-${c.columns || 4} gap-4`}>
                  {(c.items || []).map((it, i) => (
                    <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden">
                      <Img src={it.image} className="w-full h-full" {...ip} path={`items.${i}.image`} />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0) 55%)' }} />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <p className="font-bold text-base" style={{ fontFamily: theme.fonts?.heading }}>{it.title}</p>
                        <p className="text-xs opacity-80 mt-0.5">{it.count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));

          case 'productGrid':
            return wrap(s, (
              <div className="px-5 sm:px-10 py-12">
                <div id={s.id === firstPgId ? 'sellia-products' : undefined} className="flex items-end justify-between mb-8">
                  <h2 className="text-xl sm:text-3xl font-bold" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{c.title}</h2>
                  <button onClick={(e) => { if (storefront) { e.stopPropagation(); scrollToProducts(); } }} className="hidden sm:flex items-center gap-1 text-xs font-semibold" style={{ color: primary }}>Tout voir <ArrowRight className="w-3.5 h-3.5" /></button>
                </div>
                <div className={`grid grid-cols-2 sm:grid-cols-${c.columns || 4} gap-4`}>
                  {(c.products || []).map((pr, i) => (
                    <div key={i} className="group rounded-xl overflow-hidden transition hover:shadow-lg" style={{ background: p.surface, border: `1px solid ${p.border}` }}>
                      <Img src={pr.image} className="aspect-square" {...ip} path={`products.${i}.image`} />
                      <div className="p-3">
                        {pr.rating ? <Stars n={pr.rating} color={accent} /> : null}
                        <p className="text-sm font-semibold mt-1.5" style={{ color: p.text }}>{pr.title}</p>
                        <p className="text-sm font-bold mt-1" style={{ color: accent }}>{pr.price}</p>
                        <button onClick={(e) => { if (onAddToCart) { e.stopPropagation(); onAddToCart(pr); } }} className={`mt-3 w-full text-xs font-semibold py-2 sellia-btn transition ${storefront ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ background: primary, color: p.primaryText }}>Ajouter au panier</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));

          case 'multicolumn':
            return wrap(s, (
              <div className="px-5 sm:px-10 py-12">
                <h2 className="text-xl sm:text-3xl font-bold text-center mb-10" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{c.title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                  {(c.items || []).map((it, i) => (
                    <div key={i} className="text-center">
                      <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-2xl overflow-hidden" style={{ background: primary + '14', color: primary }}>
                        {it.iconImage ? <img src={it.iconImage} alt="" className="w-7 h-7 object-contain" /> : it.icon}
                      </div>
                      <p className="text-sm font-semibold mt-4" style={{ color: p.text }}>{it.title}</p>
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: p.muted }}>{it.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ));

          case 'imageText': {
            const rev = c.reverse;
            return wrap(s, (
              <div className="px-5 sm:px-10 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 items-center max-w-5xl mx-auto">
                  <div className={rev ? 'sm:order-2' : ''}><Img src={c.image} className="aspect-square rounded-2xl overflow-hidden" {...ip} path="image" /></div>
                  <div className={rev ? 'sm:order-1' : ''}>
                    <h2 className="text-xl sm:text-3xl font-bold" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{c.title}</h2>
                    <p className="mt-4 text-sm sm:text-base leading-relaxed" style={{ color: p.muted }}>{c.text}</p>
                    {c.button && <button onClick={(e) => { if (storefront) { e.stopPropagation(); scrollToProducts(); } }} className="mt-6 text-sm font-semibold px-5 py-3 sellia-btn transition hover:opacity-90" style={{ background: primary, color: p.primaryText }}>{c.button}</button>}
                  </div>
                </div>
              </div>
            ));
          }

          case 'testimonials':
            if (c.displayMode === 'scrolling' && (c.items || []).length > 0) {
              const loop = [...c.items, ...c.items];
              return wrap(s, (
                <div className="py-12 overflow-hidden" style={{ background: p.surface }}>
                  <h2 className="text-xl sm:text-3xl font-bold text-center mb-10 px-5" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{c.title}</h2>
                  <style>{`@keyframes sellia-review-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
                  <div className="flex gap-5 w-max" style={{ animation: 'sellia-review-scroll 35s linear infinite' }}>
                    {loop.map((t, i) => (
                      <div key={i} className="p-6 rounded-2xl w-72 shrink-0" style={{ border: `1px solid ${p.border}`, background: p.bg }}>
                        <Stars n={t.rating || 5} color={accent} />
                        <p className="text-sm leading-relaxed mt-3" style={{ color: p.text }}>“{t.quote}”</p>
                        <div className="mt-4 pt-4 border-t" style={{ borderColor: p.border }}>
                          <p className="text-xs font-semibold" style={{ color: p.dark }}>{t.author}</p>
                          <p className="text-xs" style={{ color: p.muted }}>{t.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            }
            return wrap(s, (
              <div className="px-5 sm:px-10 py-12" style={{ background: p.surface }}>
                <h2 className="text-xl sm:text-3xl font-bold text-center mb-10" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{c.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
                  {(c.items || []).map((t, i) => (
                    <div key={i} className="p-6 rounded-2xl" style={{ border: `1px solid ${p.border}`, background: p.bg }}>
                      <Stars n={t.rating || 5} color={accent} />
                      <p className="text-sm leading-relaxed mt-3" style={{ color: p.text }}>“{t.quote}”</p>
                      <div className="mt-4 pt-4 border-t" style={{ borderColor: p.border }}>
                        <p className="text-xs font-semibold" style={{ color: p.dark }}>{t.author}</p>
                        <p className="text-xs" style={{ color: p.muted }}>{t.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));

          case 'blogList':
            return wrap(s, (
              <div className="px-5 sm:px-10 py-12">
                <h2 className="text-xl sm:text-3xl font-bold mb-8" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{c.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(c.posts || []).map((post, i) => {
                    const Tag = (storefront && post._handle && storeSlug) ? 'a' : 'div';
                    const linkProps = (storefront && post._handle && storeSlug) ? { href: `/store/${storeSlug}/blog/${post._handle}` } : {};
                    return (
                      <Tag key={i} {...linkProps} className="rounded-2xl overflow-hidden transition hover:shadow-lg block" style={{ border: `1px solid ${p.border}`, background: p.surface }}>
                        <Img src={post.image} className="aspect-[4/3]" {...ip} path={`posts.${i}.image`} />
                        <div className="p-5">
                          <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: accent }}>{post.date}</p>
                          <h3 className="text-base font-bold mt-2 leading-snug" style={{ color: p.dark }}>{post.title}</h3>
                          <p className="text-xs mt-2 leading-relaxed" style={{ color: p.muted }}>{post.excerpt}</p>
                          <span className="mt-4 text-xs font-semibold flex items-center gap-1" style={{ color: primary }}>Lire la suite <ArrowRight className="w-3.5 h-3.5" /></span>
                        </div>
                      </Tag>
                    );
                  })}
                </div>
              </div>
            ));

          case 'gallery':
            return wrap(s, (
              <div className="px-5 sm:px-10 py-12">
                <h2 className="text-xl sm:text-3xl font-bold text-center mb-8" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{c.title}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {(c.images || []).map((src, i) => (
                    <Img key={i} src={src} className="aspect-[4/3] rounded-xl overflow-hidden" {...ip} path={`images.${i}`} />
                  ))}
                </div>
              </div>
            ));

          case 'menu':
            return wrap(s, (
              <div className="px-5 sm:px-10 py-12">
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-center text-2xl sm:text-3xl font-bold" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{c.title}</h2>
                  {c.subtitle && <p className="text-center text-sm mt-2 mb-8" style={{ color: p.muted }}>{c.subtitle}</p>}
                  <div className="space-y-5 mt-8">
                    {(c.items || []).map((it, i) => (
                      <div key={i} className="flex items-baseline gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-sm sm:text-base" style={{ color: p.dark }}>{it.name}</p>
                          {it.description && <p className="text-xs mt-0.5" style={{ color: p.muted }}>{it.description}</p>}
                        </div>
                        <div className="flex-1 border-b border-dotted mb-1" style={{ borderColor: p.border }} />
                        <p className="font-bold text-sm sm:text-base whitespace-nowrap" style={{ color: accent }}>{it.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ));

          case 'pricing':
            return wrap(s, (
              <div className="px-5 sm:px-10 py-12">
                <h2 className="text-center text-2xl sm:text-3xl font-bold mb-10" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{c.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
                  {(c.plans || []).map((pl, i) => {
                    const hi = pl.highlighted;
                    return (
                      <div key={i} className={`rounded-2xl p-6 relative ${hi ? 'md:-translate-y-2 shadow-xl' : 'shadow-sm'}`} style={hi ? { background: primary, color: p.primaryText } : { background: p.surface, border: `1px solid ${p.border}` }}>
                        {hi && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full" style={{ background: accent, color: '#fff' }}>Populaire</span>}
                        <p className="font-bold text-lg">{pl.name}</p>
                        <div className="mt-3 flex items-baseline gap-1">
                          <p className="text-3xl font-bold">{pl.price}</p>
                          {pl.period && <p className="text-xs opacity-70">{pl.period}</p>}
                        </div>
                        <ul className="mt-5 space-y-2.5">
                          {(pl.features || []).map((f, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: hi ? p.primaryText : accent }} /> <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                        <button onClick={(e) => { if (storefront) { e.stopPropagation(); scrollToProducts(); } }} className="mt-6 w-full py-2.5 sellia-btn font-semibold text-sm transition hover:opacity-90" style={hi ? { background: p.primaryText, color: primary } : { background: primary, color: p.primaryText }}>{hi ? 'Commencer' : 'Choisir'}</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ));

          case 'cta':
            return wrap(s, (
              <div className="px-5 sm:px-10 py-16 text-center" style={{ background: primary, color: p.primaryText }}>
                <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: theme.fonts?.heading }}>{c.title}</h2>
                <p className="mt-3 text-sm sm:text-base opacity-90 max-w-md mx-auto">{c.subtitle}</p>
                <button onClick={(e) => { if (storefront) { e.stopPropagation(); scrollToProducts(); } }} className="mt-7 text-sm font-semibold px-6 py-3 sellia-btn transition hover:opacity-90" style={{ background: p.primaryText, color: primary }}>{c.buttonLabel}</button>
              </div>
            ));

          case 'newsletter':
            return wrap(s, <NewsletterBlock c={c} p={p} primary={primary} primaryText={p.primaryText} headingFont={theme.fonts?.heading} storefront={storefront} tenantId={tenantId} />);

          case 'footer':
            return wrap(s, (
              <div className="px-5 sm:px-10 py-12" style={{ background: p.dark, color: '#fff' }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                  <div className="col-span-2 md:col-span-1">
                    {c.logoImage
                      ? <Img src={c.logoImage} className="h-9 w-32" fittingType="fit" {...ip} path="logoImage" />
                      : <p className="font-bold tracking-[0.25em] text-base" style={{ fontFamily: theme.fonts?.heading }}>{c.logo}</p>}
                    <p className="text-xs mt-4 opacity-70 leading-relaxed max-w-xs">{c.description}</p>
                    <div className="flex flex-wrap gap-3 mt-5">
                      {(c.social || []).map((s, i) => <span key={i} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">{s}</span>)}
                    </div>
                  </div>
                  {(c.columns || []).map((col, i) => (
                    <div key={i}>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-4">{col.title}</p>
                      <ul className="space-y-2.5">
                        {(col.links || []).map((l, j) => <li key={j} className="text-xs opacity-70 hover:opacity-100"><NavLink link={l} storefront={storefront} storeSlug={storeSlug} /></li>)}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="text-center text-[11px] opacity-50 mt-10 pt-6 border-t border-white/10">{c.copyright}</p>
              </div>
            ));

          case 'iconGrid':
            return wrap(s, (
              <div className="px-5 sm:px-10 py-12">
                <h2 className="text-xl sm:text-3xl font-bold text-center mb-10" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{c.title}</h2>
                <div className="grid gap-8 max-w-5xl mx-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                  {(c.items || []).map((it, i) => (
                    <div key={i} className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: primary + '14' }}>
                        {it.iconImage
                          ? <Img src={it.iconImage} className="w-full h-full" fittingType="fit" {...ip} path={`items.${i}.iconImage`} />
                          : <span className="text-2xl">{it.icon || '✦'}</span>}
                      </div>
                      <p className="text-sm font-semibold mt-4" style={{ color: p.text }}>{it.title}</p>
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: p.muted }}>{it.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ));

          case 'custom': {
            const cols = c.columns || 1;
            return wrap(s, (
              <div className="px-5 sm:px-10 py-12" style={{ background: c.background && c.background !== 'transparent' ? c.background : undefined }}>
                <div className={`grid gap-4 max-w-5xl mx-auto grid-cols-1 sm:grid-cols-${cols}`}>
                  {(c.blocks || []).map((b, i) => {
                    const span = Math.min(b.span || 1, cols);
                    const spanStyle = span > 1 ? { gridColumn: `span ${span} / span ${span}` } : undefined;
                    const al = b.align || 'left';
                    if (b.kind === 'image') {
                      return <div key={i} style={spanStyle}><Img src={b.image} className="w-full aspect-[4/3] rounded-xl overflow-hidden" {...ip} path={`blocks.${i}.image`} /></div>;
                    }
                    if (b.kind === 'heading') {
                      return <h2 key={i} style={{ ...spanStyle, textAlign: al }} className="text-xl sm:text-3xl font-bold self-center">{b.text}</h2>;
                    }
                    if (b.kind === 'button') {
                      return <div key={i} style={spanStyle} className="flex"><button onClick={(e) => { if (storefront) { e.stopPropagation(); scrollToProducts(); } }} className="text-sm font-semibold px-5 py-3 sellia-btn transition hover:opacity-90" style={{ background: primary, color: p.primaryText }}>{b.text}</button></div>;
                    }
                    return <p key={i} style={{ ...spanStyle, textAlign: al }} className="text-sm leading-relaxed self-center">{b.text}</p>;
                  })}
                </div>
              </div>
            ));
          }

          default:
            return null;
        }
      })}
    </div>
  );
}