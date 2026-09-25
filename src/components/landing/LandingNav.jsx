import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, ArrowRight, Globe } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { COMPETITOR_LIST } from '@/lib/competitors';

const LANGS = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ar', label: 'العربية', flag: '🇦🇪' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

const PLATFORM_LINKS = [
  { group: 'Créer & Vendre', items: [
    { label: 'Éditeur de boutique', desc: 'Éditeur visuel drag & drop, sans code', icon: '🎨', href: '#fonctionnalites' },
    { label: 'Thèmes premium', desc: 'Des thèmes raffinés et personnalisables', icon: '✨', href: '#fonctionnalites' },
    { label: 'Checkout optimisé', desc: 'Tunnel d\u2019achat fluide, abandon réduit', icon: '🛒', href: '#fonctionnalites' },
  ]},
  { group: 'Gérer', items: [
    { label: 'Gestion des stocks', desc: 'Variantes, suivi, alertes', icon: '📦', href: '#fonctionnalites' },
    { label: 'Paiements intégrés', desc: 'Mobile money, cartes, virements — 25+ PSP', icon: '💳', href: '#fonctionnalites' },
    { label: 'Livraison multi-zones', desc: 'Tarifs par région & pays', icon: '🚚', href: '#fonctionnalites' },
    { label: 'Promotions & réductions', desc: 'Codes promo, remises automatiques', icon: '🏷️', href: '#fonctionnalites' },
  ]},
  { group: 'Croître', items: [
    { label: 'Analytics en temps réel', desc: 'Tableau de bord & rapports', icon: '📊', href: '#fonctionnalites' },
    { label: 'Multi-devises', desc: 'XOF, NGN, USD, EUR natifs', icon: '🌍', href: '#fonctionnalites' },
    { label: 'Sellia Assistant', desc: 'Génération de contenus & thèmes', icon: '🤖', href: '#fonctionnalites' },
  ]},
];

const RESOURCES_LINKS = [
  { label: 'Centre d\u2019aide', desc: 'FAQ & tutoriels', to: '/centre-aide' },
  { label: 'Guides', desc: 'Tendances e-commerce & migration', to: '/guides' },
  { label: 'À propos', desc: 'Notre mission et notre équipe', to: '/a-propos' },
  { label: 'Contact', desc: 'Support et service client', to: '/contact' },
];

// Comparison pages, surfaced directly in the main nav so a visitor
// searching "alternative à Shopify" (or any of the other five) finds the
// matching page in one click from anywhere on the site, not just via the
// footer.
const ALTERNATIVES_LINKS = COMPETITOR_LIST.map((c) => ({
  label: `Alternative à ${c.name}`,
  desc: `Sellia vs ${c.name} : comparatif complet`,
  to: `/alternative-a-${c.slug}`,
}));

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(null);
  const [mobileSection, setMobileSection] = useState(null);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState(LANGS[0]);
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
    { id: 'platform', label: 'Plateforme', mega: true, links: PLATFORM_LINKS, cols: 3 },
    { id: 'alternatives', label: 'Alternatives', mega: false, links: ALTERNATIVES_LINKS, wide: true },
    { id: 'resources', label: 'Ressources', mega: false, links: RESOURCES_LINKS },
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
                            <a key={it.label} href={it.href || '#'} className="flex items-start gap-3 px-2.5 py-2.5 rounded-xl hover:bg-surface transition-colors">
                              <span className="text-lg leading-none mt-0.5">{it.icon}</span>
                              <div><p className="text-sm font-semibold text-foreground">{it.label}</p><p className="text-xs text-muted-foreground">{it.desc}</p></div>
                            </a>
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
            <a href="#tarifs" className="px-3.5 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-full">Tarifs</a>
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-foreground hover:text-brand transition-colors rounded-full">Se connecter</Link>
            <Link to="/register" className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-brand/90 transition-colors shadow-lg shadow-brand/20">
              Essai gratuit <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {/* Language selector — extreme right */}
            <div className="relative ml-1">
              <button onClick={() => setLangOpen((o) => !o)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-full">
                <Globe className="w-4 h-4" />
                <span className="text-base">{lang.flag}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl border border-border shadow-2xl p-2">
                  {LANGS.map((l) => (
                    <button key={l.code} onClick={() => { setLang(l); setLangOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-surface transition-colors ${lang.code === l.code ? 'bg-surface font-semibold text-foreground' : 'text-muted-foreground'}`}>
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
                        <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1.5">{g.group}</p>
                        {g.items.map((i) => (
                          <a key={i.label} href={i.href || '#'} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 text-sm text-foreground">
                            <span>{i.icon}</span> {i.label}
                          </a>
                        ))}
                      </div>
                    )) : item.links.map((i) => (
                      <Link key={i.label} to={i.to} onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-foreground">{i.label}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <a href="#tarifs" onClick={() => setMobileOpen(false)} className="block py-3 text-sm font-semibold text-foreground">Tarifs</a>
            <div className="flex items-center gap-2 py-2">
              {LANGS.slice(0, 5).map((l) => <button key={l.code} onClick={() => setLang(l)} className={`text-lg px-1 ${lang.code === l.code ? 'opacity-100' : 'opacity-50'}`}>{l.flag}</button>)}
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="py-2.5 text-center text-sm font-semibold text-foreground border border-border rounded-full">Se connecter</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="py-2.5 text-center text-sm font-semibold bg-brand text-brand-foreground rounded-full">Essai gratuit</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}