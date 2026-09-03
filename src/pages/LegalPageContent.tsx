import type { ReactNode } from 'react';
import { Card } from './dashboard/ui';

const LAST_UPDATED = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

function LegalDoc({ intro, children }: { intro?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-8 sm:p-10">
      <p className="text-xs text-gray-400 mb-6">Dernière mise à jour : {LAST_UPDATED}</p>
      {intro && <p className="text-sm text-gray-600 mb-8 leading-relaxed">{intro}</p>}
      <div className="space-y-8 text-sm text-gray-700 leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-brand-600 [&_a]:underline">
        {children}
      </div>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function TermsContent() {
  return (
    <LegalDoc intro="Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de la plateforme Sellia, éditée par LiAfrik, par tout vendeur ou visiteur.">
      <Section title="1. Objet">
        <p>Sellia est une plateforme SaaS permettant à des vendeurs de créer, gérer et exploiter une boutique en ligne (catalogue produits, commandes, paiements, expédition, marketing). L'utilisation de la plateforme implique l'acceptation pleine et entière des présentes CGU.</p>
      </Section>
      <Section title="2. Compte vendeur">
        <ul>
          <li>La création d'un compte requiert des informations exactes et à jour.</li>
          <li>Le vendeur est seul responsable de la confidentialité de ses identifiants et de toute activité effectuée depuis son compte.</li>
          <li>Sellia se réserve le droit de suspendre un compte en cas de violation des présentes CGU, de fraude avérée ou d'usage illicite de la plateforme.</li>
        </ul>
      </Section>
      <Section title="3. Contenus et produits publiés">
        <p>Le vendeur reste seul responsable des produits, descriptions, prix, visuels et contenus qu'il publie sur sa boutique. Les contenus illégaux, contrefaisants, trompeurs ou portant atteinte à des droits de tiers sont interdits et peuvent entraîner un retrait immédiat.</p>
      </Section>
      <Section title="4. Abonnements et facturation">
        <p>L'accès à certaines fonctionnalités est soumis à un abonnement payant dont les tarifs sont indiqués sur la page <a href="/pricing">Tarifs</a>. Les abonnements se renouvellent automatiquement selon la périodicité choisie, sauf résiliation avant la date de renouvellement.</p>
      </Section>
      <Section title="5. Paiements">
        <p>Les paiements effectués par les acheteurs sur les boutiques hébergées transitent par des prestataires de paiement tiers (ex. PayUnit et autres passerelles configurées par le vendeur). Sellia n'a pas accès aux identifiants de paiement des acheteurs et n'est pas partie aux transactions entre vendeurs et acheteurs.</p>
      </Section>
      <Section title="6. Disponibilité du service">
        <p>Sellia met en œuvre des moyens raisonnables pour assurer la disponibilité de la plateforme, sans garantie d'absence totale d'interruption (maintenance, incident technique, cas de force majeure).</p>
      </Section>
      <Section title="7. Résiliation">
        <p>Le vendeur peut résilier son abonnement à tout moment depuis son tableau de bord. Sellia peut résilier ou suspendre un compte en cas de manquement grave aux présentes CGU, après notification lorsque les circonstances le permettent.</p>
      </Section>
      <Section title="8. Droit applicable">
        <p>Les présentes CGU sont soumises au droit applicable au lieu d'établissement de LiAfrik. Sellia opérant à l'international, des dispositions locales impératives peuvent s'appliquer en complément selon le pays du vendeur ou de l'acheteur.</p>
      </Section>
      <Section title="9. Contact">
        <p>Pour toute question relative aux présentes CGU : <a href="mailto:legal@liafrik.com">legal@liafrik.com</a>.</p>
      </Section>
    </LegalDoc>
  );
}

export function PrivacyContent() {
  return (
    <LegalDoc intro="Cette politique décrit quelles données personnelles Sellia collecte, pourquoi, et les droits dont vous disposez sur ces données.">
      <Section title="1. Données collectées">
        <ul>
          <li><strong>Compte vendeur :</strong> nom, e-mail, téléphone, pays, informations de facturation.</li>
          <li><strong>Boutique :</strong> catalogue produits, commandes, clients de la boutique, contenu publié.</li>
          <li><strong>Paiement :</strong> les identifiants de passerelle de paiement du vendeur sont chiffrés côté serveur (AES-256) avant stockage ; Sellia ne stocke jamais de numéro de carte bancaire.</li>
          <li><strong>Usage :</strong> données techniques de navigation (journaux serveur, adresse IP, type d'appareil) à des fins de sécurité et d'amélioration du service.</li>
        </ul>
      </Section>
      <Section title="2. Finalités">
        <p>Les données sont utilisées pour fournir le service (hébergement de boutique, traitement des commandes, facturation), assurer la sécurité de la plateforme, répondre au support, et — sauf opposition — informer des évolutions du produit.</p>
      </Section>
      <Section title="3. Partage des données">
        <p>Les données ne sont partagées qu'avec les prestataires strictement nécessaires au fonctionnement du service (hébergement, passerelles de paiement, envoi d'e-mails transactionnels), dans le cadre de leur mission, et jamais revendues à des tiers à des fins publicitaires.</p>
      </Section>
      <Section title="4. Conservation">
        <p>Les données sont conservées pendant la durée de la relation contractuelle, puis archivées pour la durée requise par les obligations légales (comptables, fiscales) avant suppression ou anonymisation.</p>
      </Section>
      <Section title="5. Vos droits">
        <p>Selon votre juridiction (RGPD pour les résidents de l'Union européenne, lois nationales équivalentes ailleurs), vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation et de portabilité de vos données, ainsi que d'un droit d'opposition. Pour exercer ces droits : <a href="mailto:privacy@liafrik.com">privacy@liafrik.com</a>.</p>
      </Section>
      <Section title="6. Sécurité">
        <p>Connexions chiffrées (HTTPS/TLS), chiffrement au repos des identifiants de paiement sensibles, accès aux données restreint par rôle. Aucun système n'étant infaillible, nous vous invitons à nous signaler toute vulnérabilité constatée à <a href="mailto:security@liafrik.com">security@liafrik.com</a>.</p>
      </Section>
      <Section title="7. Transferts internationaux">
        <p>Sellia opérant dans plusieurs pays, des données peuvent être traitées dans des juridictions différentes de celle de l'utilisateur, avec des garanties contractuelles appropriées lorsque requis par la loi applicable.</p>
      </Section>
    </LegalDoc>
  );
}

export function CookiesContent() {
  return (
    <LegalDoc intro="Cette page explique quels cookies et technologies similaires Sellia utilise, et comment les gérer.">
      <Section title="1. Qu'est-ce qu'un cookie ?">
        <p>Un cookie est un petit fichier déposé sur votre appareil lors de la visite d'un site, permettant de le reconnaître lors de visites ultérieures ou de mémoriser des préférences.</p>
      </Section>
      <Section title="2. Cookies utilisés">
        <ul>
          <li><strong>Cookies strictement nécessaires :</strong> maintien de la session de connexion, sécurité (protection CSRF), préférences de langue et de devise. Ces cookies ne peuvent pas être désactivés sans altérer le fonctionnement du service.</li>
          <li><strong>Cookies de panier :</strong> mémorisation du contenu du panier d'achat entre deux visites sur une boutique.</li>
          <li><strong>Cookies de mesure d'audience :</strong> statistiques de fréquentation agrégées, utilisées pour améliorer la plateforme.</li>
        </ul>
      </Section>
      <Section title="3. Cookies tiers">
        <p>Certaines passerelles de paiement configurées par les vendeurs peuvent déposer leurs propres cookies techniques lors du paiement, selon leurs propres politiques.</p>
      </Section>
      <Section title="4. Gestion de vos préférences">
        <p>Vous pouvez configurer votre navigateur pour refuser les cookies ou être averti avant leur dépôt. Le refus des cookies strictement nécessaires peut empêcher le bon fonctionnement de la connexion et du panier d'achat.</p>
      </Section>
      <Section title="5. Durée de conservation">
        <p>Les cookies de session expirent à la fermeture du navigateur. Les cookies persistants (préférences, panier) sont conservés jusqu'à 12 mois maximum, ou jusqu'à suppression manuelle par l'utilisateur.</p>
      </Section>
    </LegalDoc>
  );
}

export function RefundContent() {
  return (
    <LegalDoc intro="Cette politique distingue les remboursements liés à l'abonnement Sellia (relation LiAfrik ↔ vendeur) de ceux liés aux achats effectués sur une boutique hébergée (relation vendeur ↔ acheteur).">
      <Section title="1. Abonnement à la plateforme Sellia">
        <ul>
          <li>Les frais d'abonnement sont facturés d'avance pour la période choisie (mensuelle ou annuelle).</li>
          <li>Vous pouvez annuler votre abonnement à tout moment ; l'accès reste actif jusqu'à la fin de la période déjà payée, sans remboursement au prorata de la période en cours, sauf disposition légale locale contraire.</li>
          <li>En cas d'erreur de facturation constatée (double prélèvement, montant incorrect), le remboursement est effectué sous 5 à 10 jours ouvrés après vérification, sur le moyen de paiement d'origine.</li>
          <li>Aucun remboursement n'est dû en cas de résiliation pour manquement grave aux <a href="/legal/terms">CGU</a>.</li>
        </ul>
      </Section>
      <Section title="2. Achats effectués sur une boutique vendeur">
        <p>Sellia héberge la boutique mais n'est pas partie à la vente entre le vendeur et l'acheteur. Les conditions de retour et de remboursement d'une commande (délai, éligibilité, frais de retour) sont définies par chaque vendeur et doivent être consultables sur sa boutique. En l'absence de politique spécifique affichée par le vendeur, l'acheteur est invité à le contacter directement via le suivi de commande ou le support de la boutique.</p>
      </Section>
      <Section title="3. Litige non résolu avec un vendeur">
        <p>Si un acheteur ne parvient pas à obtenir de réponse d'un vendeur dans un délai raisonnable, il peut solliciter le support Sellia (<a href="mailto:cs@liafrik.com">cs@liafrik.com</a>) qui pourra intervenir en médiation, sans garantie de résultat, Sellia n'étant pas partie au contrat de vente.</p>
      </Section>
      <Section title="4. Modalités de remboursement">
        <p>Tout remboursement approuvé est reversé sur le moyen de paiement utilisé lors de la transaction d'origine, dans un délai qui dépend du prestataire de paiement concerné (généralement 5 à 10 jours ouvrés).</p>
      </Section>
    </LegalDoc>
  );
}

export function LegalNoticeContent() {
  return (
    <LegalDoc>
      <Section title="Éditeur du site">
        <p>
          La plateforme Sellia est éditée par <strong>LiAfrik</strong> (<a href="https://liafrik.com" target="_blank" rel="noopener noreferrer">liafrik.com</a>).
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Forme juridique, numéro d'immatriculation, siège social et représentant légal : à compléter par LiAfrik avant mise en production — ces informations doivent figurer ici conformément aux obligations de mentions légales applicables.
        </p>
      </Section>
      <Section title="Hébergement">
        <p>Le site et les boutiques hébergées sont servis via Cloudflare Pages (Cloudflare, Inc.). Les données applicatives sont hébergées via Supabase.</p>
      </Section>
      <Section title="Contact">
        <p>Pour toute question relative au site : <a href="mailto:contact@os.liafrik.com">contact@os.liafrik.com</a>.</p>
      </Section>
      <Section title="Propriété intellectuelle">
        <p>La marque Sellia, son logo et les éléments graphiques de la plateforme sont la propriété de LiAfrik. Les contenus publiés par chaque vendeur (visuels produits, descriptions, marque de la boutique) restent la propriété du vendeur concerné.</p>
      </Section>
    </LegalDoc>
  );
}
