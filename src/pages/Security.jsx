import { ShieldCheck, Lock, Server, CreditCard, RefreshCw, Eye } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { SUPPORT_EMAIL } from '@/lib/seo';

const POINTS = [
  { icon: Lock, title: 'Chiffrement de bout en bout', text: "Toutes les données transitent en HTTPS/TLS. Les données sensibles sont chiffrées au repos lorsque cela est techniquement pertinent." },
  { icon: CreditCard, title: 'Paiements sans stockage de carte', text: "Sellia ne stocke jamais les numéros de carte bancaire. Chaque transaction est traitée directement par le prestataire de paiement choisi (Stripe, PayPal, Flutterwave, Mobile Money…), conforme aux standards PCI-DSS de son secteur." },
  { icon: Server, title: 'Infrastructure cloud professionnelle', text: "Hébergement chez des fournisseurs cloud reconnus, avec sauvegardes régulières et redondance des données marchandes." },
  { icon: RefreshCw, title: 'Disponibilité 99,9 %', text: "Un objectif de disponibilité de 99,9 %, avec surveillance continue de la plateforme et alerte immédiate en cas d'incident." },
  { icon: Eye, title: 'Accès restreint et journalisé', text: "L'accès aux données de production est limité aux personnes habilitées et chaque action sensible est journalisée (journal d'audit interne)." },
  { icon: ShieldCheck, title: 'Conformité RGPD', text: "Sellia respecte les principes du RGPD pour la collecte et le traitement des données personnelles — détails complets dans notre politique de confidentialité." },
];

export default function Security() {
  return (
    <MarketingLayout
      title="Sécurité & confiance"
      description="Découvrez comment Sellia protège les données et les paiements de vos clients : chiffrement, paiements sans stockage de carte, infrastructure cloud, conformité RGPD."
      url="/securite"
    >
      <section className="bg-[#0A0A0A] py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-xs font-semibold text-white">
            <ShieldCheck className="w-3.5 h-3.5" /> Sécurité & confiance
          </span>
          <h1 className="mt-6 font-landing font-semibold text-white text-3xl sm:text-4xl tracking-tight">La sécurité de votre boutique, prise au sérieux</h1>
          <p className="mt-5 text-white/75 text-base sm:text-lg leading-relaxed">
            Vos clients vous font confiance pour payer en ligne. Voici comment Sellia protège chaque transaction et chaque donnée, du premier au dernier jour.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 gap-6">
          {POINTS.map((p) => (
            <div key={p.title} className="bg-white border border-[#E1E1E1] rounded-2xl p-6">
              <p.icon className="w-6 h-6 text-[#008060]" />
              <h2 className="mt-4 font-landing font-semibold text-lg text-[#202223]">{p.title}</h2>
              <p className="mt-2 text-sm text-[#6D7175] leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-landing font-semibold text-xl text-[#202223]">Une question de sécurité, une vulnérabilité à signaler ?</h2>
          <p className="mt-3 text-sm text-[#6D7175]">Écrivez-nous directement, notre équipe technique vous répond en priorité.</p>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=Sécurité`} className="mt-5 inline-flex items-center gap-2 bg-[#008060] text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-[#00694d] transition-colors">
            Contacter l'équipe sécurité
          </a>
        </div>
      </section>
    </MarketingLayout>
  );
}
