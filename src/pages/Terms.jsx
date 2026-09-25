import MarketingLayout from '@/components/marketing/MarketingLayout';
import { SUPPORT_EMAIL } from '@/lib/seo';

const SECTIONS = [
  { t: '1. Objet', b: "Les présentes conditions générales d'utilisation (« CGU ») régissent l'accès et l'utilisation de la plateforme Sellia, éditée par Liafrik, permettant à un marchand de créer et gérer une boutique en ligne." },
  { t: '2. Inscription et compte', b: "L'utilisation de Sellia nécessite la création d'un compte marchand. Vous vous engagez à fournir des informations exactes et à maintenir la confidentialité de vos identifiants de connexion." },
  { t: '3. Abonnements et facturation', b: "Sellia propose plusieurs formules d'abonnement (Starter, Growth, Pro, Enterprise), facturées mensuellement ou annuellement. Un essai gratuit de 14 jours est proposé sans engagement ni carte bancaire requise à l'inscription." },
  { t: '4. Utilisation autorisée', b: "Vous vous engagez à utiliser Sellia dans le respect des lois applicables, notamment en matière de vente en ligne, de protection des consommateurs et de propriété intellectuelle. La vente de produits illicites est strictement interdite." },
  { t: '5. Contenu du marchand', b: "Vous restez seul responsable des produits, descriptions, images et contenus publiés sur votre boutique. Sellia se réserve le droit de suspendre une boutique en cas de non-respect manifeste des lois en vigueur." },
  { t: '6. Paiements', b: "Sellia intègre plus de 25 prestataires de services de paiement tiers. Les transactions entre le marchand et ses clients sont soumises aux conditions propres à chaque prestataire de paiement choisi." },
  { t: '7. Disponibilité du service', b: "Sellia met en œuvre les moyens raisonnables pour assurer une disponibilité continue de la plateforme, sans garantie d'absence totale d'interruption liée à la maintenance ou à des causes indépendantes de notre volonté." },
  { t: '8. Résiliation', b: "Vous pouvez résilier votre abonnement à tout moment depuis votre espace de facturation. Sellia se réserve le droit de suspendre ou résilier un compte en cas de violation des présentes CGU." },
  { t: '9. Modification des CGU', b: "Sellia peut modifier les présentes CGU. Les marchands seront informés de toute modification substantielle par e-mail ou notification dans l'application." },
  { t: '10. Contact', b: `Pour toute question relative aux présentes conditions, contactez-nous à ${SUPPORT_EMAIL}.` },
];

export default function Terms() {
  return (
    <MarketingLayout
      title="Conditions d'utilisation"
      description="Consultez les conditions générales d'utilisation de Sellia, la plateforme e-commerce développée par Liafrik."
      url="/conditions"
    >
      <section className="py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="font-landing font-semibold text-3xl text-[#202223] tracking-tight">Conditions d'utilisation</h1>
          <p className="mt-2 text-sm text-[#6D7175]">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
          <div className="mt-10 space-y-8">
            {SECTIONS.map((s) => (
              <div key={s.t}>
                <h2 className="font-landing font-semibold text-lg text-[#202223]">{s.t}</h2>
                <p className="mt-2 text-sm text-[#44474A] leading-relaxed">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
