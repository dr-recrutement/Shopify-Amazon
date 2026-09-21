// Premium theme catalog for the AfriStore Builder theme engine.
// Each theme is a full, ready-to-use storefront with real imagery and editable
// content, crafted for African merchants (FCFA pricing, local context).

const HEROES = {
  aurora: 'https://media.base44.com/images/public/6aaf8e00382d12ca2edaacca/e2453e804_generated_image.png',
  nexus: 'https://media.base44.com/images/public/6aaf8e00382d12ca2edaacca/30fb2ee63_generated_image.png',
  inkwell: 'https://media.base44.com/images/public/6aaf8e00382d12ca2edaacca/cf0640892_generated_image.png',
  studio: 'https://media.base44.com/images/public/6aaf8e00382d12ca2edaacca/408ae3d61_generated_image.png',
  savor: 'https://media.base44.com/images/public/6aaf8e00382d12ca2edaacca/a9c567e3a_generated_image.png',
  bloom: 'https://media.base44.com/images/public/6aaf8e00382d12ca2edaacca/392290bfb_generated_image.png',
  heritage: 'https://media.base44.com/images/public/6aaf8e00382d12ca2edaacca/3d4ee382c_generated_image.png',
  souk: 'https://media.base44.com/images/public/6aaf8e00382d12ca2edaacca/c23a37543_generated_image.png',
};

const img = (seed, w = 600, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const THEMES = [
  {
    id: 'aurora',
    name: 'Aurora',
    category: 'E-commerce',
    description: 'Boutique de mode afro-premium, élégante et artisanale.',
    fonts: { heading: 'Inter, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif' },
    palette: { primary: '#1B1B1B', primaryText: '#FFFFFF', accent: '#C8A06A', bg: '#FAF7F2', surface: '#FFFFFF', text: '#2B2B2B', muted: '#8A8278', border: '#E7E1D8', dark: '#1B1B1B' },
    sections: [
      { id: 'aurora-ann', type: 'announcement', label: 'Annonce', visible: true, props: { message: 'Livraison gratuite partout en Afrique dès 50 000 FCFA — Paiement Mobile Money accepté', bg: '#1B1B1B', text: '#FFFFFF' } },
      { id: 'aurora-hdr', type: 'header', label: 'En-tête', visible: true, props: { logo: 'AURORA', links: ['Nouveautés', 'Femme', 'Homme', 'Accessoires', 'Lookbook'] } },
      { id: 'aurora-hero', type: 'hero', label: 'Bannière', visible: true, props: { image: HEROES.aurora, title: "L'élégance africaine, réinventée", subtitle: 'Wax, kente et cuir artisanal. Des pièces uniques qui célèbrent le savoir-faire du continent.', buttons: [{ label: 'Découvrir la collection', variant: 'primary' }, { label: 'Voir le lookbook', variant: 'outline' }], align: 'left' } },
      { id: 'aurora-trust', type: 'trustbar', label: 'Garanties', visible: true, props: { items: [{ icon: '🚚', text: 'Livraison 48h' }, { icon: '🔒', text: 'Paiement sécurisé' }, { icon: '↩️', text: 'Retours 30 j' }, { icon: '💬', text: 'Support 7j/7' }] } },
      { id: 'aurora-coll', type: 'collectionList', label: 'Catégories', visible: true, props: { title: 'Explorer par catégorie', columns: 4, items: [{ image: img('aurora-c1', 500, 650), title: 'Femme', count: '128 articles' }, { image: img('aurora-c2', 500, 650), title: 'Homme', count: '94 articles' }, { image: img('aurora-c3', 500, 650), title: 'Accessoires', count: '76 articles' }, { image: img('aurora-c4', 500, 650), title: 'Maison', count: '52 articles' }] } },
      { id: 'aurora-grid', type: 'productGrid', label: 'Produits phares', visible: true, props: { title: 'Coups de cœur de la saison', columns: 4, products: [{ image: img('aurora-p1'), title: 'Robe Wax Élégance', price: '42 000 FCFA', rating: 5 }, { image: img('aurora-p2'), title: 'Sac Kpatcha en cuir', price: '58 000 FCFA', rating: 5 }, { image: img('aurora-p3'), title: 'Ensemble Kente Royal', price: '120 000 FCFA', rating: 4 }, { image: img('aurora-p4'), title: 'Boucles d\u2019oreilles Dorées', price: '18 500 FCFA', rating: 5 }] } },
      { id: 'aurora-mc', type: 'multicolumn', label: 'Atouts', visible: true, props: { title: 'Pourquoi choisir AURORA', items: [{ icon: '🧵', title: 'Fait main', text: 'Confectionné par nos artisans à Dakar, Abidjan et Lagos.' }, { icon: '🌱', title: 'Matières durables', text: 'Wax authentique, coton bio et cuir tanné localement.' }, { icon: '🚚', title: 'Livraison express', text: 'Expédié sous 24h, livré en 48h partout en Afrique.' }, { icon: '💎', title: 'Qualité premium', text: 'Chaque pièce inspectée à la main pour une finition impeccable.' }] } },
      { id: 'aurora-it', type: 'imageText', label: 'Story atelier', visible: true, props: { image: img('aurora-it', 900, 900), title: "L'art du Wax", text: 'Chaque tenue est confectionnée à la main dans nos ateliers, en collaboration avec des artisans locaux perpétuant un savoir-faire transmis de génération en génération.', button: 'Découvrir nos ateliers', reverse: false } },
      { id: 'aurora-ts', type: 'testimonials', label: 'Avis clients', visible: true, props: { title: 'Elles portent AURORA', items: [{ quote: 'La qualité du Wax est exceptionnelle. Je reçois des compliments à chaque sortie.', author: 'Aïcha D.', role: 'Dakar' }, { quote: 'Mon sac en cuir est sublime et intemporel. Livraison rapide à Abidjan.', author: 'Ngozi O.', role: 'Lagos' }, { quote: 'Service client impeccable et pièces magnifiques. Je suis cliente fidèle.', author: 'Fatou B.', role: 'Bamako' }] } },
      { id: 'aurora-nl', type: 'newsletter', label: 'Newsletter', visible: true, props: { title: 'Rejoignez le cercle AURORA', subtitle: '-10% sur votre première commande et accès en avant-première aux nouvelles collections.', placeholder: 'Votre e-mail', buttonLabel: "S'inscrire" } },
      { id: 'aurora-ft', type: 'footer', label: 'Pied de page', visible: true, props: { logo: 'AURORA', description: 'Maison de mode afro-premium, fière de son savoir-faire artisanal.', columns: [{ title: 'Boutique', links: ['Femme', 'Homme', 'Accessoires', 'Nouveautés'] }, { title: 'Maison', links: ['Notre histoire', 'Ateliers', 'Durabilité', 'Contact'] }], social: ['Instagram', 'Facebook', 'TikTok'], copyright: '© 2026 AURORA. Tous droits réservés.' } },
    ],
  },
  {
    id: 'nexus',
    name: 'Nexus',
    category: 'Business',
    description: 'Plateforme SaaS B2B pour entrepreneurs africains.',
    fonts: { heading: 'Inter, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif' },
    palette: { primary: '#1E40AF', primaryText: '#FFFFFF', accent: '#0EA5E9', bg: '#F8FAFC', surface: '#FFFFFF', text: '#0F172A', muted: '#64748B', border: '#E2E8F0', dark: '#0F172A' },
    sections: [
      { id: 'nexus-ann', type: 'announcement', label: 'Annonce', visible: true, props: { message: 'Plateforme tout-en-un pour entrepreneurs africains — Essai gratuit de 14 jours', bg: '#1E40AF', text: '#FFFFFF' } },
      { id: 'nexus-hdr', type: 'header', label: 'En-tête', visible: true, props: { logo: 'NEXUS', links: ['Fonctionnalités', 'Tarifs', 'Ressources', 'Clients', 'Contact'] } },
      { id: 'nexus-hero', type: 'hero', label: 'Bannière', visible: true, props: { image: HEROES.nexus, title: 'La plateforme qui propulse les entreprises africaines', subtitle: 'Gérez vos ventes, vos paiements Mobile Money et vos clients depuis un seul outil pensé pour le marché africain.', buttons: [{ label: 'Démarrer l\u2019essai gratuit', variant: 'primary' }, { label: 'Voir la démo', variant: 'outline' }], align: 'left' } },
      { id: 'nexus-trust', type: 'trustbar', label: 'Garanties', visible: true, props: { items: [{ icon: '⚡', text: 'Mise en route en 5 min' }, { icon: '📱', text: 'Mobile Money' }, { icon: '🔒', text: 'Sécurisé' }, { icon: '🌍', text: 'Multi-devises' }] } },
      { id: 'nexus-mc', type: 'multicolumn', label: 'Fonctionnalités', visible: true, props: { title: 'Une suite complète', items: [{ icon: '📊', title: 'Analytics', text: 'Pilotez votre croissance en temps réel.' }, { icon: '👥', title: 'CRM', text: 'Centralisez vos relations clients.' }, { icon: '💳', title: 'Paiements', text: 'Mobile Money, cartes et virements bancaires.' }, { icon: '⚡', title: 'Automations', text: 'Automatisez vos tâches répétitives.' }] } },
      { id: 'nexus-pricing', type: 'pricing', label: 'Tarifs', visible: true, props: { title: 'Des tarifs simples et transparents', plans: [{ name: 'Starter', price: '9 900', period: 'FCFA/mois', features: ['Jusqu\u2019à 100 commandes/mois', 'Paiements Mobile Money', 'Support email', '1 utilisateur'], highlighted: false }, { name: 'Business', price: '24 900', period: 'FCFA/mois', features: ['Commandes illimitées', 'Analytics avancés', 'Automations', '5 utilisateurs', 'Support prioritaire'], highlighted: true }, { name: 'Enterprise', price: 'Sur mesure', period: '', features: ['Multi-boutiques', 'API & intégrations', 'Gestion d\u2019équipe', 'Account manager', 'SLA dédié'], highlighted: false }] } },
      { id: 'nexus-it', type: 'imageText', label: 'Image + texte', visible: true, props: { image: img('nexus-it', 900, 900), title: 'Conçu pour les équipes africaines', text: 'Collaborez sans friction. Vos équipes commerciales, marketing et support enfin alignées, avec des outils adaptés aux réalités du marché local.', button: 'Découvrir les fonctionnalités', reverse: true } },
      { id: 'nexus-ts', type: 'testimonials', label: 'Témoignages', visible: true, props: { title: 'Ils propulsent leur croissance avec NEXUS', items: [{ quote: 'Gérer Mobile Money et inventaire au même endroit est un vrai game-changer.', author: 'Karim B.', role: 'CEO, TechFlow Lagos' }, { quote: 'Le meilleur investissement de l\u2019année pour notre boutique en ligne.', author: 'Léa R.', role: 'COO, GreenLab Abidjan' }, { quote: 'Enfin une plateforme pensée pour l\u2019Afrique. Nos ventes ont doublé en 3 mois.', author: 'Tunde A.', role: 'Founder, MarketHub Accra' }] } },
      { id: 'nexus-cta', type: 'cta', label: 'Appel à l\u2019action', visible: true, props: { title: 'Prêt à accélérer votre croissance ?', subtitle: 'Essai gratuit de 14 jours, sans carte bancaire. Annulez à tout moment.', buttonLabel: 'Commencer maintenant', buttonHref: '#' } },
      { id: 'nexus-ft', type: 'footer', label: 'Pied de page', visible: true, props: { logo: 'NEXUS', description: 'La plateforme de croissance pour les entreprises africaines modernes.', columns: [{ title: 'Produit', links: ['Fonctionnalités', 'Tarifs', 'Intégrations', 'Sécurité'] }, { title: 'Société', links: ['À propos', 'Carrières', 'Blog', 'Contact'] }], social: ['LinkedIn', 'Twitter', 'YouTube'], copyright: '© 2026 NEXUS. Tous droits réservés.' } },
    ],
  },
  {
    id: 'inkwell',
    name: 'Inkwell',
    category: 'Blog',
    description: 'Magazine lifestyle éditorial aux accents africains.',
    fonts: { heading: '"Playfair Display", Georgia, serif', body: 'Inter, system-ui, sans-serif' },
    palette: { primary: '#111827', primaryText: '#FFFFFF', accent: '#D97706', bg: '#FBF9F6', surface: '#FFFFFF', text: '#1F2937', muted: '#6B7280', border: '#E5E7EB', dark: '#111827' },
    sections: [
      { id: 'inkwell-ann', type: 'announcement', label: 'Annonce', visible: true, props: { message: 'Nouveaux articles chaque semaine — Abonnez-vous à la newsletter', bg: '#111827', text: '#FFFFFF' } },
      { id: 'inkwell-hdr', type: 'header', label: 'En-tête', visible: true, props: { logo: 'Inkwell', links: ['Accueil', 'Lifestyle', 'Voyages', 'Culture', 'Cuisine', 'À propos'] } },
      { id: 'inkwell-hero', type: 'hero', label: 'Bannière', visible: true, props: { image: HEROES.inkwell, title: 'Histoires & inspirations d\u2019Afrique', subtitle: 'Un magazine lifestyle qui célèbre la culture, les voyages et les saveurs du continent.', buttons: [{ label: 'Lire les articles', variant: 'primary' }], align: 'left' } },
      { id: 'inkwell-blog', type: 'blogList', label: 'Articles', visible: true, props: { title: 'Derniers articles', posts: [{ image: img('inkwell-p1', 700, 500), title: '10 rituels matinaux inspirés de la sagesse africaine', excerpt: 'Des habitudes simples puisées dans les traditions pour transformer vos matinées.', date: '12 sept. 2026' }, { image: img('inkwell-p2', 700, 500), title: 'Voyager à Gorée : un pèlerinage mémoire essentiel', excerpt: 'Tout ce qu\u2019il faut savoir pour visiter cette île chargée d\u2019histoire.', date: '5 sept. 2026' }, { image: img('inkwell-p3', 700, 500), title: 'Cuisine de saison : les épices qui sublent l\u2019automne', excerpt: 'Du gingembre au sumbala, des recettes réconfortantes et gourmandes.', date: '1 sept. 2026' }] } },
      { id: 'inkwell-it', type: 'imageText', label: 'Image + texte', visible: true, props: { image: img('inkwell-it', 900, 900), title: 'Une plume, une passion', text: 'Inkwell rassemble des auteurs passionnés pour vous offrir le meilleur du lifestyle africain, entre traditions et modernité.', button: 'En savoir plus', reverse: false } },
      { id: 'inkwell-nl', type: 'newsletter', label: 'Newsletter', visible: true, props: { title: 'Ne manquez rien', subtitle: 'Recevez nos meilleurs articles chaque dimanche, directement dans votre boîte mail.', placeholder: 'Votre e-mail', buttonLabel: "S'abonner" } },
      { id: 'inkwell-ft', type: 'footer', label: 'Pied de page', visible: true, props: { logo: 'Inkwell', description: 'Le magazine lifestyle qui inspire, au cœur du continent.', columns: [{ title: 'Catégories', links: ['Lifestyle', 'Voyages', 'Culture', 'Cuisine'] }, { title: 'Maison', links: ['À propos', 'Contact', 'Mentions légales', 'Confidentialité'] }], social: ['Instagram', 'Twitter', 'YouTube'], copyright: '© 2026 Inkwell. Tous droits réservés.' } },
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    category: 'Portfolio',
    description: 'Portfolio créatif avec galerie de projets.',
    fonts: { heading: 'Inter, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif' },
    palette: { primary: '#C2410C', primaryText: '#FFFFFF', accent: '#92400E', bg: '#FDF6F0', surface: '#FFFFFF', text: '#292524', muted: '#78716C', border: '#E7E0D8', dark: '#292524' },
    sections: [
      { id: 'studio-ann', type: 'announcement', label: 'Annonce', visible: true, props: { message: 'Studio créatif — Disponible pour de nouveaux projets', bg: '#292524', text: '#FFFFFF' } },
      { id: 'studio-hdr', type: 'header', label: 'En-tête', visible: true, props: { logo: 'STUDIO', links: ['Travaux', 'Services', 'Studio', 'Contact'] } },
      { id: 'studio-hero', type: 'hero', label: 'Bannière', visible: true, props: { image: HEROES.studio, title: 'Nous créons des marques qui marquent', subtitle: 'Identité visuelle, design digital et direction artistique pour marques ambitieuses.', buttons: [{ label: 'Voir nos travaux', variant: 'primary' }, { label: 'Démarrer un projet', variant: 'outline' }], align: 'left' } },
      { id: 'studio-gal', type: 'gallery', label: 'Galerie', visible: true, props: { title: 'Travaux récents', images: [img('studio-g1', 700, 500), img('studio-g2', 700, 500), img('studio-g3', 700, 500), img('studio-g4', 700, 500), img('studio-g5', 700, 500), img('studio-g6', 700, 500)] } },
      { id: 'studio-mc', type: 'multicolumn', label: 'Services', visible: true, props: { title: 'Nos services', items: [{ icon: '🎨', title: 'Identité de marque', text: 'Logos, chartes et systèmes visuels cohérents.' }, { icon: '📱', title: 'Design digital', text: 'Sites et applications sur-mesure.' }, { icon: '✨', title: 'Direction artistique', text: 'Campagnes et contenus qui captent l\u2019attention.' }] } },
      { id: 'studio-it', type: 'imageText', label: 'Image + texte', visible: true, props: { image: img('studio-it', 900, 900), title: 'Une approche sur-mesure', text: 'Chaque projet est unique. Nous collaborons étroitement pour donner vie à votre vision, du concept à la réalisation.', button: 'Discutons de votre projet', reverse: true } },
      { id: 'studio-ts', type: 'testimonials', label: 'Témoignages', visible: true, props: { title: "Ce qu'ils disent", items: [{ quote: 'Un studio créatif d\u2019exception. Notre refonte a tout changé.', author: 'Marie L.', role: 'Fondatrice, Belle Dakar' }, { quote: 'Professionnels, créatifs et à l\u2019écoute. Le résultat dépasse nos attentes.', author: 'Tom V.', role: 'CMO, Nova Abidjan' }, { quote: 'Ils ont su capturer l\u2019âme de notre marque. Magnifique.', author: 'Aminata K.', role: 'CEO, Sira Lagos' }] } },
      { id: 'studio-cta', type: 'cta', label: 'Appel à l\u2019action', visible: true, props: { title: 'Un projet en tête ?', subtitle: 'Parlons-en autour d\u2019un café. Première consultation gratuite.', buttonLabel: 'Nous contacter', buttonHref: '#' } },
      { id: 'studio-ft', type: 'footer', label: 'Pied de page', visible: true, props: { logo: 'STUDIO', description: 'Studio de design créatif pour marques ambitieuses.', columns: [{ title: 'Studio', links: ['Travaux', 'Services', 'Équipe', 'Carrières'] }, { title: 'Contact', links: ['Email', 'Instagram', 'LinkedIn', 'Behance'] }], social: ['Instagram', 'Behance', 'LinkedIn'], copyright: '© 2026 STUDIO. Tous droits réservés.' } },
    ],
  },
  {
    id: 'savor',
    name: 'Savor',
    category: 'Restaurant',
    description: 'Restaurant gastronomique africain moderne.',
    fonts: { heading: '"Playfair Display", Georgia, serif', body: 'Inter, system-ui, sans-serif' },
    palette: { primary: '#1F2937', primaryText: '#FFFFFF', accent: '#B45309', bg: '#FAF6F0', surface: '#FFFFFF', text: '#292524', muted: '#78716C', border: '#E7E0D8', dark: '#1F2937' },
    sections: [
      { id: 'savor-ann', type: 'announcement', label: 'Annonce', visible: true, props: { message: 'Réservations ouvertes — Réservez votre table en ligne', bg: '#1F2937', text: '#FFFFFF' } },
      { id: 'savor-hdr', type: 'header', label: 'En-tête', visible: true, props: { logo: 'Savor', links: ['Menu', 'À propos', 'Galerie', 'Réserver'] } },
      { id: 'savor-hero', type: 'hero', label: 'Bannière', visible: true, props: { image: HEROES.savor, title: 'Une expérience culinaire d\u2019exception', subtitle: 'Cuisine de saison, produits du terroir africain et saveurs inoubliables.', buttons: [{ label: 'Réserver une table', variant: 'primary' }], align: 'left' } },
      { id: 'savor-menu', type: 'menu', label: 'Carte', visible: true, props: { title: 'Notre carte', subtitle: 'Une cuisine de saison inspirée du terroir africain.', items: [{ name: 'Thieboudienne royal', description: 'Riz au poisson, légumes et sauce tomate parfumée.', price: '12 500 FCFA' }, { name: 'Poulet yassa braisé', description: 'Poulet mariné, oignons confits et riz parfumé.', price: '9 500 FCFA' }, { name: 'Mafé d\u2019agneau', description: 'Ragoût d\u2019agneau au beurre d\u2019arachide, accompagné de riz.', price: '11 000 FCFA' }, { name: 'Attiéké poisson grillé', description: 'Semoule de manioc, poisson grillé et sauce oignon-tomate.', price: '8 500 FCFA' }, { name: 'Dessert : Thiakry', description: 'Semoule de mil, yaourt et sucre de canne.', price: '3 500 FCFA' }] } },
      { id: 'savor-it', type: 'imageText', label: 'Image + texte', visible: true, props: { image: img('savor-it', 900, 900), title: 'Du producteur à l\u2019assiette', text: 'Nous sélectionnons chaque ingrédient auprès de producteurs locaux pour une fraîcheur incomparable et un impact positif sur la communauté.', button: 'Notre carte', reverse: false } },
      { id: 'savor-mc', type: 'multicolumn', label: 'Valeurs', visible: true, props: { title: 'Nos valeurs', items: [{ icon: '🌿', title: 'Local & bio', text: 'Produits de saison issus de l\u2019agriculture locale.' }, { icon: '👨\u200d🍳', title: 'Chef étoilé', text: 'Une cuisine créative signée par notre chef.' }, { icon: '🍷', title: 'Cave d\u2019exception', text: 'Accords mets-vins sélectionnés avec soin.' }] } },
      { id: 'savor-gal', type: 'gallery', label: 'Galerie', visible: true, props: { title: 'Ambiance & plats', images: [img('savor-g1', 700, 500), img('savor-g2', 700, 500), img('savor-g3', 700, 500), img('savor-g4', 700, 500)] } },
      { id: 'savor-cta', type: 'cta', label: 'Appel à l\u2019action', visible: true, props: { title: 'Réservez votre table', subtitle: 'Ouvert du mardi au dimanche, 19h–23h.', buttonLabel: 'Réserver maintenant', buttonHref: '#' } },
      { id: 'savor-ft', type: 'footer', label: 'Pied de page', visible: true, props: { logo: 'Savor', description: 'Cuisine de saison, dans un cadre d\u2019exception.', columns: [{ title: 'Informations', links: ['Menu', 'Horaires', 'Accès', 'Contact'] }, { title: 'Suivez-nous', links: ['Instagram', 'Facebook', 'TikTok'] }], social: ['Instagram', 'Facebook'], copyright: '© 2026 Savor. Tous droits réservés.' } },
    ],
  },
  {
    id: 'bloom',
    name: 'Bloom',
    category: 'E-commerce',
    description: 'Cosmétiques et soins naturels, beauté afro-premium.',
    fonts: { heading: 'Inter, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif' },
    palette: { primary: '#7C2D4A', primaryText: '#FFFFFF', accent: '#C9904B', bg: '#FBF6F1', surface: '#FFFFFF', text: '#3A2A2E', muted: '#9A8784', border: '#EDE2DA', dark: '#3A2A2E' },
    sections: [
      { id: 'bloom-ann', type: 'announcement', label: 'Annonce', visible: true, props: { message: 'Livraison gratuite dès 35 000 FCFA — Paiement Mobile Money accepté', bg: '#7C2D4A', text: '#FFFFFF' } },
      { id: 'bloom-hdr', type: 'header', label: 'En-tête', visible: true, props: { logo: 'BLOOM', links: ['Soin', 'Maquillage', 'Cheveux', 'Rituels', 'Nos boutiques'] } },
      { id: 'bloom-hero', type: 'hero', label: 'Bannière', visible: true, props: { image: HEROES.bloom, title: 'La beauté africaine, sublimée par la nature', subtitle: 'Soins naturels, cosmétiques propres et rituels inspirés du continent. Des formules pensées pour votre peau.', buttons: [{ label: 'Découvrir les soins', variant: 'primary' }, { label: 'Nos best-sellers', variant: 'outline' }], align: 'left' } },
      { id: 'bloom-trust', type: 'trustbar', label: 'Garanties', visible: true, props: { items: [{ icon: '🌿', text: '100% naturel' }, { icon: '🐰', text: 'Cruelty-free' }, { icon: '📦', text: 'Livraison 48h' }, { icon: '💳', text: 'Mobile Money' }] } },
      { id: 'bloom-coll', type: 'collectionList', label: 'Catégories', visible: true, props: { title: 'Nos rayons', columns: 4, items: [{ image: img('bloom-c1', 500, 650), title: 'Soin visage', count: '64 articles' }, { image: img('bloom-c2', 500, 650), title: 'Corps & bain', count: '48 articles' }, { image: img('bloom-c3', 500, 650), title: 'Cheveux', count: '52 articles' }, { image: img('bloom-c4', 500, 650), title: 'Maquillage', count: '37 articles' }] } },
      { id: 'bloom-grid', type: 'productGrid', label: 'Best-sellers', visible: true, props: { title: 'Les coups de cœur', columns: 4, products: [{ image: img('bloom-p1'), title: 'Sérum éclat Karité', price: '24 500 FCFA', rating: 5 }, { image: img('bloom-p2'), title: 'Huile précieuse Baobab', price: '18 900 FCFA', rating: 5 }, { image: img('bloom-p3'), title: 'Crème jour Hibiscus', price: '21 000 FCFA', rating: 4 }, { image: img('bloom-p4'), title: 'Gommage sucre Miel', price: '14 500 FCFA', rating: 5 }] } },
      { id: 'bloom-icons', type: 'iconGrid', label: 'Engagements', visible: true, props: { title: 'Nos engagements', columns: 3, items: [{ iconImage: '', icon: '🌱', title: 'Ingrédients naturels', text: 'Karité, baobab et hibiscus sourcés localement.' }, { iconImage: '', icon: '♻️', title: 'Éco-responsable', text: 'Recharges et emballages recyclables.' }, { iconImage: '', icon: '🤍', title: 'Pensé pour vous', text: 'Conseils beauté personnalisés par nos experts.' }] } },
      { id: 'bloom-it', type: 'imageText', label: 'Rituel', visible: true, props: { image: img('bloom-it', 900, 900), title: 'Le rituel karité', text: 'Un savoir-faire transmis par les coopératives de femmes au Burkina Faso, pour une peau nourrie et lumineuse.', button: 'Découvrir l\u2019histoire', reverse: false } },
      { id: 'bloom-ts', type: 'testimonials', label: 'Avis', visible: true, props: { title: 'Elles ont adopté Bloom', items: [{ quote: 'Mon teint est transformé. Le sérum karité est magique.', author: 'Rokia S.', role: 'Abidjan' }, { quote: 'Produits naturels et efficaces. Je ne peux plus m\u2019en passer.', author: 'Esi A.', role: 'Accra' }, { quote: 'Service parfait et livraison rapide à Douala.', author: 'Nadège M.', role: 'Douala' }] } },
      { id: 'bloom-nl', type: 'newsletter', label: 'Newsletter', visible: true, props: { title: 'Rejoignez le cercle Bloom', subtitle: '-15% sur votre première commande et nos rituels beauté exclusifs.', placeholder: 'Votre e-mail', buttonLabel: "S'inscrire" } },
      { id: 'bloom-ft', type: 'footer', label: 'Pied de page', visible: true, props: { logo: 'BLOOM', description: 'Cosmétiques naturels, pensés pour la beauté africaine.', columns: [{ title: 'Boutique', links: ['Soin', 'Maquillage', 'Cheveux', 'Rituels'] }, { title: 'Maison', links: ['Notre histoire', 'Coopératives', 'Engagements', 'Contact'] }], social: ['Instagram', 'TikTok', 'YouTube'], copyright: '© 2026 BLOOM. Tous droits réservés.' } },
    ],
  },
  {
    id: 'heritage',
    name: 'Heritage',
    category: 'E-commerce',
    description: 'Décor et artisanat africain pour la maison.',
    fonts: { heading: 'Inter, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif' },
    palette: { primary: '#5B3A29', primaryText: '#FFFFFF', accent: '#C2410C', bg: '#F7F2EC', surface: '#FFFFFF', text: '#3B2E26', muted: '#8C7A6B', border: '#E7DDD2', dark: '#3B2E26' },
    sections: [
      { id: 'heritage-ann', type: 'announcement', label: 'Annonce', visible: true, props: { message: 'Mobilier et décor faits main — Pièces uniques livrées partout en Afrique', bg: '#3B2E26', text: '#FFFFFF' } },
      { id: 'heritage-hdr', type: 'header', label: 'En-tête', visible: true, props: { logo: 'HERITAGE', links: ['Nouveautés', 'Mobilier', 'Textile', 'Décor', 'Artisanat'] } },
      { id: 'heritage-hero', type: 'hero', label: 'Bannière', visible: true, props: { image: HEROES.heritage, title: "L'artisanat africain, dans votre intérieur", subtitle: 'Mobilier, textile et décor faits main par des artisans d\u2019exception. Des pièces qui racontent une histoire.', buttons: [{ label: 'Explorer la collection', variant: 'primary' }, { label: 'Nos artisans', variant: 'outline' }], align: 'left' } },
      { id: 'heritage-trust', type: 'trustbar', label: 'Garanties', visible: true, props: { items: [{ icon: '🪑', text: 'Fait main' }, { icon: '🌍', text: 'Commerce équitable' }, { icon: '🚚', text: 'Livraison soignée' }, { icon: '↩️', text: 'Satisfait ou remboursé' }] } },
      { id: 'heritage-coll', type: 'collectionList', label: 'Catégories', visible: true, props: { title: 'Par style', columns: 4, items: [{ image: img('heritage-c1', 500, 650), title: 'Mobilier', count: '86 articles' }, { image: img('heritage-c2', 500, 650), title: 'Textile', count: '64 articles' }, { image: img('heritage-c3', 500, 650), title: 'Décor mural', count: '43 articles' }, { image: img('heritage-c4', 500, 650), title: 'Vannerie', count: '38 articles' }] } },
      { id: 'heritage-grid', type: 'productGrid', label: 'Produits', visible: true, props: { title: 'Sélection du mois', columns: 4, products: [{ image: img('heritage-p1'), title: 'Fauteuil Sénoufo', price: '185 000 FCFA', rating: 5 }, { image: img('heritage-p2'), title: 'Tapis Kente tissé', price: '92 000 FCFA', rating: 5 }, { image: img('heritage-p3'), title: 'Panier Bolga', price: '34 000 FCFA', rating: 5 }, { image: img('heritage-p4'), title: 'Lampe terracotta', price: '48 500 FCFA', rating: 4 }] } },
      { id: 'heritage-icons', type: 'iconGrid', label: 'Valeurs', visible: true, props: { title: 'Notre savoir-faire', columns: 3, items: [{ iconImage: '', icon: '🤲', title: 'Fait main', text: 'Chaque pièce est unique, façonnée par des artisans.' }, { iconImage: '', icon: '🌿', title: 'Matières durables', text: 'Bois, terre cuite, coton et fibres naturelles.' }, { iconImage: '', icon: '🤝', title: 'Commerce équitable', text: "Rémunération juste des coopératives d'artisans." }] } },
      { id: 'heritage-it', type: 'imageText', label: 'Histoire', visible: true, props: { image: img('heritage-it', 900, 900), title: 'Des artisans à votre intérieur', text: 'Nous collaborons avec des ateliers au Ghana, Sénégal et Mali pour préserver des savoir-faire ancestraux et les partager avec le monde.', button: 'Rencontrer nos artisans', reverse: true } },
      { id: 'heritage-ts', type: 'testimonials', label: 'Avis', visible: true, props: { title: 'Ils ont décoré avec Heritage', items: [{ quote: 'Mon fauteuil Sénoufo est magnifique. Qualité d\u2019exception.', author: 'Yann P.', role: 'Dakar' }, { quote: 'Le tapis Kente illumine mon salon. Livré rapidement.', author: 'Amira H.', role: 'Caire' }, { quote: 'Artisanat parfait et éthique. Je recommande à 100%.', author: 'Kojo M.', role: 'Kumasi' }] } },
      { id: 'heritage-nl', type: 'newsletter', label: 'Newsletter', visible: true, props: { title: 'Inspirations déco', subtitle: 'Recevez nos nouveautés et idées déco africaines chaque mois.', placeholder: 'Votre e-mail', buttonLabel: "S'inscrire" } },
      { id: 'heritage-ft', type: 'footer', label: 'Pied de page', visible: true, props: { logo: 'HERITAGE', description: 'Décor et artisanat africain, fait main avec passion.', columns: [{ title: 'Boutique', links: ['Mobilier', 'Textile', 'Décor', 'Vannerie'] }, { title: 'Maison', links: ['Nos artisans', 'Engagements', 'Livraison', 'Contact'] }], social: ['Instagram', 'Pinterest', 'Facebook'], copyright: '© 2026 HERITAGE. Tous droits réservés.' } },
    ],
  },
  {
    id: 'souk',
    name: 'Souk',
    category: 'Marketplace',
    description: "Marketplace multi-vendeurs premium pour l'Afrique.",
    fonts: { heading: 'Inter, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif' },
    palette: { primary: '#1E3A5F', primaryText: '#FFFFFF', accent: '#D4AF37', bg: '#F4F6F9', surface: '#FFFFFF', text: '#233040', muted: '#6B7A89', border: '#E2E7EC', dark: '#1E3A5F' },
    sections: [
      { id: 'souk-ann', type: 'announcement', label: 'Annonce', visible: true, props: { message: 'Des milliers de vendeurs vérifiés — Paiement sécurisé, garantie acheteur', bg: '#1E3A5F', text: '#FFFFFF' } },
      { id: 'souk-hdr', type: 'header', label: 'En-tête', visible: true, props: { logo: 'SOUK', links: ['Catégories', 'Vendeurs', 'Promotions', 'Vendre', 'Aide'] } },
      { id: 'souk-hero', type: 'hero', label: 'Bannière', visible: true, props: { image: HEROES.souk, title: "La marketplace premium d'Afrique", subtitle: 'Mode, beauté, maison, tech — des milliers de produits de vendeurs vérifiés, livrés chez vous.', buttons: [{ label: 'Acheter maintenant', variant: 'primary' }, { label: 'Devenir vendeur', variant: 'outline' }], align: 'left' } },
      { id: 'souk-trust', type: 'trustbar', label: 'Garanties', visible: true, props: { items: [{ icon: '✅', text: 'Vendeurs vérifiés' }, { icon: '🔒', text: 'Paiement sécurisé' }, { icon: '🛡️', text: 'Garantie acheteur' }, { icon: '🚚', text: 'Livraison trackée' }] } },
      { id: 'souk-coll', type: 'collectionList', label: 'Catégories', visible: true, props: { title: 'Tout trouver sur Souk', columns: 4, items: [{ image: img('souk-c1', 500, 650), title: 'Mode', count: '12 400 articles' }, { image: img('souk-c2', 500, 650), title: 'Beauté', count: '8 700 articles' }, { image: img('souk-c3', 500, 650), title: 'Maison', count: '6 300 articles' }, { image: img('souk-c4', 500, 650), title: 'Tech', count: '4 100 articles' }] } },
      { id: 'souk-grid', type: 'productGrid', label: 'Vendeurs en vedette', visible: true, props: { title: 'Les meilleurs vendeurs', columns: 4, products: [{ image: img('souk-p1'), title: 'Montre classique Or', price: '145 000 FCFA', rating: 5 }, { image: img('souk-p2'), title: 'Casque audio Pro', price: '89 000 FCFA', rating: 4 }, { image: img('souk-p3'), title: 'Sac cuir premium', price: '76 500 FCFA', rating: 5 }, { image: img('souk-p4'), title: 'Sneakers édition', price: '58 000 FCFA', rating: 5 }] } },
      { id: 'souk-icons', type: 'iconGrid', label: 'Pourquoi Souk', visible: true, props: { title: 'Acheter en confiance', columns: 4, items: [{ iconImage: '', icon: '✅', title: 'Vendeurs vérifiés', text: 'Chaque vendeur est contrôlé.' }, { iconImage: '', icon: '🔒', title: 'Paiement protégé', text: 'Vos fonds en séquestre.' }, { iconImage: '', icon: '🚚', title: 'Livraison trackée', text: 'Suivez chaque colis.' }, { iconImage: '', icon: '↩️', title: 'Retours faciles', text: 'Satisfait ou remboursé.' }] } },
      { id: 'souk-pricing', type: 'pricing', label: 'Vendre sur Souk', visible: true, props: { title: 'Devenez vendeur', plans: [{ name: 'Starter', price: '0', period: 'FCFA/mois', features: ["Jusqu'à 20 produits", 'Commission 8%', 'Paiements Mobile Money', 'Support email'], highlighted: false }, { name: 'Pro', price: '19 900', period: 'FCFA/mois', features: ['Produits illimités', 'Commission 5%', 'Boutique personnalisée', 'Analytics vendeur', 'Support prioritaire'], highlighted: true }, { name: 'Business', price: '49 900', period: 'FCFA/mois', features: ['Multi-boutiques', 'Commission 3%', 'API & intégrations', 'Account manager', 'Promos mises en avant'], highlighted: false }] } },
      { id: 'souk-ts', type: 'testimonials', label: 'Vendeurs', visible: true, props: { title: 'Ils vendent sur Souk', items: [{ quote: 'Mes ventes ont triplé en 6 mois. La plateforme est intuitive.', author: 'Awa D.', role: 'Boutique Awa Mode' }, { quote: 'Toucher Mobile Money instantanément change tout pour mon business.', author: 'Sam K.', role: 'TechHub Lagos' }, { quote: 'Le support vendeur est exceptionnel. Recommandé à tous mes partenaires.', author: 'Léa B.', role: 'Beauty Lab Abidjan' }] } },
      { id: 'souk-cta', type: 'cta', label: 'Vendeur', visible: true, props: { title: 'Prêt à vendre sur Souk ?', subtitle: "Ouvrez votre boutique en 10 minutes. Sans frais d'inscription.", buttonLabel: 'Devenir vendeur', buttonHref: '#' } },
      { id: 'souk-nl', type: 'newsletter', label: 'Newsletter', visible: true, props: { title: 'Meilleures offres', subtitle: 'Recevez les meilleures promotions chaque semaine.', placeholder: 'Votre e-mail', buttonLabel: "S'inscrire" } },
      { id: 'souk-ft', type: 'footer', label: 'Pied de page', visible: true, props: { logo: 'SOUK', description: 'La marketplace premium qui connecte vendeurs et acheteurs africains.', columns: [{ title: 'Acheter', links: ['Catégories', 'Promotions', 'Vendeurs', 'Nouveautés'] }, { title: 'Vendre', links: ['Devenir vendeur', 'Tarifs', 'Centre vendeur', 'Aide'] }, { title: 'Société', links: ['À propos', 'Carrières', 'Presse', 'Contact'] }], social: ['LinkedIn', 'Instagram', 'Twitter'], copyright: '© 2026 SOUK. Tous droits réservés.' } },
    ],
  },
];

export const DEFAULT_THEME_ID = 'aurora';

export function getThemeById(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function cloneTheme(id) {
  const t = getThemeById(id);
  return {
    id: t.id,
    name: t.name,
    category: t.category,
    fonts: { ...t.fonts },
    palette: { ...t.palette },
    sections: JSON.parse(JSON.stringify(t.sections)),
  };
}