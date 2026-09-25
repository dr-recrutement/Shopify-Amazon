import MarketingLayout from '@/components/marketing/MarketingLayout';
import { SUPPORT_EMAIL } from '@/lib/seo';

export default function Privacy() {
  return (
    <MarketingLayout
      title="Politique de confidentialité"
      description="Découvrez comment Sellia collecte, utilise et protège vos données personnelles, ainsi que vos droits RGPD et notre politique de cookies."
      url="/confidentialite"
    >
      <section className="py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="font-landing font-semibold text-3xl text-[#202223] tracking-tight">Politique de confidentialité</h1>
          <p className="mt-2 text-sm text-[#6D7175]">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>

          <div className="mt-10 space-y-8">
            <div>
              <h2 className="font-landing font-semibold text-lg text-[#202223]">1. Données collectées</h2>
              <p className="mt-2 text-sm text-[#44474A] leading-relaxed">Sellia collecte les informations nécessaires à la fourniture du service : identité et coordonnées du marchand, informations de facturation, données de vos clients (nom, adresse, e-mail) lorsque vous les traitez via votre boutique, ainsi que des données techniques (adresse IP, journaux d'activité) à des fins de sécurité.</p>
            </div>
            <div>
              <h2 className="font-landing font-semibold text-lg text-[#202223]">2. Finalités du traitement</h2>
              <p className="mt-2 text-sm text-[#44474A] leading-relaxed">Ces données sont utilisées pour fournir et améliorer la plateforme, assurer le support client, prévenir la fraude, et respecter nos obligations légales et comptables.</p>
            </div>
            <div id="rgpd">
              <h2 className="font-landing font-semibold text-lg text-[#202223]">3. Vos droits (RGPD)</h2>
              <p className="mt-2 text-sm text-[#44474A] leading-relaxed">Conformément au Règlement Général sur la Protection des Données et aux lois locales applicables, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de vos données. Pour exercer ces droits, contactez-nous à {SUPPORT_EMAIL}.</p>
            </div>
            <div id="cookies">
              <h2 className="font-landing font-semibold text-lg text-[#202223]">4. Cookies</h2>
              <p className="mt-2 text-sm text-[#44474A] leading-relaxed">Sellia utilise des cookies strictement nécessaires au fonctionnement du service (authentification, panier d'achat) ainsi que des cookies de mesure d'audience destinés à améliorer la plateforme. Vous pouvez configurer votre navigateur pour refuser les cookies non essentiels.</p>
            </div>
            <div id="securite">
              <h2 className="font-landing font-semibold text-lg text-[#202223]">5. Sécurité</h2>
              <p className="mt-2 text-sm text-[#44474A] leading-relaxed">Les données sont chiffrées en transit (HTTPS/TLS) et au repos lorsque cela est techniquement pertinent. L'accès aux données de production est restreint aux personnes habilitées et journalisé.</p>
            </div>
            <div>
              <h2 className="font-landing font-semibold text-lg text-[#202223]">6. Partage des données</h2>
              <p className="mt-2 text-sm text-[#44474A] leading-relaxed">Vos données ne sont jamais vendues. Elles peuvent être partagées avec des prestataires strictement nécessaires au fonctionnement du service (hébergement, prestataires de paiement que vous avez vous-même choisis, envoi d'e-mails transactionnels).</p>
            </div>
            <div>
              <h2 className="font-landing font-semibold text-lg text-[#202223]">7. Conservation</h2>
              <p className="mt-2 text-sm text-[#44474A] leading-relaxed">Les données sont conservées pendant la durée de votre abonnement, puis pendant la durée nécessaire au respect de nos obligations légales (comptables, fiscales), avant suppression ou anonymisation.</p>
            </div>
            <div>
              <h2 className="font-landing font-semibold text-lg text-[#202223]">8. Contact</h2>
              <p className="mt-2 text-sm text-[#44474A] leading-relaxed">Pour toute question relative à cette politique ou à vos données personnelles, écrivez-nous à {SUPPORT_EMAIL}.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
