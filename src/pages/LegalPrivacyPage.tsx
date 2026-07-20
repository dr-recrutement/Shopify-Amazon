import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export default function LegalPrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-gray-500">Dernière mise à jour : 19 juillet 2026</p>

        <div className="mt-8 prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">1. Éditeur</h2>
            <p>La plateforme LiAfrikOS est éditée par <strong>LIYAH GROUP</strong>, Direction Générale à Yaoundé, Cameroun 🇨🇲. Cette politique décrit comment nous collectons, utilisons et protégeons vos données.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">2. Données collectées</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Compte</strong> : nom, email, mot de passe (chiffré).</li>
              <li><strong>Boutique</strong> : nom de boutique, pays, ville, secteur, produits, prix.</li>
              <li><strong>Paiements</strong> : clés API des passerelles (chiffrées AES-256, jamais en clair).</li>
              <li><strong>Analytics</strong> : pages visitées, actions effectuées (anonymisées).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">3. Utilisation des données</h2>
            <p>Vos données servent exclusivement à : faire fonctionner votre boutique, traiter les paiements via vos passerelles, générer des rapports, améliorer la plateforme. Vos données ne sont jamais vendues à des tiers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">4. Isolation multi-tenant (RLS)</h2>
            <p>Chaque boutique est isolée au niveau base de données grâce au Row Level Security (RLS) de PostgreSQL. Un vendeur ne peut jamais accéder aux données d'un autre vendeur. Cette isolation est vérifiée automatiquement à chaque requête.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. Conformité RGPD et locales</h2>
            <p>LiAfrikOS se conforme au RGPD européen et aux législations locales de protection des données des pays africains desservis. Vous pouvez exercer vos droits d'accès, rectification et suppression à tout moment.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">6. Sécurité</h2>
            <p>Chiffrement en transit (TLS 1.3) et au repos (AES-256). MFA disponible. Audit des actions Super Admin. Anti-fraude. Sauvegardes automatiques quotidiennes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">7. Vos droits</h2>
            <p>Vous pouvez : accéder à vos données, les exporter, demander leur rectification, demander leur suppression. Contactez-nous : <strong>info@liafrik.com</strong></p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">8. Conservation</h2>
            <p>Les données sont conservées pendant la durée de vie du compte, puis 30 jours après résiliation (période de grâce), puis définitivement supprimées.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
