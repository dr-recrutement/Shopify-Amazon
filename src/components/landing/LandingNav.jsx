import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, ChevronDown, ArrowRight, Globe, Palette, Sparkles, ShoppingCart, Package, CreditCard, Truck, Tag, BarChart3, Globe2, Bot } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { COMPETITOR_LIST } from '@/lib/competitors';
import { LANGUAGES } from '@/lib/i18n';

// Real product icons instead of the previous emoji glyphs (🎨✨🛒 etc.) —
// consistent with the icon language used everywhere else on the site
// (LandingFeatures, LandingHero...) rather than looking like a placeholder.
// Order matches PLATFORM_LINKS's flattened order below.
const PLATFORM_ICONS = [Palette, Sparkles, ShoppingCart, Package, CreditCard, Truck, Tag, BarChart3, Globe2, Bot];

const LANG_FLAGS = { fr: '🇫🇷', en: '🇬🇧', ar: '🇦🇪', pt: '🇵🇹', es: '🇪🇸', sw: '🇰🇪', wo: '🇸🇳' };

export default function LandingNav() {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(null);
  const [mobileSection, setMobileSection] = useState(null);
  const [langOpen, setLangOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => { if (navRef.current && !navRef.current.contains(e.target)) { setMegaOpen(null); setLangOpen(false); } };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Real translated content below. Platform items now point to actual
  // dedicated pages (with anchors for each specific item) instead of every
  // single one collapsing to the same "#fonctionnalites" section — and use
  // product icons (imported above) instead of emoji glyphs.
  const platformFlat = t('landing.nav.platform_links', { returnObjects: true });
  const PLATFORM_HREFS = [
    '/fonctionnalites/creer-vendre#editeur-boutique', '/fonctionnalites/creer-vendre#themes-premium', '/fonctionnalites/creer-vendre#checkout-optimise',
    '/fonctionnalites/gerer#gestion-stocks', '/fonctionnalites/gerer#paiements-integres', '/fonctionnalites/gerer#livraison-multi-zones', '/fonctionnalites/gerer#promotions-reductions',
    '/fonctionnalites/croitre#analytics-temps-reel', '/fonctionnalites/croitre#multi-devises', '/fonctionnalites/croitre#sellia-assistant',
  ];
  const platformItems = platformFlat.map((it, i) => ({ ...it, to: PLATFORM_HREFS[i], Icon: PLATFORM_ICONS[i] }));
  const PLATFORM_LINKS = [
    { group: t('landing.nav.group_create_sell'), items: platformItems.slice(0, 3) },
    { group: t('landing.nav.group_manage'), items: platformItems.slice(3, 7) },
    { group: t('landing.nav.group_grow'), items: platformItems.slice(7, 10) },
  ];

  const resourcesFlat = t('landing.nav.resources_links', { returnObjects: true });
  const RESOURCES_HREFS = ['/centre-aide', '/guides', '/securite', '/a-propos', '/contact'];
  const RESOURCES_LINKS = resourcesFlat.map((it, i) => ({ ...it, to: RESOURCES_HREFS[i] }));

  // Comparison pages, surfaced directly in the main nav so a visitor
  // searching "alternative à Shopify" (or any of the other five) finds the
  // matching page in one click from anywhere on the site, not just via the
  // footer.
  const ALTERNATIVES_LINKS = COMPETITOR_LIST.map((c) => ({
    label: `${t('landing.nav.alternative_prefix')} ${c.name}`,
    desc: t('landing.nav.alternative_desc_template', { name: c.name }),
    to: `/alternative-a-${c.slug}`,
  }));

  const NAV_ITEMS = [
    { id: 'platform', label: t('landing.footer.col_platform'), mega: true, links: PLATFORM_LINKS, cols: 3 },
    { id: 'alternatives', label: t('landing.nav.alternatives_label'), mega: false, links: ALTERNATIVES_LINKS, wide: true },
    { id: 'resources', label: t('landing.footer.col_resources'), mega: false, links: RESOURCES_LINKS },
  ];

  return (
    <header ref={navRef} className={`sticky top-0 z-50 transition-all ${scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-border shadow-sm' : 'bg-white/80 backdrop-blur-md'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Logo — no "by Liafrik" */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src={BRAND.logo} alt="Sellia" className="h-9 w-auto object-contain" />
            <span className="font-landing font-bold text-[17px] text-foreground tracking-tight">Sellia</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <div key={item.id} className="relative" onMouseEnter={() => setMegaOpen(item.id)} onMouseLeave={() => setMegaOpen(null)}>
                <button className="flex items-center gap-1 px-3.5 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-full">
                  {item.label}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${megaOpen === item.id ? 'rotate-180' : ''}`} />
                </button>
                {megaOpen === item.id && (
                  item.mega ? (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[680px] max-w-[95vw] bg-white rounded-2xl border border-border shadow-2xl p-6 grid gap-x-8 gap-y-1" style={{ gridTemplateColumns: `repeat(${item.cols}, 1fr)` }}>
                      {item.links.map((group) => (
                        <div key={group.group}>
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{group.group}</p>
                          {group.items.map((it) => (
                            <Link key={it.label} to={it.to} className="flex items-start gap-3 px-2.5 py-2.5 rounded-xl hover:bg-surface transition-colors">
                              <span className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center shrink-0 mt-0.5"><it.Icon className="w-4 h-4 text-brand" /></span>
                              <div><p className="text-sm font-semibold text-foreground">{it.label}</p><p className="text-xs text-muted-foreground">{it.desc}</p></div>
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`absolute left-0 top-full mt-2 ${item.wide ? 'w-[360px]' : 'w-[320px]'} bg-white rounded-2xl border border-border shadow-2xl p-3`}>
                      {item.links.map((it) => (
                        <Link key={it.label} to={it.to} className="block px-3 py-2.5 rounded-xl hover:bg-surface transition-colors">
                          <p className="text-sm font-semibold text-foreground">{it.label}</p>
                          <p className="text-xs text-muted-foreground">{it.desc}</p>
                        </Link>
                      ))}
                    </div>
                  )
                )}
              </div>
            ))}
            <a href="#tarifs" className="px-3.5 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-full">{t('landing.nav.tarifs')}</a>
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-foreground hover:text-brand transition-colors rounded-full">{t('landing.nav.login')}</Link>
            <Link to="/register" className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-brand/90 transition-colors shadow-lg shadow-brand/20">
              {t('landing.nav.trial')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {/* Language selector — extreme right. Real switch now: picking
                a language calls i18n.changeLanguage, which re-renders every
                component using useTranslation (this nav, the footer, and
                the rest of the homepage) and flips the page to RTL for
                Arabic — it used to only update local component state and
                change nothing on the page. */}
            <div className="relative ml-1">
              <button onClick={() => setLangOpen((o) => !o)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-full">
                <Globe className="w-4 h-4" />
                <span className="text-base">{LANG_FLAGS[i18n.language] || '🌐'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl border border-border shadow-2xl p-2">
                  {LANGUAGES.map((l) => (
                    <button key={l.code} onClick={() => { i18n.changeLanguage(l.code); setLangOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-surface transition-colors ${i18n.language === l.code ? 'bg-surface font-semibold text-foreground' : 'text-muted-foreground'}`}>
                      <span className="text-base">{LANG_FLAGS[l.code] || '🌐'}</span> {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button onClick={() => setMobileOpen((o) => !o)} className="lg:hidden p-2 rounded-full hover:bg-muted text-foreground">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-border max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <div key={item.id} className="border-b border-border/50">
                <button onClick={() => setMobileSection(mobileSection === item.id ? null : item.id)} className="w-full flex items-center justify-between py-3 text-sm font-semibold text-foreground">
                  {item.label}
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileSection === item.id ? 'rotate-180' : ''}`} />
                </button>
                {mobileSection === item.id && (
                  <div className="pb-3 space-y-3 pl-2">
                    {item.mega ? item.links.map((g) => (
                      <div key={g.group}>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1.5">{g.group}</p>
                        {g.items.map((i) => (
                          <Link key={i.label} to={i.to} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 text-sm text-foreground">
                            <i.Icon className="w-4 h-4 text-brand" /> {i.label}
                          </Link>
                        ))}
                      </div>
                    )) : item.links.map((i) => (
                      <Link key={i.label} to={i.to} onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-foreground">{i.label}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <a href="#tarifs" onClick={() => setMobileOpen(false)} className="block py-3 text-sm font-semibold text-foreground">{t('landing.nav.tarifs')}</a>
            <div className="flex items-center gap-2 py-2">
              {LANGUAGES.map((l) => <button key={l.code} onClick={() => i18n.changeLanguage(l.code)} className={`text-lg px-1 ${i18n.language === l.code ? 'opacity-100' : 'opacity-50'}`}>{LANG_FLAGS[l.code] || '🌐'}</button>)}
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="py-2.5 text-center text-sm font-semibold text-foreground border border-border rounded-full">{t('landing.nav.login')}</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="py-2.5 text-center text-sm font-semibold bg-brand text-brand-foreground rounded-full">{t('landing.nav.trial')}</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}