// Sellia's own content-marketing hub ("Guides"), distinct from the
// merchant-facing blog CMS at /blog (used by merchants to write posts for
// their own storefront). This is Sellia's public editorial content aimed
// at ranking for buyer-intent, platform-comparison and Africa-e-commerce
// search queries.
export const GUIDES = [
  {
    slug: 'choisir-plateforme-ecommerce-afrique-2026',
    title: "Comment choisir la bonne plateforme e-commerce en Afrique en 2026",
    excerpt: "Shopify, Wix, PrestaShop, WooCommerce, Odoo, Sellia... Les critères qui comptent vraiment quand vos clients paient en Mobile Money.",
    date: '2026-01-12',
    body: [
      "Le choix d'une plateforme e-commerce ne se résume pas à comparer des grilles tarifaires. Pour un marchand qui vend en Afrique, en Europe ou dans plusieurs marchés à la fois, trois critères pèsent plus lourd que tous les autres : les moyens de paiement acceptés, la simplicité de gestion au quotidien, et le coût réel une fois toutes les options nécessaires ajoutées.",
      "Les plateformes historiques comme Shopify, BigCommerce ou Wix ont été conçues d'abord pour des marchés où la carte bancaire domine. Le Mobile Money — Orange Money, Wave, MTN Mobile Money, Airtel Money — y est traité comme une option secondaire, ajoutée via une application tierce, avec des frais et des délais d'intégration supplémentaires.",
      "PrestaShop et WooCommerce, de leur côté, sont gratuits à télécharger mais reportent la charge d'hébergement, de sécurité et de maintenance sur le marchand — ou sur l'agence qu'il doit payer pour s'en occuper. Odoo, pensé comme un ERP complet, demande souvent un accompagnement technique avant même de pouvoir publier un premier produit.",
      "Sellia a été conçue en partant du problème inverse : que faut-il pour qu'un marchand publie sa boutique en quelques minutes, accepte immédiatement les paiements Mobile Money et cartes internationales, et n'ait ni serveur ni plugin à gérer ? La réponse tient dans trois principes : tout inclus dans l'abonnement, aucune compétence technique requise, et une couverture native des moyens de paiement réellement utilisés par vos clients.",
      "Avant de choisir, posez-vous quatre questions concrètes : mes clients peuvent-ils payer avec les moyens qu'ils utilisent déjà tous les jours ? Puis-je changer un thème ou ajouter un produit sans développeur ? Le prix affiché est-il le prix final, ou dois-je ajouter hébergement, plugins et frais de transaction ? Et enfin, l'équipe support répond-elle dans ma langue et mon fuseau horaire ?",
    ],
  },
  {
    slug: 'migrer-boutique-vers-sellia',
    title: "Migrer votre boutique vers Sellia : le guide complet",
    excerpt: "Depuis Shopify, WooCommerce, PrestaShop ou Wix : voici comment se passe une migration, étape par étape, sans perdre vos données.",
    date: '2026-02-03',
    body: [
      "Changer de plateforme e-commerce fait peur — à raison, si la migration est mal préparée. Perte de produits, de commandes historiques, de référencement déjà acquis sur vos fiches produits : ce sont les risques réels d'une migration improvisée. Voici comment Sellia les évite.",
      "Étape 1 — Export de vos données actuelles. Que vous veniez de Shopify, WooCommerce, PrestaShop, Wix, BigCommerce ou Odoo, l'export de votre catalogue produits, de votre base clients et de votre historique de commandes se fait généralement en quelques clics depuis l'administration de votre plateforme actuelle, au format CSV.",
      "Étape 2 — Import guidé. L'équipe Sellia accompagne l'import de ces fichiers dans votre nouvelle boutique : produits, variantes, images, prix, stock et fiches clients sont réintégrés sans ressaisie manuelle.",
      "Étape 3 — Redirection SEO. Pour ne pas perdre le référencement déjà construit, les URLs de vos anciennes fiches produits peuvent être redirigées vers leurs nouvelles adresses sur Sellia, évitant les pages d'erreur 404 pour vos visiteurs et pour Google.",
      "Étape 4 — Connexion des paiements. Vos prestataires de paiement existants (Stripe, PayPal, Flutterwave, Paystack…) ainsi que le Mobile Money peuvent être connectés dès le premier jour, sans interruption pour vos clients.",
      "Étape 5 — Bascule du domaine. Une fois votre nouvelle boutique testée et validée, votre nom de domaine est pointé vers Sellia — la coupure pour vos visiteurs dure quelques minutes, le temps de la propagation DNS.",
      "Pour démarrer votre migration accompagnée, contactez support@liafrik.com en précisant votre plateforme actuelle : l'équipe vous répond avec un plan de migration adapté à votre catalogue.",
    ],
  },
  {
    slug: 'paiements-mobile-money-guide-ecommerce',
    title: "Mobile Money et paiements en Afrique : le guide e-commerce",
    excerpt: "Orange Money, Wave, MTN, Airtel : pourquoi le Mobile Money change tout pour un e-commerçant, et comment l'intégrer sans redirection.",
    date: '2026-02-20',
    body: [
      "Dans plusieurs marchés africains, le Mobile Money dépasse largement la carte bancaire comme moyen de paiement du quotidien. Pour un marchand en ligne, ne pas le proposer revient à fermer sa caisse à une majorité de clients potentiels.",
      "Le problème : la plupart des plateformes e-commerce internationales (Shopify, BigCommerce, Wix) n'intègrent pas nativement Orange Money, Wave, MTN Mobile Money ou Airtel Money. Il faut passer par une application tierce, avec ses propres frais, ses propres délais de validation, et souvent une redirection hors de la boutique qui casse l'expérience d'achat — et fait fuir une partie des acheteurs au moment de payer.",
      "Sellia intègre le Mobile Money nativement, aux côtés de plus de 25 prestataires de paiement mondiaux (cartes, virements, portefeuilles électroniques), dans un tunnel d'achat unique et sans redirection : le client saisit son numéro, valide sur son téléphone, et revient directement sur la page de confirmation de votre boutique.",
      "Concrètement, cela signifie un taux d'abandon de panier plus faible, une confiance accrue du client (il reste sur votre marque du début à la fin), et une seule interface pour suivre toutes vos transactions — qu'elles viennent d'un client à Dakar, Lagos, Paris ou Montréal.",
    ],
  },
];

export function getGuide(slug) {
  return GUIDES.find((g) => g.slug === slug);
}
