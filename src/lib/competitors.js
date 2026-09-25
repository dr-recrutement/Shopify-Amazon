// Data source for the "/alternative-a-:brand" comparison pages. One entry
// per competitor named in the brief. Kept factual and specific (pricing,
// concrete feature gaps) rather than generic marketing claims, and each
// entry's copy is written independently rather than templated from a
// shared paragraph, so the six pages don't read as duplicate content to
// search engines.
export const COMPETITORS = {
  shopify: {
    name: 'Shopify',
    slug: 'shopify',
    metaTitle: 'Alternative à Shopify en 2026 : pourquoi choisir Sellia',
    metaDescription: "Comparez Sellia et Shopify : tarifs, paiements Mobile Money, frais de transaction, thèmes et assistant IA. Découvrez l'alternative premium à Shopify pensée pour vendre à l'international.",
    intro: "Shopify reste une référence mondiale de l'e-commerce, mais son modèle de frais additionnels et l'absence native de Mobile Money laissent un vrai espace pour une alternative plus complète et plus abordable pour les marchands qui vendent en Afrique, en Europe et au-delà.",
    painPoints: [
      "Des frais de transaction supplémentaires sur la plupart des plans si vous n'utilisez pas Shopify Payments (indisponible dans de nombreux pays).",
      "Mobile Money (Orange Money, Wave, MTN, Airtel…) n'est pas pris en charge nativement — il faut passer par des applications tierces payantes.",
      "Les thèmes premium et la plupart des applications utiles sont facturés en plus de l'abonnement mensuel.",
    ],
    rows: [
      { label: 'Prix d\u2019entrée', sellia: 'À partir de 7$/mois, tout inclus', them: 'À partir de 29$/mois + frais de transaction' },
      { label: 'Paiements Mobile Money natifs', sellia: true, them: false },
      { label: 'Paiements sans redirection (25+ PSP)', sellia: true, them: 'Partiel (Shopify Payments limité par pays)' },
      { label: 'Multi-devises natif (XOF, NGN, USD, EUR…)', sellia: true, them: 'Via app tierce' },
      { label: 'Assistant IA intégré (contenus, thèmes)', sellia: true, them: 'Add-on payant' },
      { label: 'Thèmes premium inclus', sellia: true, them: false },
      { label: 'Essai gratuit', sellia: '14 jours, sans carte bancaire', them: '3 jours' },
    ],
  },
  bigcommerce: {
    name: 'BigCommerce',
    slug: 'bigcommerce',
    metaTitle: 'Alternative à BigCommerce en 2026 : Sellia, plus simple et plus complète',
    metaDescription: "Sellia vs BigCommerce : tarifs, plafonds de chiffre d'affaires, paiements locaux et simplicité d'utilisation. Voyez pourquoi Sellia est une alternative premium à BigCommerce.",
    intro: "BigCommerce cible les moyennes et grandes entreprises avec une architecture puissante mais souvent plus complexe à prendre en main — et facture un supplément dès que votre chiffre d'affaires annuel dépasse un certain seuil, quel que soit votre plan.",
    painPoints: [
      "Des seuils de chiffre d'affaires annuel qui déclenchent un changement de plan automatique et forcé.",
      "Une interface pensée pour des équipes techniques, avec une courbe d'apprentissage plus longue pour un e-commerçant indépendant.",
      "Aucune prise en charge native des moyens de paiement mobiles utilisés en Afrique et dans les marchés émergents.",
    ],
    rows: [
      { label: 'Prix d\u2019entrée', sellia: 'À partir de 7$/mois, tout inclus', them: 'À partir de 39$/mois' },
      { label: 'Plafond de chiffre d\u2019affaires par plan', sellia: 'Aucun plafond forcé', them: 'Oui — upgrade automatique au-delà d\u2019un seuil' },
      { label: 'Paiements Mobile Money natifs', sellia: true, them: false },
      { label: 'Éditeur visuel sans code', sellia: true, them: 'Limité, orienté développeurs' },
      { label: 'Assistant IA intégré', sellia: true, them: false },
      { label: 'Essai gratuit', sellia: '14 jours, sans carte bancaire', them: '15 jours' },
    ],
  },
  prestashop: {
    name: 'PrestaShop',
    slug: 'prestashop',
    metaTitle: 'Alternative à PrestaShop en 2026 : Sellia, sans hébergement à gérer',
    metaDescription: "Sellia vs PrestaShop : pas de serveur à maintenir, pas de modules payants à multiplier. Découvrez l'alternative SaaS premium à PrestaShop, prête à l'emploi.",
    intro: "PrestaShop est un logiciel open-source gratuit à télécharger, mais gratuit ne veut pas dire sans coûts : hébergement, mises à jour de sécurité, modules premium et maintenance technique s'accumulent vite et demandent des compétences serveur.",
    painPoints: [
      "Vous devez héberger, sécuriser et mettre à jour vous-même votre boutique (ou payer une agence pour le faire).",
      "Les modules indispensables (paiement, livraison, SEO avancé) sont vendus séparément sur la marketplace PrestaShop.",
      "Aucune assistance IA ni éditeur visuel moderne inclus par défaut.",
    ],
    rows: [
      { label: 'Modèle', sellia: 'SaaS tout-en-un, hébergé et maintenu par Sellia', them: 'Logiciel open-source auto-hébergé' },
      { label: 'Coût réel (hébergement + modules)', sellia: 'À partir de 7$/mois, tout inclus', them: 'Gratuit + hébergement + modules payants' },
      { label: 'Mises à jour de sécurité', sellia: 'Automatiques', them: 'Manuelles, à votre charge' },
      { label: 'Paiements Mobile Money natifs', sellia: true, them: 'Via module tiers' },
      { label: 'Assistant IA intégré', sellia: true, them: false },
      { label: 'Essai gratuit', sellia: '14 jours, sans carte bancaire', them: 'N/A (téléchargement gratuit)' },
    ],
  },
  woocommerce: {
    name: 'WooCommerce',
    slug: 'woocommerce',
    metaTitle: 'Alternative à WooCommerce en 2026 : Sellia, sans plugins à gérer',
    metaDescription: "Sellia vs WooCommerce : une plateforme e-commerce unifiée au lieu d'un empilement de plugins WordPress. Comparez tarifs, sécurité et facilité d'utilisation.",
    intro: "WooCommerce transforme WordPress en boutique en ligne via un plugin gratuit — mais chaque fonctionnalité avancée (paiement local, abonnements, multi-devises) nécessite un plugin supplémentaire, avec les risques de conflits et de failles de sécurité que cela implique.",
    painPoints: [
      "Dépend entièrement de l'écosystème WordPress : mises à jour, conflits de plugins et thèmes à surveiller en permanence.",
      "Les plugins de paiement local et de traduction multiplient les coûts cachés et les points de défaillance.",
      "Nécessite un hébergement WordPress performant séparé, à choisir et configurer soi-même.",
    ],
    rows: [
      { label: 'Modèle', sellia: 'SaaS tout-en-un', them: 'Plugin WordPress + hébergement séparé' },
      { label: 'Coût réel (hébergement + plugins)', sellia: 'À partir de 7$/mois, tout inclus', them: 'Gratuit + hébergement + plugins premium' },
      { label: 'Paiements Mobile Money natifs', sellia: true, them: 'Via plugin tiers' },
      { label: 'Risque de conflits techniques', sellia: 'Aucun (plateforme unifiée)', them: 'Fréquent (plugins/thèmes tiers)' },
      { label: 'Assistant IA intégré', sellia: true, them: false },
      { label: 'Essai gratuit', sellia: '14 jours, sans carte bancaire', them: 'N/A (plugin gratuit)' },
    ],
  },
  odoo: {
    name: 'Odoo',
    slug: 'odoo',
    metaTitle: 'Alternative à Odoo e-commerce en 2026 : Sellia, plus simple à lancer',
    metaDescription: "Sellia vs Odoo : une boutique en ligne prête en quelques minutes, sans configuration ERP complexe. Comparez simplicité, tarifs et paiements locaux.",
    intro: "Odoo est une suite ERP puissante dont l'e-commerce n'est qu'un module parmi des dizaines d'autres (comptabilité, RH, CRM…) — un atout pour les grandes structures, mais souvent une complexité inutile pour un marchand qui veut simplement vendre en ligne rapidement.",
    painPoints: [
      "La configuration initiale d'Odoo demande généralement l'aide d'un intégrateur ou d'un consultant.",
      "L'interface e-commerce hérite de la logique ERP, moins intuitive pour la gestion quotidienne d'une boutique.",
      "Les applications au-delà du plan gratuit (1 app) se facturent rapidement à l'unité.",
    ],
    rows: [
      { label: 'Temps de mise en ligne', sellia: 'Quelques minutes, sans code', them: 'Souvent plusieurs jours, configuration ERP' },
      { label: 'Prix d\u2019entrée e-commerce', sellia: 'À partir de 7$/mois, tout inclus', them: 'À partir de ~24$/mois/utilisateur (app payante)' },
      { label: 'Paiements Mobile Money natifs', sellia: true, them: false },
      { label: 'Pensé pour', sellia: 'Marchands e-commerce', them: 'Entreprises ayant besoin d\u2019un ERP complet' },
      { label: 'Assistant IA intégré au e-commerce', sellia: true, them: false },
      { label: 'Essai gratuit', sellia: '14 jours, sans carte bancaire', them: 'Plan gratuit limité à 1 application' },
    ],
  },
  wix: {
    name: 'Wix',
    slug: 'wix',
    metaTitle: 'Alternative à Wix eCommerce en 2026 : Sellia, pensée pour vendre',
    metaDescription: "Sellia vs Wix : une plateforme conçue pour le commerce à l'international, avec paiements Mobile Money et 25+ PSP. Comparez fonctionnalités et tarifs.",
    intro: "Wix est un excellent créateur de sites vitrines, mais ses fonctionnalités e-commerce restent en retrait derrière des plateformes spécialisées : moins de moyens de paiement, pas de Mobile Money natif, et une bascule de plan obligatoire pour vendre en ligne sérieusement.",
    painPoints: [
      "Conçu d'abord comme un créateur de sites, l'e-commerce est une couche ajoutée plutôt que le cœur du produit.",
      "Aucune prise en charge native du Mobile Money, essentiel pour vendre en Afrique.",
      "Changer de thème après le lancement est limité une fois la boutique publiée sur certains plans.",
    ],
    rows: [
      { label: 'Prix d\u2019entrée e-commerce', sellia: 'À partir de 7$/mois, tout inclus', them: 'À partir de 17$/mois' },
      { label: 'Paiements Mobile Money natifs', sellia: true, them: false },
      { label: 'Nombre de PSP disponibles', sellia: '25+', them: 'Limité selon les pays' },
      { label: 'Assistant IA orienté e-commerce', sellia: true, them: 'IA orientée design de site' },
      { label: 'Changement de thème après lancement', sellia: 'Libre à tout moment', them: 'Limité sur certains plans' },
      { label: 'Essai gratuit', sellia: '14 jours, sans carte bancaire', them: 'Non (garantie remboursement 14 jours)' },
    ],
  },
};

export const COMPETITOR_LIST = Object.values(COMPETITORS);
