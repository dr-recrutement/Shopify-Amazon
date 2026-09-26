import { useState, useEffect } from 'react';
import { Image } from '@/components/ui/image';
import { Upload, Link2, X, Star, Check, ArrowRight, Menu, Search, Heart } from 'lucide-react';
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

// Real guest wishlist - a session_id in localStorage (same identity model
// as the cart: no customer accounts on this storefront), not a decorative
// heart icon. Toggled inline on every product card.
export function getWishlistSessionId() {
  let id = localStorage.getItem('sellia_wishlist_session');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('sellia_wishlist_session', id); }
  return id;
}

export function WishlistHeart({ tenantId, productId }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const sessionId = getWishlistSessionId();

  useEffect(() => {
    if (!tenantId || !productId) return;
    supabase.from('wishlists').select('id').eq('tenant_id', tenantId).eq('session_id', sessionId).eq('product_id', productId).maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [tenantId, productId, sessionId]);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      if (saved) {
        await supabase.from('wishlists').delete().eq('tenant_id', tenantId).eq('session_id', sessionId).eq('product_id', productId);
        setSaved(false);
      } else {
        await supabase.from('wishlists').insert({ tenant_id: tenantId, session_id: sessionId, product_id: productId });
        setSaved(true);
      }
    } catch (e2) {
      console.error('Wishlist toggle failed:', e2);
    } finally { setBusy(false); }
  };

  return (
    <button
      onClick={toggle}
      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition"
      aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      title={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-red-500 text-red-500' : 'text-[#6D7175]'}`} />
    </button>
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

// Real generic form: lets a merchant build a proper professional showcase
// site (contact, quote request, booking...) with real configurable
// fields, not just the fixed newsletter-only signup above. Submissions
// land in form_submissions (RLS: anon insert, owner-only read), viewable
// in the admin.
function FormBlock({ c, p, primary, primaryText, headingFont, storefront, tenantId }) {
  const fields = c.fields || [];
  const [values, setValues] = useState({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const setField = (name, v) => setValues((old) => ({ ...old, [name]: v }));
  const submit = async (e) => {
    e.preventDefault();
    if (!tenantId) return;
    setBusy(true);
    setError('');
    try {
      const { error: insertError } = await supabase.from('form_submissions').insert({
        tenant_id: tenantId,
        form_name: c.formName || c.title || 'Formulaire',
        data: values,
      });
      if (insertError) throw insertError;
      setDone(true);
      setValues({});
    } catch (err) {
      setError(err.message || "Échec de l'envoi");
    } finally {
      setBusy(false);
    }
  };
  const fieldCls = 'w-full px-4 py-2.5 rounded-md text-sm border outline-none';
  const fieldStyle = { borderColor: p.border, background: p.surface, color: p.text };
  return (
    <div className="px-5 sm:px-10 py-14">
      <div className="max-w-lg mx-auto text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: headingFont, color: p.dark }}>{c.title}</h2>
        {c.subtitle && <p className="mt-3 text-sm" style={{ color: p.muted }}>{c.subtitle}</p>}
      </div>
      {done ? (
        <p className="text-center text-sm font-semibold max-w-lg mx-auto" style={{ color: primary }}>{c.successMessage || 'Merci, votre message a bien été envoyé !'}</p>
      ) : (
        <form onSubmit={storefront ? submit : (e) => e.preventDefault()} className="max-w-lg mx-auto space-y-3">
          {fields.map((f, i) => (
            <div key={i}>
              {f.type === 'checkbox' ? (
                <label className="flex items-start gap-2 text-xs" style={{ color: p.text }}>
                  <input type="checkbox" required={f.required} checked={!!values[f.name]} onChange={(e) => setField(f.name, e.target.checked)} className="mt-0.5 accent-current" style={{ color: primary }} />
                  <span>{f.label}{f.required && ' *'}</span>
                </label>
              ) : (
                <>
                  <label className="block text-xs font-semibold mb-1" style={{ color: p.text }}>{f.label}{f.required && ' *'}</label>
                  {f.type === 'textarea' ? (
                    <textarea required={f.required} rows={4} value={values[f.name] || ''} onChange={(e) => setField(f.name, e.target.value)} className={fieldCls} style={fieldStyle} />
                  ) : f.type === 'select' ? (
                    <select required={f.required} value={values[f.name] || ''} onChange={(e) => setField(f.name, e.target.value)} className={fieldCls} style={fieldStyle}>
                      <option value="">—</option>
                      {(f.options || []).map((o, oi) => <option key={oi} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type || 'text'} required={f.required} value={values[f.name] || ''} onChange={(e) => setField(f.name, e.target.value)} className={fieldCls} style={fieldStyle} />
                  )}
                </>
              )}
            </div>
          ))}
          <button type="submit" disabled={busy || fields.length === 0} className="w-full py-3 sellia-btn text-sm font-semibold transition hover:opacity-90 disabled:opacity-60" style={{ background: primary, color: primaryText }}>{busy ? '…' : c.buttonLabel || 'Envoyer'}</button>
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        </form>
      )}
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

// Predefined logo dimensions the merchant picks from in the editor,
// instead of freehand sizing that's easy to get wrong.
const LOGO_SIZES = {
  small: 'h-6 sm:h-7 w-20 sm:w-24',
  medium: 'h-8 sm:h-9 w-24 sm:w-32',
  large: 'h-10 sm:h-12 w-32 sm:w-40',
};

// Tailwind's JIT compiler only generates CSS for class names it can find
// as complete, literal strings in the source at build time - a template-
// string-interpolated class like `sm:grid-cols-${c.columns}` is invisible
// to it and NEVER produces real CSS, no matter what the runtime value is.
// That was the actual cause of "desktop column count has no effect,
// mobile and desktop always show the same layout": the sm: breakpoint
// class silently never existed, so only the hardcoded 2-column mobile
// class (a real literal) ever applied, on every screen size. This map of
// fully-written class names is what Tailwind can actually see and compile.
const SM_COLS_CLASS = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4', 5: 'sm:grid-cols-5', 6: 'sm:grid-cols-6' };
function smColsClass(n) {
  const clamped = Math.min(6, Math.max(1, Math.round(Number(n) || 4)));
  return SM_COLS_CLASS[clamped];
}
// Same static-class requirement for the mobile (base, no breakpoint
// prefix) column count - now a genuinely separate merchant-configurable
// value from the desktop count, not the same set of images just
// reflowing into fewer visible columns.
const BASE_COLS_CLASS = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };
function baseColsClass(n) {
  const clamped = Math.min(4, Math.max(1, Math.round(Number(n) || 2)));
  return BASE_COLS_CLASS[clamped];
}

function Img({ src, className, fittingType = 'fill', zoom, editor, sectionId, path, onUpload, onSetUrl }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image src={src} className="w-full h-full" fittingType={fittingType} zoom={zoom} />
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
                className={`relative flex items-center justify-between px-5 sm:px-8 py-4 border-b ${storefront && c.sticky ? 'sticky top-0 z-30' : ''}`}
                style={{ borderColor: p.border, background: c.bg || p.bg, justifyContent: c.align === 'center' ? 'center' : 'space-between', gap: c.align === 'center' ? '2rem' : undefined }}
              >
                {c.logoImage
                  ? <span onClick={(e) => { if (storefront) { e.stopPropagation(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} className={storefront ? 'cursor-pointer' : ''}><Img src={c.logoImage} className={LOGO_SIZES[c.logoSize] || LOGO_SIZES.medium} fittingType="fit" zoom={c.logoZoom} {...ip} path="logoImage" /></span>
                  : <span onClick={(e) => { if (storefront) { e.stopPropagation(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} className={`font-bold tracking-[0.25em] text-sm sm:text-base ${storefront ? 'cursor-pointer' : ''}`} style={{ fontFamily: theme.fonts?.heading, color: c.textColor || p.dark }}>{c.logo}</span>}
                <nav className="hidden sm:flex gap-6 text-xs font-medium">{(c.links || []).map((l, i) => <NavLink key={i} link={l} storefront={storefront} storeSlug={storeSlug} style={{ color: c.textColor || p.text }} />)}</nav>
                {storefront && storeSlug && c.showSearch !== false && (
                  <a href={`/store/${storeSlug}/search`} onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-md shrink-0" style={{ color: c.textColor || p.text }} title="Rechercher" aria-label="Rechercher">
                    <Search className="w-4 h-4" />
                  </a>
                )}
                {storefront && storeSlug && c.showWishlist !== false && (
                  <a href={`/store/${storeSlug}/wishlist`} onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-md shrink-0" style={{ color: c.textColor || p.text }} title="Mes favoris" aria-label="Mes favoris">
                    <Heart className="w-4 h-4" />
                  </a>
                )}
                {(c.links || []).length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMobileNavOpen((v) => !v); }}
                    className="sm:hidden p-1.5 -mr-1.5 rounded-md"
                    style={{ color: c.textColor || p.text }}
                    aria-label="Menu"
                  >
                    {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                )}
                {mobileNavOpen && c.mobileMenuStyle === 'fullscreen' && (
                  <div
                    className="sm:hidden fixed inset-0 z-40 flex flex-col justify-center items-center gap-2"
                    style={{ background: c.bg || p.bg }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(c.links || []).map((l, i) => (
                      <div key={i} onClick={() => setMobileNavOpen(false)} className="px-5 py-4 text-lg font-semibold" style={{ color: c.textColor || p.dark }}>
                        <NavLink link={l} storefront={storefront} storeSlug={storeSlug} style={{ color: c.textColor || p.dark }} />
                      </div>
                    ))}
                  </div>
                )}
                {mobileNavOpen && c.mobileMenuStyle !== 'fullscreen' && (
                  <div
                    className="sm:hidden absolute left-0 right-0 top-full border-b shadow-lg z-30 flex flex-col py-2"
                    style={{ background: c.bg || p.bg, borderColor: p.border }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(c.links || []).map((l, i) => (
                      <div key={i} onClick={() => setMobileNavOpen(false)} className="px-5 py-3 text-sm font-medium border-b last:border-b-0" style={{ color: c.textColor || p.text, borderColor: p.border }}>
                        <NavLink link={l} storefront={storefront} storeSlug={storeSlug} style={{ color: c.textColor || p.text }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ));

          case 'hero':
            return wrap(s, (
              <div className="relative">
                <Img src={c.image} className="h-[300px] sm:h-[460px]" fittingType={c.imageFit === 'contain' ? 'fit' : 'fill'} zoom={c.imageZoom} {...ip} path="image" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0) 70%)' }} />
                <div className="absolute inset-0 flex items-center">
                  <div className="p-6 sm:p-14 max-w-xl" style={{ textAlign: c.align }}>
                    <h1 className="text-3xl sm:text-5xl font-bold leading-[1.1] text-white" style={{ fontFamily: theme.fonts?.heading }}>{c.title}</h1>
                    <p className="mt-4 text-sm sm:text-lg text-white/90 max-w-md">{c.subtitle}</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {(c.buttons || []).map((b, i) => {
                        const { url } = normalizeLink({ url: b.url });
                        const isAnchor = !url || url === '#' || url === '#products';
                        const href = !isAnchor && storefront && storeSlug ? (url.startsWith('/store/') || url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:') ? url : `/store/${storeSlug}${url.startsWith('/') ? url : '/' + url}`) : null;
                        const commonStyle = b.variant === 'primary' ? { background: primary, color: p.primaryText } : { border: '1px solid #fff', color: '#fff' };
                        const commonClass = 'text-xs sm:text-sm font-semibold px-5 py-3 sellia-btn transition hover:opacity-90 inline-block';
                        return href
                          ? <a key={i} href={href} onClick={(e) => { if (storefront) e.stopPropagation(); }} className={commonClass} style={commonStyle}>{b.label}</a>
                          : <button key={i} onClick={(e) => { if (storefront) { e.stopPropagation(); scrollToProducts(); } }} className={commonClass} style={commonStyle}>{b.label}</button>;
                      })}
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
                <div className={`grid ${baseColsClass(c.columnsMobile || 2)} ${smColsClass(c.columns || 4)} gap-4`}>
                  {(c.items || []).map((it, i) => {
                    const { url } = normalizeLink({ url: it.url });
                    const detailHref = storefront && storeSlug && url && url !== '#' ? (url.startsWith('/store/') || url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:') ? url : `/store/${storeSlug}${url.startsWith('/') ? url : '/' + url}`) : null;
                    const CardTag = detailHref ? 'a' : 'div';
                    return (
                      <CardTag key={i} {...(detailHref ? { href: detailHref, onClick: (e) => e.stopPropagation() } : {})} className="relative aspect-[3/4] rounded-xl overflow-hidden block">
                        <Img src={it.image} className="w-full h-full" {...ip} path={`items.${i}.image`} />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0) 55%)' }} />
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                          <p className="font-bold text-base" style={{ fontFamily: theme.fonts?.heading }}>{it.title}</p>
                          <p className="text-xs opacity-80 mt-0.5">{it.count}</p>
                        </div>
                      </CardTag>
                    );
                  })}
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
                <div className={`grid ${baseColsClass(c.columnsMobile || 2)} ${smColsClass(c.columns || 4)} gap-4`}>
                  {(c.products || []).map((pr, i) => {
                    const detailHref = storefront && storeSlug && pr._id ? `/store/${storeSlug}/products/${pr._id}` : null;
                    return (
                      <div key={i} className={`relative group overflow-hidden transition hover:shadow-lg ${theme.productCardStyle === 'square' ? 'rounded-none' : 'rounded-xl'}`} style={{ background: p.surface, border: `1px solid ${p.border}` }}>
                        {theme.showProductBadges !== false && (
                          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
                            {pr._badgeSoldOut ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#202223] text-white">Épuisé</span>
                            ) : (
                              <>
                                {pr._badgeSale && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">-{pr._badgeSale}%</span>}
                                {pr._badgeNew && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: primary, color: p.primaryText }}>Nouveau</span>}
                              </>
                            )}
                          </div>
                        )}
                        {storefront && pr._id && <WishlistHeart tenantId={tenantId} productId={pr._id} />}
                        {detailHref ? (
                          <a href={detailHref} onClick={(e) => e.stopPropagation()}><Img src={pr.image} className="aspect-square" {...ip} path={`products.${i}.image`} /></a>
                        ) : (
                          <Img src={pr.image} className="aspect-square" {...ip} path={`products.${i}.image`} />
                        )}
                        <div className="p-3">
                          {pr.rating ? <div className="flex items-center gap-1"><Stars n={pr.rating} color={accent} />{pr.reviewCount > 0 && <span className="text-[10px]" style={{ color: p.muted }}>({pr.reviewCount})</span>}</div> : null}
                          {detailHref ? (
                            <a href={detailHref} onClick={(e) => e.stopPropagation()} className="block text-sm font-semibold mt-1.5 hover:underline" style={{ color: p.text }}>{pr.title}</a>
                          ) : (
                            <p className="text-sm font-semibold mt-1.5" style={{ color: p.text }}>{pr.title}</p>
                          )}
                          <p className="text-sm font-bold mt-1" style={{ color: accent }}>{pr.price}</p>
                          {pr._hasVariants && detailHref ? (
                            <a href={detailHref} onClick={(e) => e.stopPropagation()} className={`mt-3 block text-center w-full text-xs font-semibold py-2 sellia-btn transition ${storefront ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ background: primary, color: p.primaryText }}>Choisir les options</a>
                          ) : (
                            <button onClick={(e) => { if (onAddToCart) { e.stopPropagation(); onAddToCart(pr); } }} className={`mt-3 w-full text-xs font-semibold py-2 sellia-btn transition ${storefront ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} style={{ background: primary, color: p.primaryText }}>Ajouter au panier</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ));

          case 'brandSpotlight':
            return wrap(s, (
              <div className="px-5 sm:px-10 py-12">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{c.title}</h2>
                    {c.subtitle && <p className="text-sm mt-1 max-w-lg" style={{ color: p.muted }}>{c.subtitle}</p>}
                  </div>
                  {(() => {
                    const { url } = normalizeLink({ url: c.url });
                    const isAnchor = !url || url === '#' || url === '#products';
                    const href = !isAnchor && storefront && storeSlug ? (url.startsWith('/store/') || url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:') ? url : `/store/${storeSlug}${url.startsWith('/') ? url : '/' + url}`) : null;
                    return href
                      ? <a href={href} onClick={(e) => { if (storefront) e.stopPropagation(); }} className="hidden sm:inline-block text-xs font-semibold px-4 py-2 rounded-full border shrink-0" style={{ borderColor: p.border, color: p.text }}>{c.linkLabel || 'Voir tout'}</a>
                      : null;
                  })()}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6 items-stretch">
                  <div className="rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-auto" style={{ background: p.surface }}>
                    <Img src={c.image} className="w-full h-full" {...ip} path="image" />
                  </div>
                  <div className="overflow-x-auto -mx-1 px-1">
                    <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
                      {(c.products || []).map((pr, i) => {
                        const detailHref = storefront && storeSlug && pr._id ? `/store/${storeSlug}/products/${pr._id}` : null;
                        return (
                          <div key={i} className="relative w-36 sm:w-44 shrink-0 rounded-xl overflow-hidden" style={{ background: p.surface, border: `1px solid ${p.border}` }}>
                            {storefront && pr._id && <WishlistHeart tenantId={tenantId} productId={pr._id} />}
                            {detailHref ? (
                              <a href={detailHref} onClick={(e) => e.stopPropagation()}><Img src={pr.image} className="aspect-square" {...ip} path={`products.${i}.image`} /></a>
                            ) : (
                              <Img src={pr.image} className="aspect-square" {...ip} path={`products.${i}.image`} />
                            )}
                            <div className="p-2.5">
                              {pr.rating ? <Stars n={pr.rating} color={accent} /> : null}
                              {detailHref ? (
                                <a href={detailHref} onClick={(e) => e.stopPropagation()} className="block text-xs font-semibold mt-1 truncate hover:underline" style={{ color: p.text }}>{pr.title}</a>
                              ) : (
                                <p className="text-xs font-semibold mt-1 truncate" style={{ color: p.text }}>{pr.title}</p>
                              )}
                              <p className="text-xs font-bold mt-0.5" style={{ color: accent }}>{pr.price}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ));

          case 'storeLocations':
            if (!(c.locations || []).length && !editor) return null;
            return wrap(s, (
              <div className="px-5 sm:px-10 py-12">
                <h2 className="text-xl sm:text-2xl font-bold text-center mb-8" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{c.title || 'Nos boutiques'}</h2>
                {(c.locations || []).length === 0 ? (
                  <p className="text-center text-sm" style={{ color: p.muted }}>Ajoutez vos adresses dans Paramètres → Emplacements pour qu'elles apparaissent ici.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                    {(c.locations || []).map((loc, i) => (
                      <div key={i} className="rounded-xl p-5" style={{ background: p.surface, border: `1px solid ${p.border}` }}>
                        <p className="text-sm font-bold" style={{ color: p.dark }}>{loc.name}</p>
                        <p className="text-xs mt-1.5" style={{ color: p.muted }}>{loc.address}{loc.city ? `, ${loc.city}` : ''}{loc.country ? `, ${loc.country}` : ''}</p>
                        {loc.phone && <p className="text-xs mt-1" style={{ color: p.muted }}>{loc.phone}</p>}
                        {loc.hours && <p className="text-xs mt-1" style={{ color: theme.palette.primary }}>{loc.hours}</p>}
                      </div>
                    ))}
                  </div>
                )}
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
                  <div className={rev ? 'sm:order-2' : ''}><Img src={c.image} className="aspect-square rounded-2xl overflow-hidden" fittingType={c.imageFit === 'contain' ? 'fit' : 'fill'} zoom={c.imageZoom} {...ip} path="image" /></div>
                  <div className={rev ? 'sm:order-1' : ''}>
                    <h2 className="text-xl sm:text-3xl font-bold" style={{ fontFamily: theme.fonts?.heading, color: p.dark }}>{c.title}</h2>
                    <p className="mt-4 text-sm sm:text-base leading-relaxed" style={{ color: p.muted }}>{c.text}</p>
                    {(c.stats || []).length > 0 && (
                      <div className="flex flex-wrap gap-x-8 gap-y-3 mt-6">
                        {c.stats.map((st, i) => (
                          <div key={i}>
                            <p className="text-xl sm:text-2xl font-bold" style={{ color: accent, fontFamily: theme.fonts?.heading }}>{st.value}</p>
                            <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: p.muted }}>{st.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {c.button && (() => {
                      const { url } = normalizeLink({ url: c.buttonUrl });
                      const isAnchor = !url || url === '#' || url === '#products';
                      const href = !isAnchor && storefront && storeSlug ? (url.startsWith('/store/') || url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:') ? url : `/store/${storeSlug}${url.startsWith('/') ? url : '/' + url}`) : null;
                      const btnClass = 'mt-6 inline-block text-sm font-semibold px-5 py-3 sellia-btn transition hover:opacity-90';
                      const btnStyle = { background: primary, color: p.primaryText };
                      return href
                        ? <a href={href} onClick={(e) => { if (storefront) e.stopPropagation(); }} className={btnClass} style={btnStyle}>{c.button}</a>
                        : <button onClick={(e) => { if (storefront) { e.stopPropagation(); scrollToProducts(); } }} className={btnClass} style={btnStyle}>{c.button}</button>;
                    })()}
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
                        {(() => {
                          const { url } = normalizeLink({ url: pl.url });
                          const isAnchor = !url || url === '#' || url === '#products';
                          const href = !isAnchor && storefront && storeSlug ? (url.startsWith('/store/') || url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:') ? url : `/store/${storeSlug}${url.startsWith('/') ? url : '/' + url}`) : null;
                          const btnClass = 'mt-6 block text-center w-full py-2.5 sellia-btn font-semibold text-sm transition hover:opacity-90';
                          const btnStyle = hi ? { background: p.primaryText, color: primary } : { background: primary, color: p.primaryText };
                          const label = hi ? 'Commencer' : 'Choisir';
                          return href
                            ? <a href={href} onClick={(e) => { if (storefront) e.stopPropagation(); }} className={btnClass} style={btnStyle}>{label}</a>
                            : <button onClick={(e) => { if (storefront) { e.stopPropagation(); scrollToProducts(); } }} className={btnClass} style={btnStyle}>{label}</button>;
                        })()}
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
                {(() => {
                  const { url } = normalizeLink({ url: c.buttonUrl });
                  const isAnchor = !url || url === '#' || url === '#products';
                  const href = !isAnchor && storefront && storeSlug ? (url.startsWith('/store/') || url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:') ? url : `/store/${storeSlug}${url.startsWith('/') ? url : '/' + url}`) : null;
                  const btnClass = 'mt-7 inline-block text-sm font-semibold px-6 py-3 sellia-btn transition hover:opacity-90';
                  const btnStyle = { background: p.primaryText, color: primary };
                  return href
                    ? <a href={href} onClick={(e) => { if (storefront) e.stopPropagation(); }} className={btnClass} style={btnStyle}>{c.buttonLabel}</a>
                    : <button onClick={(e) => { if (storefront) { e.stopPropagation(); scrollToProducts(); } }} className={btnClass} style={btnStyle}>{c.buttonLabel}</button>;
                })()}
              </div>
            ));

          case 'newsletter':
            return wrap(s, <NewsletterBlock c={c} p={p} primary={primary} primaryText={p.primaryText} headingFont={theme.fonts?.heading} storefront={storefront} tenantId={tenantId} />);

          case 'form':
            return wrap(s, <FormBlock c={c} p={p} primary={primary} primaryText={p.primaryText} headingFont={theme.fonts?.heading} storefront={storefront} tenantId={tenantId} />);

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
                      {(c.social || []).map((s, i) => <NavLink key={i} link={s} storefront={storefront} storeSlug={storeSlug} className="text-xs opacity-70 hover:opacity-100" />)}
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
                <div className={`grid gap-4 max-w-5xl mx-auto grid-cols-1 ${smColsClass(cols)}`}>
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
                      const { url: bUrl } = normalizeLink({ url: b.url });
                      const bIsAnchor = !bUrl || bUrl === '#' || bUrl === '#products';
                      const bHref = !bIsAnchor && storefront && storeSlug ? (bUrl.startsWith('/store/') || bUrl.startsWith('http') || bUrl.startsWith('mailto:') || bUrl.startsWith('tel:') ? bUrl : `/store/${storeSlug}${bUrl.startsWith('/') ? bUrl : '/' + bUrl}`) : null;
                      const bClass = 'text-sm font-semibold px-5 py-3 sellia-btn transition hover:opacity-90 inline-block';
                      const bStyle = { background: primary, color: p.primaryText };
                      return <div key={i} style={spanStyle} className="flex">{bHref
                        ? <a href={bHref} onClick={(e) => { if (storefront) e.stopPropagation(); }} className={bClass} style={bStyle}>{b.text}</a>
                        : <button onClick={(e) => { if (storefront) { e.stopPropagation(); scrollToProducts(); } }} className={bClass} style={bStyle}>{b.text}</button>}</div>;
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