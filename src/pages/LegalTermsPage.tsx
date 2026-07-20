import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export default function LegalTermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">Conditions d'utilisation</h1>
        <p className="mt-2 text-sm text-gray-500">Dernière mise à jour : 19 juillet 2026</p>

        <div className="mt-8 prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">1. Éditeur de la plateforme</h2>
            <p>La plateforme LiAfrikOS est éditée par <strong>LIYAH GROUP</strong>, dont la Direction Générale est basée à Yaoundé, Cameroun 🇨🇲.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">2. Objet</h2>
            <p>LiAfrikOS est une plateforme SaaS multi-tenant e-commerce qui permet aux vendeurs africains de créer et gérer leur boutique en ligne. Les présentes conditions régissent l'utilisation de la plateforme par les vendeurs (ci-après "Utilisateurs").</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">3. Comptes et abonnements</h2>
            <p>L'inscription nécessite une adresse email valide. Trois plans d'abonnement sont disponibles : Starter (9$/mois), Premium (19$/mois) et Entreprise (69$/mois). Un essai gratuit de 7 jours est inclus sans carte bancaire.</p>
            <p>LiAfrikOS ne prélève <strong>aucune commission</strong> sur les ventes des vendeurs. Les paiements clients sont traités directement par les passerelles configurées par le vendeur (Flutterwave, Paystack, Orange Money, etc.).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">4. Responsabilités du vendeur</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Le vendeur est responsable de la légalité des produits vendus.</li>
              <li>Le vendeur doit respecter les lois locales de son pays d'opération.</li>
              <li>Le vendeur est responsable de la configuration de ses passerelles de paiement.</li>
              <li>Le vendeur s'engage à ne pas vendre de produits contrefaits, illégaux ou réglementés sans autorisation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. Propriété intellectuelle</h2>
            <p>Les thèmes, logos et contenus créés via LiAfrikOS appartiennent au vendeur. La plateforme LiAfrikOS, son code et son design restent la propriété de LIYAH GROUP.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">6. Résiliation</h2>
            <p>Le vendeur peut résilier son abonnement à tout moment depuis Paramètres. La résiliation prend effet à la fin de la période payée. Les données du vendeur sont conservées 30 jours après résiliation, puis supprimées.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">7. Limitation de responsabilité</h2>
            <p>LiAfrikOS fournit la plateforme en l'état. LIYAH GROUP ne saurait être tenu responsable des transactions entre vendeurs et clients finaux, ni des interruptions de service des passerelles de paiement tierces.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">8. Contact</h2>
            <p>Pour toute question relative aux présentes conditions : <strong>info@liafrik.com</strong></p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
