import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, ArrowRight, Globe } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { useI18n } from '@/lib/i18n';

const PLATFORM_LINKS = [
  { group: 'nav.createSell', items: [
    { key: 'nav.items.editor', icon: '🎨', href: '#fonctionnalites' },
    { key: 'nav.items.themes', icon: '✨', href: '#fonctionnalites' },
    { key: 'nav.items.checkout', icon: '🛒', href: '#fonctionnalites' },
  ]},
  { group: 'nav.manage', items: [
    { key: 'nav.items.stock', icon: '📦', href: '#fonctionnalites' },
    { key: 'nav.items.payments', icon: '💳', href: '#fonctionnalites' },
    { key: 'nav.items.shipping', icon: '🚚', href: '#fonctionnalites' },
    { key: 'nav.items.promos', icon: '🏷️', href: '#fonctionnalites' },
  ]},
  { group: 'nav.grow', items: [
    { key: 'nav.items.analytics', icon: '📊', href: '#fonctionnalites' },
    { key: 'nav.items.currencies', icon: '🌍', href: '#fonctionnalites' },
    { key: 'nav.items.ai', icon: '🤖', href: '#fonctionnalites' },
  ]},
];

const RESOURCES_LINKS = [
  { key: 'nav.resourceLinks.docs', to: '/support' },
  { key: 'nav.resourceLinks.help', to: '/support' },
  { key: 'nav.resourceLinks.blog', to: '/blog' },
];

export default function LandingNav() {
  const { t, lang, setLang, langs } = useI18n();
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

  const NAV_ITEMS = [
    { id: 'platform', label: t('nav.platform'), mega: true, links: PLATFORM_LINKS, cols: 3 },
    { id: 'resources', label: t('nav.resources'), mega: false, links: RESOURCES_LINKS },
  ];

  return (
    <header ref={navRef} className={`sticky top-0 z-50 transition-all ${scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-border shadow-sm' : 'bg-white/80 backdrop-blur-md'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
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
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t(group.group)}</p>
                          {group.items.map((it) => (
                            <a key={it.key} href={it.href || '#'} className="flex items-start gap-3 px-2.5 py-2.5 rounded-xl hover:bg-surface transition-colors">
                              <span className="text-lg leading-none mt-0.5">{it.icon}</span>
                              <div><p className="text-sm font-semibold text-foreground">{t(`${it.key}.label`)}</p><p className="text-xs text-muted-foreground">{t(`${it.key}.desc`)}</p></div>
                            </a>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="absolute left-0 top-full mt-2 w-[320px] bg-white rounded-2xl border border-border shadow-2xl p-3">
                      {item.links.map((it) => (
                        <Link key={it.key} to={it.to} className="block px-3 py-2.5 rounded-xl hover:bg-surface transition-colors">
                          <p className="text-sm font-semibold text-foreground">{t(`${it.key}.label`)}</p>
                          <p className="text-xs text-muted-foreground">{t(`${it.key}.desc`)}</p>
                        </Link>
                      ))}
                    </div>
                  )
                )}
              </div>
            ))}
            <a href="#tarifs" className="px-3.5 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-full">{t('nav.pricing')}</a>
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-foreground hover:text-brand transition-colors rounded-full">{t('nav.login')}</Link>
            <Link to="/register" className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-brand/90 transition-colors shadow-lg shadow-brand/20">
              {t('nav.freeTrial')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <div className="relative ml-1">
              <button onClick={() => setLangOpen((o) => !o)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-full">
                <Globe className="w-4 h-4" />
                <span className="text-base">{lang.flag}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl border border-border shadow-2xl p-2">
                  {langs.map((l) => (
                    <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-surface transition-colors ${lang.code === l.code ? 'bg-surface font-semibold text-foreground' : 'text-muted-foreground'}`}>
                      <span className="text-base">{l.flag}</span> {l.label}
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
                        <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1.5">{t(g.group)}</p>
                        {g.items.map((i) => (
                          <a key={i.key} href={i.href || '#'} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 text-sm text-foreground">
                            <span>{i.icon}</span> {t(`${i.key}.label`)}
                          </a>
                        ))}
                      </div>
                    )) : item.links.map((i) => (
                      <Link key={i.key} to={i.to} onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-foreground">{t(`${i.key}.label`)}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <a href="#tarifs" onClick={() => setMobileOpen(false)} className="block py-3 text-sm font-semibold text-foreground">{t('nav.pricing')}</a>
            <div className="flex flex-wrap items-center gap-2 py-2">
              {langs.map((l) => <button key={l.code} onClick={() => setLang(l.code)} className={`text-lg px-1 ${lang.code === l.code ? 'opacity-100' : 'opacity-50'}`}>{l.flag}</button>)}
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="py-2.5 text-center text-sm font-semibold text-foreground border border-border rounded-full">{t('nav.login')}</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="py-2.5 text-center text-sm font-semibold bg-brand text-brand-foreground rounded-full">{t('nav.freeTrial')}</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}