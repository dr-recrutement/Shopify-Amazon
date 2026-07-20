import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useLang } from '../lib/i18n';
import {
  ShoppingBag, Globe, Smartphone, Bot, BarChart3, Palette, Zap, Shield,
  CheckCircle2, ArrowRight, Star, Truck, CreditCard, MessageCircle, TrendingUp, Sparkles
} from 'lucide-react';

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.15 });
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
      className={`${className} transition-all duration-500 ease-out`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const features = [
  { icon: ShoppingBag, title: 'Boutique en ligne complète', desc: 'Catalogue, variantes, stock, collections — tout ce dont vous avez besoin pour vendre en ligne.' },
  { icon: Bot, title: 'IA agentique intégrée', desc: 'Descriptions produits, logos, bannières, publicités, vidéos TikTok, chatbot 24/7 — générés par IA.' },
  { icon: CreditCard, title: 'Mobile Money natif', desc: 'Flutterwave, Paystack, Orange Money, MTN MoMo, CinetPay, Stripe, PayPal — connectez vos propres comptes.' },
  { icon: Globe, title: '54 pays africains', desc: 'Multi-devises, multi-langues (FR/EN), marchés régionaux ou panafricains, livraison informelle.' },
  { icon: Palette, title: 'Moteur de thème universel', desc: 'Éditeur visuel drag & drop, bibliothèque de blocs modulaires, landing page, e-commerce, vitrine, marketplace.' },
  { icon: BarChart3, title: 'Analytics & comptabilité', desc: 'Ventes, prévisions de stock, rapports financiers, assistant comptable IA, export PDF/Excel.' },
  { icon: MessageCircle, title: 'Boîte de réception unifiée', desc: 'WhatsApp Business, Messenger, Telegram, chat interne — tous vos canaux dans une seule boîte.' },
  { icon: Shield, title: 'Sécurité multi-tenant', desc: 'Isolation RLS, MFA, RBAC granulaire, audit, anti-fraude, chiffrement bout en bout.' },
];

const testimonials = [
  { name: 'Aïcha Diallo', shop: 'Boutique Aïcha', country: "🇨🇮 Côte d'Ivoire", text: "J'ai lancé ma boutique en 10 minutes. Le Mobile Money était configuré immédiatement, et l'IA a rédigé toutes mes descriptions produits." },
  { name: 'Kwame Mensah', shop: 'Accra Tech Hub', country: '🇬🇭 Ghana', text: "Enfin une plateforme pensée pour l'Afrique. Aucune commission, mes paiements arrivent directement sur mon compte Paystack." },
  { name: 'Fatou Ndiaye', shop: 'Fatou Couture', country: '🇸🇳 Sénégal', text: "L'éditeur de thème est magnifique. Ma boutique a l'air d'une marque internationale, et le chatbot IA répond mes clients la nuit." },
];

const stats = [
  { value: 12000, suffix: '+', label: 'Boutiques actives' },
  { value: 54, suffix: '', label: 'Pays couverts' },
  { value: 8, suffix: 'M+', label: 'Vendeurs accompagnés' },
  { value: 0, suffix: '%', label: 'Commission sur ventes' },
];

const paymentLogos = [
  { name: 'Flutterwave', color: '#F5A623' },
  { name: 'Paystack', color: '#00C3F1' },
  { name: 'Orange Money', color: '#FF7900' },
  { name: 'MTN MoMo', color: '#FFCC00' },
  { name: 'CinetPay', color: '#1B6EC2' },
  { name: 'Stripe', color: '#635BFF' },
  { name: 'PayPal', color: '#003087' },
];

const faqs = [
  { q: 'LiAfrikOS prélève-t-il une commission sur mes ventes ?', a: 'Non. Jamais. Aucune commission, quel que soit votre plan. Les paiements clients vont directement dans votre propre compte (Flutterwave, Paystack, Orange Money, etc.).' },
  { q: 'Combien de temps pour créer ma boutique ?', a: 'Moins de 10 minutes. Notre onboarding guidé vous accompagne : compte, nom, localisation, thème, premier produit, moyen de paiement, plan — puis votre boutique est en ligne.' },
  { q: 'Puis-je vendre dans plusieurs pays africains ?', a: 'Oui. Le module Markets couvre les 54 pays africains avec leurs devises locales. Activez les marchés que vous souhaitez desservir.' },
  { q: "L'IA est-elle vraiment incluse ?", a: 'Oui. Génération de descriptions, logos, bannières, publicités Facebook/Instagram, vidéos TikTok, chatbot client, assistant comptable — selon votre plan (20 à illimité par mois).' },
  { q: 'Quels moyens de paiement sont supportés ?', a: 'Flutterwave, Paystack, Orange Money, MTN MoMo, CinetPay, Stripe, PayPal, plus un champ générique pour toute autre passerelle. Vous connectez vos propres identifiants API.' },
  { q: 'Pourquoi LiAfrikOS est-il différent ?', a: "Parce qu'il est conçu et développé au Cameroun par LIYAH GROUP, pour les réalités africaines — pas adapté après coup. Mobile Money natif, connexions faibles optimisées, adressage local." },
];

export default function LandingPage() {
  const { t } = useLang();
  return (
    <div className="min-h-screen bg-white">
      <Navbar transparent />

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-gradient-to-b from-orange-50/50 via-white to-white">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-6">
              <Star size={14} fill="currentColor" /> {t('hero.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-semibold text-gray-900 leading-[1.05] tracking-tight">
              {t('hero.title1')}<br />
              <span className="italic text-orange-600 font-semibold">{t('hero.title2')}</span><br />
              {t('hero.title3')}
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-orange-600/20">
                {t('hero.cta.start')} <ArrowRight size={18} />
              </Link>
              <Link to="/pricing" className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl border border-gray-200 hover:border-gray-300 transition-all hover:scale-[1.02] active:scale-95">
                {t('hero.cta.pricing')}
              </Link>
            </div>
            <p className="mt-4 text-xs text-gray-500">{t('hero.trial')}</p>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <Section key={s.label} delay={i * 80}>
                <div className="text-center">
                  <div className="text-4xl lg:text-5xl font-semibold text-gray-900 tracking-tight">
                    <CountUp end={s.value} suffix={s.suffix} />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{s.label}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* Payment logos trust badge */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Section className="text-center mb-10">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Compatible avec les paiements africains & internationaux</p>
          </Section>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6 items-center">
            {paymentLogos.map((p, i) => (
              <Section key={p.name} delay={i * 60}>
                <div className="flex flex-col items-center justify-center h-16 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm mb-1" style={{ backgroundColor: p.color }}>
                    {p.name.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{p.name}</span>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* Why LiAfrikOS - mission */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Section>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
              🇨🇲 Conçu au Cameroun — pour toute l'Afrique
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight">Pourquoi LiAfrikOS ?</h2>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              LiAfrikOS n'est pas une adaptation d'un outil étranger — c'est pensé et construit depuis l'Afrique, pour l'Afrique, dès sa fondation. Mobile Money natif, connexions faibles optimisées, adressage local, multilinguisme FR/EN : chaque décision technique répond aux réalités du commerce africain.
            </p>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: CreditCard, title: '0% de commission, à vie', desc: 'L\'argent va directement dans votre compte' },
                { icon: Smartphone, title: 'Mobile Money natif', desc: 'Orange, MTN, Flutterwave, Paystack, CinetPay' },
                { icon: Globe, title: 'Bilingue FR/EN', desc: 'Interface et contenu traduits' },
              ].map((c, i) => (
                <Section key={c.title} delay={i * 80}>
                  <div className="p-5 bg-white rounded-xl border border-gray-100 text-left">
                    <c.icon size={20} className="text-orange-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">{c.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
                  </div>
                </Section>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Section className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight">Tout ce qu'il faut pour vendre en Afrique</h2>
            <p className="mt-4 text-gray-600">Une suite complète, pensée pour les réalités africaines — mobile money, connexions faibles, multilinguisme, livraison informelle.</p>
          </Section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <Section key={f.title} delay={(i % 4) * 80}>
                <div className="group h-full p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:border-orange-200 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                    <f.icon size={22} className="text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Section className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight">Des tarifs simples, sans commission</h2>
            <p className="mt-4 text-gray-600">Choisissez votre plan, bénéficiez de 7 jours d'essai gratuit. L'argent de vos ventes va directement dans votre compte.</p>
          </Section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Starter', price: 9, features: ['15 produits', 'Sous-domaine LiAfrikOS', '1 staff', '20 générations IA/mois', 'Marketing basique'] },
              { name: 'Premium', price: 19, popular: true, features: ['1000 produits', 'Domaine personnalisé', '5 staff', '200 générations IA/mois', 'Vidéos TikTok IA', 'Chatbot IA', 'Assistant comptable IA', 'Marketplace + badge vérifié'] },
              { name: 'Entreprise', price: 69, features: ['Produits illimités', 'Staff illimité', 'IA illimitée', 'Vidéos IA illimitées', 'API développeur', 'Support dédié + WhatsApp'] },
            ].map((p, i) => (
              <Section key={p.name} delay={i * 80}>
                <div className={`relative h-full p-8 rounded-2xl border-2 transition-all hover:-translate-y-1 ${p.popular ? 'border-orange-500 bg-white shadow-xl shadow-orange-100' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-600 text-white text-xs font-semibold rounded-full">Le plus populaire</div>
                  )}
                  <h3 className="text-2xl font-semibold text-gray-900">{p.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold text-gray-900">${p.price}</span>
                    <span className="text-gray-500">/mois</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {p.features.map(feat => (
                      <li key={feat} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" /> {feat}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className={`mt-8 block text-center py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-95 ${p.popular ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                    Commencer
                  </Link>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Section className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight">Ils vendent déjà avec LiAfrikOS</h2>
          </Section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((tm, i) => (
              <Section key={tm.name} delay={i * 80}>
                <div className="h-full p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} size={14} className="text-orange-500" fill="currentColor" />)}
                  </div>
                  <p className="text-gray-700 leading-relaxed">"{tm.text}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-semibold text-orange-700">
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
                <b.icon size={22} className="text-orange-600 flex-shrink-0 mt-1" />
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
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight">Questions fréquentes</h2>
          </Section>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <Section key={i} delay={i * 60}>
                <details className="group p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900 list-none">
                    {f.q}
                    <span className="ml-4 text-orange-600 group-open:rotate-45 transition-transform text-xl">+</span>
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
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-overlay filter blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500 rounded-full mix-blend-overlay filter blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight">Lancez votre boutique aujourd'hui</h2>
          <p className="mt-4 text-gray-300 text-lg">Rejoignez des milliers de vendeurs africains. 7 jours d'essai gratuit, sans carte bancaire.</p>
          <Link to="/register" className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-all hover:scale-[1.02] active:scale-95 shadow-xl">
            Créer ma boutique gratuitement <ArrowRight size={18} />
          </Link>
          <p className="mt-6 text-xs text-gray-500 flex items-center justify-center gap-2"><Sparkles size={12} /> Conçu et développé au Cameroun 🇨🇲 par LIYAH GROUP</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
