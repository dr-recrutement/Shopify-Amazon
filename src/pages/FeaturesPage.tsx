import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ShoppingBag, Bot, CreditCard, Globe, Palette, BarChart3, MessageCircle, Shield, Truck, Smartphone, Sparkles, Zap } from 'lucide-react';

const FEATURES = [
  { icon: ShoppingBag, title: 'Boutique en ligne complète', desc: 'Catalogue, variantes, stock, collections — tout ce dont vous avez besoin pour vendre en ligne.' },
  { icon: Bot, title: 'IA agentique intégrée', desc: 'Descriptions produits, logos, bannières, publicités, vidéos TikTok, chatbot 24/7 — générés par IA.' },
  { icon: CreditCard, title: 'Mobile Money natif', desc: 'Flutterwave, Paystack, Orange Money, MTN MoMo, CinetPay, Stripe, PayPal — connectez vos propres comptes.' },
  { icon: Globe, title: '54 pays africains', desc: 'Multi-devises, multi-langues (FR/EN), marchés régionaux ou panafricains, livraison informelle.' },
  { icon: Palette, title: 'Moteur de thème universel', desc: 'Éditeur visuel drag & drop, bibliothèque de blocs modulaires, landing page, e-commerce, vitrine, marketplace.' },
  { icon: BarChart3, title: 'Analytics & comptabilité', desc: 'Ventes, prévisions de stock, rapports financiers, assistant comptable IA, export PDF/Excel.' },
  { icon: MessageCircle, title: 'Boîte de réception unifiée', desc: 'WhatsApp Business, Messenger, Telegram, chat interne — tous vos canaux dans une seule boîte.' },
  { icon: Shield, title: 'Sécurité multi-tenant', desc: 'Isolation RLS, MFA, RBAC granulaire, audit, anti-fraude, chiffrement bout en bout.' },
  { icon: Truck, title: 'Livraison flexible', desc: 'Moto-taxi, coursier, transporteur, point relais — adaptez la livraison aux réalités locales.' },
  { icon: Smartphone, title: 'PWA installable', desc: 'Installez LiAfrikOS sur Android et iOS, fonctionne partiellement hors-ligne.' },
  { icon: Zap, title: 'Optimisé connexions faibles', desc: 'CDN global, images compressées, chargement progressif — performant même en 3G.' },
  { icon: Sparkles, title: '0% de commission', desc: 'L\'argent de vos ventes va directement dans votre compte. Sans intermédiaire, sans commission, à vie.' },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">Fonctionnalités</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Tout ce dont vous avez besoin pour vendre en Afrique — Mobile Money natif, IA intégrée, 0% commission.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="group p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:border-orange-200 transition-all">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                  <Icon size={22} className="text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
