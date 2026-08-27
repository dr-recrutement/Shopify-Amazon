import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card } from '../pages/dashboard/ui';
import { useLang } from '../lib/i18n';
import { Sparkles, Globe, CreditCard, Smartphone, Zap } from 'lucide-react';

export default function AboutPage() {
  const { lang } = useLang();
  const fr = lang === 'fr';
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
            🌍 Conçu par LiAfrik 🌍
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            {fr ? 'Notre histoire' : 'Our story'}
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            {fr
              ? "Sellia est né, conçu par LiAfrik pour les réalités du commerce mondial. Notre ambition : donner à chaque entrepreneur les mêmes outils que les plus grandes marques mondiales, sans barrière financière ni technique."
              : "Sellia was born, designed by LiAfrik for the realities of global commerce. Our ambition: to give every entrepreneur the same tools as the world's largest brands, without financial or technical barriers."}
          </p>
        </div>

        <Card className="p-8 mb-8 bg-gradient-to-br from-brand-50 to-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {fr ? 'Un manifeste, pas une adaptation' : 'A manifesto, not an adaptation'}
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {fr
              ? "Le commerce en ligne mérite des outils construits pour ses réalités, pas des traductions. Mobile Money, connexions variables, diversité linguistique, logistique locale — autant de contraintes que les outils étrangers ignorent ou traitent en annexe. Sellia les aborde dès la conception."
              : "Online commerce deserves tools built for its realities, not translations. Mobile Money, variable connections, linguistic diversity, local logistics — constraints that foreign tools ignore or treat as an afterthought. Sellia addresses them from the ground up."}
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[
            { icon: CreditCard, title: fr ? '0% de commission, à vie' : '0% commission, forever', desc: fr ? "L'argent va directement dans votre compte" : "Money goes directly to your account" },
            { icon: Smartphone, title: fr ? 'Mobile Money natif' : 'Native Mobile Money', desc: 'Orange, MTN, Flutterwave, Paystack, CinetPay' },
            { icon: Globe, title: fr ? 'Bilingue FR/EN' : 'Bilingual FR/EN', desc: fr ? 'Interface et contenu traduits' : 'Translated interface and content' },
            { icon: Zap, title: fr ? 'Optimisé connexions faibles' : 'Optimized for slow connections', desc: fr ? 'CDN, images compressées, PWA' : 'CDN, compressed images, PWA' },
          ].map((c, i) => (
            <Card key={i} className="p-5 flex items-start gap-3">
              <c.icon size={20} className="text-brand-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">{c.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-8 text-center bg-gray-900 text-white">
          <Sparkles size={24} className="text-brand-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">
            {fr ? 'Construite pour vendre partout.' : 'Built to sell everywhere.'}
          </h2>
          <p className="text-gray-300 max-w-xl mx-auto">
            {fr
              ? "Faite pour vendre partout dans le monde, sans compromis, sans commission, sans frontière."
              : "Made to sell everywhere in the world, without compromise, without commission, without borders."}
          </p>
          <p className="mt-6 text-xs text-gray-500">
            {fr ? 'Sellia — conçu et développé par LiAfrik' : 'Sellia — designed and developed by LiAfrik'}
          </p>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
