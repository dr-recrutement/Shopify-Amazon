import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useLang } from '../lib/i18n';
import {
  ShoppingBag, Globe, Smartphone, Bot, BarChart3, Palette, Zap, Shield,
  CheckCircle2, ArrowRight, Star, Truck, CreditCard, MessageCircle, TrendingUp, Sparkles,
  ChevronLeft, ChevronRight, Check
} from 'lucide-react';

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function CountUp({ end, suffix = '' }: { end: number; suffix?: string }) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1500;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setVal(Math.floor(Math.pow(p, 2) * end));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, end]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

function Section({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(32px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// 7 multi-tenant mock boutiques with titles, custom designs, taglines, and animations
const boutiques = [
  {
    id: 1,
    title: "Afrik'Couture",
    location: "Abidjan, Côte d'Ivoire 🇨🇮",
    tagline: "Haute couture & créations d'exception en tissus Wax authentiques.",
    themeColor: "from-[#B07C2D] to-[#111827]",
    animationClass: "animate-fade-in-up",
    bgPattern: "radial-gradient(circle, #FCF7ED 0%, #E6DFD3 100%)",
    textColor: "text-[#B07C2D]",
    badge: "Luxe & Tradition",
    products: [
      { name: "Robe de Gala Impériale", price: "85,000 FCFA" },
      { name: "Veste croisée Wax Gold", price: "45,000 FCFA" }
    ]
  },
  {
    id: 2,
    title: "Kente Heritage",
    location: "Accra, Ghana 🇬🇭",
    tagline: "L'authenticité et la noblesse du tissage Kente royal fait main.",
    themeColor: "from-[#EF6B2A] to-[#0F766E]",
    animationClass: "scale-105 transition-transform duration-1000",
    bgPattern: "linear-gradient(135deg, #FFF9F2 0%, #FFEEDD 100%)",
    textColor: "text-[#EF6B2A]",
    badge: "Héritage Royal",
    products: [
      { name: "Pagne Kente d'apparat 6 yards", price: "2,400 GHS" },
      { name: "Écharpe d'honneur tissée", price: "350 GHS" }
    ]
  },
  {
    id: 3,
    title: "Sahara Treasures",
    location: "Marrakech, Maroc 🇲🇦",
    tagline: "Poteries d'art, tapis berbères authentiques et huiles cosmétiques précieuses.",
    themeColor: "from-[#F59E0B] to-[#78350F]",
    animationClass: "translate-x-0 transition-transform duration-700",
    bgPattern: "radial-gradient(circle, #FFFbeb 0%, #FEF3C7 100%)",
    textColor: "text-[#D97706]",
    badge: "Artisanat d'Art",
    products: [
      { name: "Tapis Berbère Kilim", price: "3,200 MAD" },
      { name: "Coffret Huile d'Argan Bio", price: "450 MAD" }
    ]
  },
  {
    id: 4,
    title: "Kilimanjaro Coffee",
    location: "Arusha, Tanzanie 🇹🇿",
    tagline: "Café d'exception 100% Arabica torréfié artisanalement au pied du volcan.",
    themeColor: "from-green-700 to-amber-900",
    animationClass: "skew-y-0 transition-all duration-500",
    bgPattern: "linear-gradient(135deg, #F4FBF7 0%, #D1E7DD 100%)",
    textColor: "text-green-700",
    badge: "100% Bio & Équitable",
    products: [
      { name: "Café Bourbon Noir (1kg)", price: "48,000 TZS" },
      { name: "Coffret Dégustation Origine", price: "25,000 TZS" }
    ]
  },
  {
    id: 5,
    title: "Dakar Cosmetics",
    location: "Dakar, Sénégal 🇸🇳",
    tagline: "Soins capillaires et corporels bio formulés au pur beurre de karité.",
    themeColor: "from-pink-500 to-indigo-900",
    animationClass: "animate-pulse",
    bgPattern: "linear-gradient(135deg, #FFF0F5 0%, #FFE4E1 100%)",
    textColor: "text-pink-600",
    badge: "Cosmétique Naturelle",
    products: [
      { name: "Lait Corporel Karité & Baobab", price: "12,500 FCFA" },
      { name: "Masque Capillaire Nutrition", price: "8,900 FCFA" }
    ]
  },
  {
    id: 6,
    title: "Nairobi Tech Space",
    location: "Nairobi, Kenya 🇰🇪",
    tagline: "Innovations technologiques et accessoires connectés pensés pour l'Afrique.",
    themeColor: "from-blue-600 to-cyan-500",
    animationClass: "hover:scale-102 transition-transform",
    bgPattern: "linear-gradient(135deg, #F0F8FF 0%, #E6F2FF 100%)",
    textColor: "text-blue-600",
    badge: "Smart Africa",
    products: [
      { name: "Chargeur Solaire Waterproof 20k", price: "4,500 KES" },
      { name: "Écouteurs Bantu ANC v5.2", price: "3,800 KES" }
    ]
  },
  {
    id: 7,
    title: "Bantu Flavors",
    location: "Douala, Cameroun 🇨🇲",
    tagline: "Poivre de Penja rare, épices secrètes de la forêt équatoriale et thés locaux.",
    themeColor: "from-amber-600 to-red-800",
    animationClass: "rotate-0 transition-transform duration-700",
    bgPattern: "linear-gradient(135deg, #FFFDF0 0%, #FFF9C4 100%)",
    textColor: "text-amber-700",
    badge: "Gourmet Africain",
    products: [
      { name: "Poivre de Penja Blanc IGP (250g)", price: "15,000 FCFA" },
      { name: "Mélange d'Épices Nkui Sauvage", price: "5,000 FCFA" }
    ]
  }
];

const features = [
  { icon: ShoppingBag, title: 'Boutique en ligne complète', desc: 'Catalogue, variantes, stock, collections — tout ce dont vous avez besoin pour vendre en ligne.' },
  { icon: Bot, title: 'IA agentique intégrée', desc: 'Descriptions produits, bannières, publicités, vidéos TikTok, chatbot 24/7 — générés par IA.' },
  { icon: CreditCard, title: 'Mobile Money natif', desc: 'Flutterwave, Paystack, Orange Money, MTN MoMo, Wave, Stripe, PayPal — connectez vos propres comptes.' },
  { icon: Globe, title: '54 pays africains', desc: 'Multi-devises, multi-langues (FR/EN), marchés régionaux ou panafricains, livraison informelle.' },
  { icon: Palette, title: 'Moteur de thème universel', desc: 'Éditeur visuel drag & drop, bibliothèque de blocs modulaires, landing page, e-commerce, vitrine, marketplace.' },
  { icon: BarChart3, title: 'Analytics & comptabilité', desc: 'Ventes, prévisions de stock, rapports financiers, assistant comptable IA, export PDF/Excel.' },
  { icon: MessageCircle, title: 'Boîte de réception unifiée', desc: 'WhatsApp Business, Messenger, Telegram, chat interne — tous vos canaux dans une seule boîte.' },
  { icon: Shield, title: 'Sécurité multi-tenant', desc: 'Isolation RLS, MFA, RBAC granulaire, audit, anti-fraude, chiffrement bout en bout.' },
];

const testimonials = [
  { name: 'Aïcha Diallo', shop: 'Boutique Aïcha', country: "🇨🇮 Côte d'Ivoire", text: "J'ai lancé ma boutique en 10 minutes. Le Mobile Money était configuré immédiatement, et l'IA a rédigé toutes mes descriptions produits." },
  { name: 'Kwame Mensah', shop: 'Accra Tech Hub', country: '🇬🇭 Ghana', text: "Enfin une plateforme pensée pour l'Afrique. Aucune commission, mes paiements arrivent directement sur mon compte Paystack." },
  { name: 'Fatou Ndiaye', shop: 'Fatou Couture', country: '🇸🇳 Sénégal', text: "L'éditeur de thème est magnifique. Ma boutique a l'air d'une marque internationale, et le chatbot IA répond à mes clients la nuit." },
];

const stats = [
  { value: 12000, suffix: '+', label: 'Boutiques actives' },
  { value: 54, suffix: '', label: 'Pays couverts' },
  { value: 8, suffix: 'M+', label: 'Vendeurs accompagnés' },
  { value: 0, suffix: '%', label: 'Commission sur ventes' },
];

const faqs = [
  { q: 'Os prélève-t-il une commission sur mes ventes ?', a: 'Non. Jamais. Aucune commission, quel que soit votre plan. Les paiements clients vont directement dans votre propre compte (Flutterwave, Paystack, Orange Money, etc.).' },
  { q: 'Combien de temps pour créer ma boutique ?', a: 'Moins de 10 minutes. Notre onboarding guidé vous accompagne : compte, nom, localisation, thème, premier produit, moyen de paiement, plan — puis votre boutique est en ligne.' },
  { q: 'Puis-je vendre dans plusieurs pays ?', a: 'Oui. Le module Markets couvre de nombreux pays avec leurs devises locales. Activez les marchés que vous souhaitez desservir.' },
  { q: "L'IA est-elle vraiment incluse ?", a: 'Oui. Génération de descriptions, logos, bannières, publicités Facebook/Instagram, vidéos TikTok, chatbot client, assistant comptable — selon votre plan.' },
  { q: 'Quels moyens de paiement sont supportés ?', a: 'Flutterwave, Paystack, Orange Money, MTN MoMo, Wave, CinetPay, Stripe, PayPal, plus un champ générique pour toute autre passerelle. Vous connectez vos propres identifiants API.' },
  { q: 'Pourquoi Os est-il différent ?', a: "Parce qu'il est conçu et développé par LiAfrik basée à Dubai & Afrique, pour les réalités du commerce — pas adapté après coup. Mobile Money natif, connexions faibles optimisées, adressage local." },
];

export default function LandingPage() {
  const { t } = useLang();

  // Interactive carousel states
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselTimer = useRef<NodeJS.Timeout | null>(null);

  // Stateful monthly/annual billing toggle
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const startCarousel = () => {
    stopCarousel();
    carouselTimer.current = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % boutiques.length);
    }, 4500);
  };

  const stopCarousel = () => {
    if (carouselTimer.current) clearInterval(carouselTimer.current);
  };

  useEffect(() => {
    startCarousel();
    return () => stopCarousel();
  }, []);

  const handlePrevSlide = () => {
    stopCarousel();
    setActiveSlide(prev => (prev === 0 ? boutiques.length - 1 : prev - 1));
    startCarousel();
  };

  const handleNextSlide = () => {
    stopCarousel();
    setActiveSlide(prev => (prev + 1) % boutiques.length);
    startCarousel();
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar transparent />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-gradient-to-b from-brand-50/50 via-white to-white">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Column: Headline and CTA */}
            <div className="lg:col-span-6 text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-100 text-brand-800 rounded-full text-sm font-semibold mb-6 animate-bounce">
                <Star size={14} fill="currentColor" className="text-brand-600" /> {t('hero.badge')}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.05] tracking-tight">
                {t('hero.title1')}<br />
                <span className="italic text-brand-600 font-bold">{t('hero.title2')}</span><br />
                {t('hero.title3')}
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-xl leading-relaxed">
                {t('hero.subtitle')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-brand-600/20">
                  {t('hero.cta.start')} <ArrowRight size={18} />
                </Link>
                <Link to="/pricing" className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl border border-gray-200 hover:border-gray-300 transition-all hover:scale-[1.03] active:scale-95">
                  {t('hero.cta.pricing')}
                </Link>
              </div>
              <p className="mt-4 text-xs text-gray-500">{t('hero.trial')}</p>
            </div>

            {/* Right Column: Stunning Interactive 7-Boutique Carousel with custom designs & animations */}
            <div className="lg:col-span-6">
              <div className="relative bg-white rounded-3xl p-6 border border-gray-100 shadow-2xl hover:shadow-brand-100 transition-all duration-300">

                {/* Visual Slide */}
                <div
                  className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-500 ${boutiques[activeSlide].animationClass}`}
                  style={{ background: boutiques[activeSlide].bgPattern, minHeight: '340px' }}
                >
                  {/* Floating active shop badge */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                    <span className={boutiques[activeSlide].textColor}>{boutiques[activeSlide].badge}</span>
                  </div>

                  <div className="text-left mt-4">
                    <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">Boutique active</span>
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{boutiques[activeSlide].title}</h3>
                    <p className="text-xs font-semibold text-gray-600 flex items-center gap-1 mt-0.5">
                      <Globe size={12} /> {boutiques[activeSlide].location}
                    </p>
                    <p className="text-sm text-gray-700 mt-4 leading-relaxed font-medium">
                      "{boutiques[activeSlide].tagline}"
                    </p>
                  </div>

                  {/* Mock Interactive Store Layout */}
                  <div className="mt-6 border-t border-gray-200/50 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Produits en vedette</span>
                      <span className="text-[10px] text-gray-400">Paiement Mobile Money Activé ⚡</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {boutiques[activeSlide].products.map((prod, idx) => (
                        <div key={idx} className="bg-white/95 p-3 rounded-xl border border-gray-100 shadow-sm hover:translate-y-[-2px] transition-transform">
                          <div className="h-2 w-12 rounded bg-gray-200 mb-2" />
                          <div className="text-xs font-bold text-gray-800 line-clamp-1">{prod.name}</div>
                          <div className="text-xs font-extrabold text-brand-600 mt-1">{prod.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Carousel controls & slide selector */}
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevSlide}
                      className="p-2 bg-gray-100 hover:bg-brand-100 hover:text-brand-700 rounded-full transition-all"
                      title="Précédente"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={handleNextSlide}
                      className="p-2 bg-gray-100 hover:bg-brand-100 hover:text-brand-700 rounded-full transition-all"
                      title="Suivante"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Indicators */}
                  <div className="flex gap-1.5">
                    {boutiques.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { stopCarousel(); setActiveSlide(i); startCarousel(); }}
                        className={`h-2 rounded-full transition-all ${activeSlide === i ? 'w-6 bg-brand-600' : 'w-2 bg-gray-200 hover:bg-gray-300'}`}
                        title={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>

                  <span className="text-xs text-gray-400 font-semibold">{activeSlide + 1} / {boutiques.length}</span>
                </div>

              </div>
            </div>

          </div>

          {/* Stats Section with smooth entry */}
          <div className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <Section key={s.label} delay={i * 80}>
                <div className="text-center p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-lg transition-shadow">
                  <div className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                    <CountUp end={s.value} suffix={s.suffix} />
                  </div>
                  <p className="mt-2 text-sm text-gray-600 font-semibold">{s.label}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* Authentic Payment Badges Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Section className="text-center mb-10">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Compatible avec les paiements africains & internationaux
            </p>
          </Section>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 justify-center items-center">

            {/* Visa SVG */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-50 hover:border-brand-100 hover:shadow-sm transition-all grayscale opacity-60 hover:grayscale-0 hover:opacity-100 duration-300">
              <svg className="h-10 w-16" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 10H5L10 30H20L15 10Z" fill="#1A1F71"/>
                <path d="M40 10H32L35 22L38 10Z" fill="#F7B600"/>
                <path d="M30 10L24 30H30L36 10H30Z" fill="#1A1F71"/>
                <path d="M45 10L39 30H45L51 10H45Z" fill="#1A1F71"/>
                <path d="M60 10L54 30H60L66 10H60Z" fill="#F7B600"/>
                <text x="68" y="28" fill="#1A1F71" fontSize="22" fontWeight="bold">VISA</text>
              </svg>
              <span className="text-xs font-semibold text-gray-700 mt-2">Visa</span>
            </div>

            {/* MasterCard SVG */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-50 hover:border-brand-100 hover:shadow-sm transition-all grayscale opacity-60 hover:grayscale-0 hover:opacity-100 duration-300">
              <svg className="h-10 w-16" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="42" cy="20" r="16" fill="#EB001B"/>
                <circle cx="58" cy="20" r="16" fill="#F79E1B" fillOpacity="0.8"/>
                <text x="32" y="38" fill="#111" fontSize="10" fontWeight="extrabold">mastercard</text>
              </svg>
              <span className="text-xs font-semibold text-gray-700 mt-2">MasterCard</span>
            </div>

            {/* PayPal SVG */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-50 hover:border-brand-100 hover:shadow-sm transition-all grayscale opacity-60 hover:grayscale-0 hover:opacity-100 duration-300">
              <svg className="h-10 w-16" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M25 5H42C48 5 52 8 52 14C52 21 47 25 41 25H31L28 35H20L25 5Z" fill="#003087"/>
                <path d="M30 12H45C51 12 55 15 55 21C55 28 50 32 44 32H34L31 38H24L30 12Z" fill="#0079C1" opacity="0.85"/>
              </svg>
              <span className="text-xs font-semibold text-gray-700 mt-2">PayPal</span>
            </div>

            {/* Stripe SVG */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-50 hover:border-brand-100 hover:shadow-sm transition-all grayscale opacity-60 hover:grayscale-0 hover:opacity-100 duration-300">
              <svg className="h-10 w-16" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="10" y="28" fill="#635BFF" fontSize="28" fontWeight="bold">stripe</text>
              </svg>
              <span className="text-xs font-semibold text-gray-700 mt-2">Stripe</span>
            </div>

            {/* Flutterwave SVG */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-50 hover:border-brand-100 hover:shadow-sm transition-all grayscale opacity-60 hover:grayscale-0 hover:opacity-100 duration-300">
              <div className="w-10 h-10 rounded-full bg-[#FB923C] flex items-center justify-center font-black text-white text-base shadow-sm">
                F
              </div>
              <span className="text-xs font-semibold text-gray-700 mt-2">Flutterwave</span>
            </div>

            {/* Paystack SVG */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-50 hover:border-brand-100 hover:shadow-sm transition-all grayscale opacity-60 hover:grayscale-0 hover:opacity-100 duration-300">
              <div className="w-10 h-10 rounded-full bg-[#00C3F1] flex items-center justify-center font-black text-white text-base shadow-sm">
                P
              </div>
              <span className="text-xs font-semibold text-gray-700 mt-2">Paystack</span>
            </div>

            {/* Orange Money SVG */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-50 hover:border-brand-100 hover:shadow-sm transition-all grayscale opacity-60 hover:grayscale-0 hover:opacity-100 duration-300">
              <div className="w-10 h-10 rounded-xl bg-[#FF7900] flex items-center justify-center font-black text-white text-base shadow-sm">
                OM
              </div>
              <span className="text-xs font-semibold text-gray-700 mt-2">Orange Money</span>
            </div>

            {/* MTN MoMo SVG */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-50 hover:border-brand-100 hover:shadow-sm transition-all grayscale opacity-60 hover:grayscale-0 hover:opacity-100 duration-300">
              <div className="w-10 h-10 rounded-full bg-[#FFCC00] border-2 border-yellow-500 flex items-center justify-center font-black text-blue-900 text-xs shadow-sm">
                MoMo
              </div>
              <span className="text-xs font-semibold text-gray-700 mt-2">MTN MoMo</span>
            </div>

            {/* Wave SVG */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-50 hover:border-brand-100 hover:shadow-sm transition-all grayscale opacity-60 hover:grayscale-0 hover:opacity-100 duration-300">
              <div className="w-10 h-10 rounded-full bg-[#1B6EC2] flex items-center justify-center font-black text-white text-base shadow-sm">
                W
              </div>
              <span className="text-xs font-semibold text-gray-700 mt-2">Wave</span>
            </div>

          </div>
        </div>
      </section>

      {/* Why Os - mission */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Section>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-6">
              🌍 Conçu par LiAfrik basée à Dubai & Afrique 🌍
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Pourquoi Os ?</h2>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed font-medium">
              Os n'est pas une adaptation d'un outil étranger — c'est pensé et construit par LiAfrik basée à Dubai & Afrique, dès sa fondation. Mobile Money natif, connexions faibles optimisées, adressage local, multilinguisme FR/EN : chaque décision technique répond aux réalités du commerce moderne.
            </p>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: CreditCard, title: '0% de commission, à vie', desc: 'L\'argent va directement dans votre compte' },
                { icon: Smartphone, title: 'Mobile Money natif', desc: 'Orange, MTN, Wave, Flutterwave, Paystack, CinetPay' },
                { icon: Globe, title: 'Bilingue FR/EN', desc: 'Interface et contenu traduits' },
              ].map((c, i) => (
                <Section key={c.title} delay={i * 80}>
                  <div className="p-5 bg-white rounded-xl border border-gray-100 text-left hover:shadow-md transition-shadow">
                    <c.icon size={20} className="text-brand-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">{c.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
                  </div>
                </Section>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* Features with Hover animation scale */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Section className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Tout ce qu'il faut pour vendre en Afrique</h2>
            <p className="mt-4 text-gray-600">Une suite complète, pensée pour les réalités africaines — mobile money, connexions faibles, multilinguisme, livraison informelle.</p>
          </Section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <Section key={f.title} delay={(i % 4) * 80}>
                <div className="group h-full p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:border-brand-200 hover:-translate-y-2 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                    <f.icon size={22} className="text-brand-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing with billing period state (Monthly/Annual 15% Off) */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Section className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Des tarifs simples, sans commission</h2>
            <p className="mt-4 text-gray-600">Choisissez votre plan, bénéficiez de 7 jours d'essai gratuit. L'argent de vos ventes va directement dans votre compte.</p>

            {/* Landing Page billing period switch */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className={`text-sm font-semibold ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>
                Mensuel
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
                className="relative w-14 h-7 bg-brand-600 rounded-full transition-colors focus:outline-none"
              >
                <span
                  className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform ${
                    billingPeriod === 'annual' ? 'translate-x-7' : ''
                  }`}
                />
              </button>
              <span className={`text-sm font-semibold flex items-center gap-1.5 ${billingPeriod === 'annual' ? 'text-gray-900' : 'text-gray-400'}`}>
                Annuel
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  Économisez 15%
                </span>
              </span>
            </div>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Starter', price: 9, features: ['15 produits', 'Sous-domaine os.liafrik.com', '1 staff', '20 générations IA/mois', 'Marketing basique'] },
              { name: 'Premium', price: 19, popular: true, features: ['1000 produits', 'Domaine personnalisé', '5 staff', '200 générations IA/mois', 'Vidéos TikTok IA', 'Chatbot IA', 'Assistant comptable IA', 'Marketplace + badge vérifié'] },
              { name: 'Entreprise', price: 69, features: ['Produits illimités', 'Staff illimité', 'IA illimitée', 'Vidéos IA illimitées', 'API développeur', 'Support dédié + WhatsApp'] },
            ].map((p, i) => {
              const displayPrice = billingPeriod === 'monthly' ? p.price : parseFloat((p.price * 0.85).toFixed(2));
              const yearlyCost = (p.price * 12 * 0.85).toFixed(2);

              return (
                <Section key={p.name} delay={i * 80}>
                  <div className={`relative h-full p-8 rounded-2xl border-2 transition-all hover:-translate-y-2 flex flex-col justify-between ${p.popular ? 'border-brand-500 bg-white shadow-xl shadow-brand-100' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <div>
                      {p.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-600 text-white text-xs font-semibold rounded-full">Le plus populaire</div>
                      )}
                      <h3 className="text-2xl font-bold text-gray-900">{p.name}</h3>
                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-gray-900">${displayPrice}</span>
                        <span className="text-gray-500">/mois</span>
                      </div>
                      {billingPeriod === 'annual' ? (
                        <p className="mt-1 text-xs text-brand-600 font-bold">Facturé ${yearlyCost}/an (-15% inclus)</p>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500">Facturation mensuelle</p>
                      )}
                      <ul className="mt-6 space-y-3">
                        {p.features.map(feat => (
                          <li key={feat} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" /> {feat}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link to="/register" className={`mt-8 block text-center py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-95 ${p.popular ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                      Commencer
                    </Link>
                  </div>
                </Section>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Section className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Ils vendent déjà avec Os</h2>
          </Section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((tm, i) => (
              <Section key={tm.name} delay={i * 80}>
                <div className="h-full p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} size={14} className="text-brand-500" fill="currentColor" />)}
                  </div>
                  <p className="text-gray-700 leading-relaxed font-medium">"{tm.text}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-semibold text-brand-700">
                      {tm.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{tm.name}</div>
                      <div className="text-xs text-gray-500">{tm.shop} · {tm.country}</div>
                    </div>
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, label: 'Livraison flexible', desc: 'Moto-taxi, coursier, transporteur' },
            { icon: CreditCard, label: 'Paiements directs', desc: 'Mobile Money + cartes internationales' },
            { icon: Smartphone, label: 'PWA installable', desc: 'Android, iOS, hors-ligne partiel' },
            { icon: Zap, label: 'Optimisé connexions lentes', desc: 'CDN, images compressées' },
          ].map((b, i) => (
            <Section key={b.label} delay={i * 80}>
              <div className="flex items-start gap-3">
                <b.icon size={22} className="text-brand-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{b.label}</div>
                  <div className="text-xs text-gray-500">{b.desc}</div>
                </div>
              </div>
            </Section>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Section className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Questions fréquentes</h2>
          </Section>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <Section key={i} delay={i * 60}>
                <details className="group p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <summary className="flex items-center justify-between cursor-pointer font-semibold text-gray-900 list-none">
                    {f.q}
                    <span className="ml-4 text-brand-600 group-open:rotate-45 transition-transform text-xl">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{f.a}</p>
                </details>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500 rounded-full mix-blend-overlay filter blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-overlay filter blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Lancez votre boutique aujourd'hui</h2>
          <p className="mt-4 text-gray-300 text-lg">Rejoignez des milliers de vendeurs africains. 7 jours d'essai gratuit, sans carte bancaire.</p>
          <Link to="/register" className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all hover:scale-[1.02] active:scale-95 shadow-xl">
            Créer ma boutique gratuitement <ArrowRight size={18} />
          </Link>
          <p className="mt-6 text-xs text-gray-500 flex items-center justify-center gap-2"><Sparkles size={12} /> Conçu et développé par LiAfrik basée à Dubai & Afrique 🌍</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
