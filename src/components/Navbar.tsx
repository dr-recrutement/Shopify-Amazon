import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { useLang } from '../lib/i18n';
import { Menu, X, ChevronDown, Globe, Sparkles } from 'lucide-react';

interface NavbarProps {
  transparent?: boolean;
}

export function Navbar({ transparent = false }: NavbarProps) {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const loc = useLocation();

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('platform_theme') || 'ocean';
    }
    return 'ocean';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('platform_theme', theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); setDropdown(null); }, [loc.pathname]);

  const featuresItems = [
    { to: '/features', label: t('nav.ia'), desc: 'IA agentique intégrée' },
    { to: '/features', label: t('nav.design'), desc: 'Éditeur de thème premium' },
    { to: '/features', label: t('nav.payments'), desc: 'Mobile Money + cartes' },
    { to: '/features', label: t('nav.delivery'), desc: 'Livraison flexible' },
  ];
  const resourcesItems = [
    { to: '/blog', label: t('nav.blog') },
    { to: '/academy', label: t('nav.academy') },
    { to: '/help', label: t('nav.help') },
  ];

  const bg = transparent && !scrolled ? 'bg-transparent' : 'bg-white/95 backdrop-blur-md border-b border-gray-100';
  const linkColor = transparent && !scrolled ? 'text-gray-800' : 'text-gray-700';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${bg} transition-all duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0"><Logo /></Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link to="/marketplace" className={`px-3 py-2 text-sm font-medium ${linkColor} hover:text-brand-600 transition-colors`}>{t('nav.marketplace')}</Link>
            <Link to="/pricing" className={`px-3 py-2 text-sm font-medium ${linkColor} hover:text-brand-600 transition-colors`}>{t('nav.pricing')}</Link>

            <div className="relative" onMouseEnter={() => setDropdown('features')} onMouseLeave={() => setDropdown(null)}>
              <button className={`flex items-center gap-1 px-3 py-2 text-sm font-medium ${linkColor} hover:text-brand-600 transition-colors`}>
                {t('nav.features')} <ChevronDown size={14} className={`transition-transform ${dropdown === 'features' ? 'rotate-180' : ''}`} />
              </button>
              {dropdown === 'features' && (
                <div className="absolute top-full left-0 pt-2 w-64">
                  <div className="bg-white rounded-xl border border-gray-100 shadow-lg py-2">
                    {featuresItems.map((it, i) => (
                      <Link key={i} to={it.to} className="block px-4 py-2 hover:bg-gray-50">
                        <div className="text-sm font-medium text-gray-900">{it.label}</div>
                        <div className="text-xs text-gray-500">{it.desc}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" onMouseEnter={() => setDropdown('resources')} onMouseLeave={() => setDropdown(null)}>
              <button className={`flex items-center gap-1 px-3 py-2 text-sm font-medium ${linkColor} hover:text-brand-600 transition-colors`}>
                {t('nav.resources')} <ChevronDown size={14} className={`transition-transform ${dropdown === 'resources' ? 'rotate-180' : ''}`} />
              </button>
              {dropdown === 'resources' && (
                <div className="absolute top-full left-0 pt-2 w-48">
                  <div className="bg-white rounded-xl border border-gray-100 shadow-lg py-2">
                    {resourcesItems.map((it, i) => (
                      <Link key={i} to={it.to} className="block px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50">{it.label}</Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link to="/about" className={`px-3 py-2 text-sm font-medium ${linkColor} hover:text-brand-600 transition-colors`}>{t('nav.about')}</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {/* Theme selector */}
            <div className="flex items-center gap-2 bg-gray-100 px-2.5 py-1.5 rounded-full border border-gray-200">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Thème:</span>
              <button
                onClick={() => setTheme('ocean')}
                title="Bleu Océan"
                className={`w-4.5 h-4.5 rounded-full transition-all ${theme === 'ocean' ? 'ring-2 ring-blue-600 scale-115' : 'opacity-50 hover:opacity-100'}`}
                style={{ backgroundColor: '#0369A1', width: '16px', height: '16px' }}
              />
              <button
                onClick={() => setTheme('coral')}
                title="Corail Éclatant"
                className={`w-4.5 h-4.5 rounded-full transition-all ${theme === 'coral' ? 'ring-2 ring-orange-500 scale-115' : 'opacity-50 hover:opacity-100'}`}
                style={{ backgroundColor: '#FF6B35', width: '16px', height: '16px' }}
              />
            </div>

            {/* Language picker */}
            <div className="relative">
              <button onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <Globe size={16} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{lang.toUpperCase()}</span>
                <ChevronDown size={12} className="text-gray-400" />
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg border border-gray-100 shadow-lg py-1 z-20">
                    <button onClick={() => { setLang('fr'); setLangOpen(false); }} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${lang === 'fr' ? 'text-brand-600 font-medium' : 'text-gray-700'}`}>Français</button>
                    <button onClick={() => { setLang('en'); setLangOpen(false); }} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${lang === 'en' ? 'text-brand-600 font-medium' : 'text-gray-700'}`}>English</button>
                  </div>
                </>
              )}
            </div>

            <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-brand-600 px-3 py-2 rounded-lg transition-colors">{t('nav.login')}</Link>
            <Link to="/register" className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg transition-all hover:scale-[1.02] active:scale-95">{t('nav.register')}</Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1">
          <Link to="/marketplace" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded">{t('nav.marketplace')}</Link>
          <Link to="/pricing" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded">{t('nav.pricing')}</Link>
          <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">{t('nav.features')}</div>
          {featuresItems.map((it, i) => <Link key={i} to={it.to} className="block pl-6 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded">{it.label}</Link>)}
          <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">{t('nav.resources')}</div>
          {resourcesItems.map((it, i) => <Link key={i} to={it.to} className="block pl-6 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded">{it.label}</Link>)}
          <Link to="/about" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded">{t('nav.about')}</Link>

          {/* Mobile Theme Selector */}
          <div className="px-3 py-2 flex items-center justify-between border-t border-gray-100">
            <span className="text-sm font-medium text-gray-700">Thème :</span>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme('ocean')}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${theme === 'ocean' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
              >
                Bleu Océan
              </button>
              <button
                onClick={() => setTheme('coral')}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${theme === 'coral' ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
              >
                Corail
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="px-3 py-2 text-sm border border-gray-200 rounded-lg flex items-center gap-1"><Globe size={14} /> {lang === 'fr' ? 'EN' : 'FR'}</button>
            <Link to="/login" className="flex-1 text-center text-sm font-medium border border-gray-200 px-4 py-2 rounded-lg">{t('nav.login')}</Link>
            <Link to="/register" className="flex-1 text-center text-sm font-semibold text-white bg-brand-600 px-4 py-2 rounded-lg">{t('nav.register')}</Link>
          </div>
        </div>
      )}
    </header>
  );
}
