import { ThemeConfig } from './types';

/**
 * ============================================================================
 * PRESETS DE THÈME
 * ----------------------------------------------------------------------------
 * Trois configurations JSON complètes, construites sur le MÊME schema
 * `ThemeConfig`, pour trois cas d'usage produit distincts. Chacune peut être
 * passée directement à `<TemplateRenderer config={preset} />`.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. E-COMMERCE — boutique en ligne
// ----------------------------------------------------------------------------

export const ecommercePreset: ThemeConfig = {
  settings: {
    colors: {
      primary: '#1C1917',
      secondary: '#78716C',
      accent: '#C2410C',
      background: '#FFFFFF',
      text: '#1C1917',
      cardBackground: '#FAFAF9',
      border: '#E7E5E4',
    },
    typography: {
      headingFont: "'Montserrat', sans-serif",
      bodyFont: "'Plus Jakarta Sans', sans-serif",
    },
    borderRadius: 'md',
    containerWidth: 'boxed',
  },
  sections: [
    {
      id: 'header-1',
      type: 'header',
      active: true,
      styles: { paddingTop: 'sm', paddingBottom: 'sm', alignment: 'left' },
      content: {
        logoType: 'text',
        logoText: 'Maison Loro',
        navLinks: [
          { label: 'Nouveautés', href: '#new' },
          { label: 'Collections', href: '#collections' },
          { label: 'Vestiaire', href: '#wardrobe' },
          { label: 'À propos', href: '#about' },
        ],
        ctaLabel: 'Commander',
        ctaHref: '#shop',
        showCart: true,
        cartCount: 3,
      },
    },
    {
      id: 'hero-1',
      type: 'hero',
      active: true,
      styles: { paddingTop: 'xl', paddingBottom: 'xl', alignment: 'left' },
      content: {
        layout: 'split',
        eyebrow: 'Collection Automne',
        title: 'Des pièces pensées pour durer, pas pour la saison.',
        subtitle:
          "Matières naturelles, ateliers européens, coupes intemporelles. Chaque vêtement de notre collection est conçu pour être porté pendant des années, pas juste une saison.",
        buttons: [
          { label: 'Voir la collection', href: '#collections', variant: 'primary' },
          { label: 'Notre démarche', href: '#about', variant: 'secondary' },
        ],
        reassuranceBadge: 'Livraison offerte dès 120€ · Retours gratuits sous 30 jours',
        imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=80',
      },
    },
    {
      id: 'product-grid-1',
      type: 'productGrid',
      active: true,
      styles: { paddingTop: 'lg', paddingBottom: 'lg', alignment: 'left' },
      content: {
        title: 'Meilleures ventes de la saison',
        subtitle: 'Sélectionnées par notre équipe de style, plébiscitées par nos clients.',
        columns: 4,
        products: [
          {
            id: 'p1',
            name: 'Manteau laine mérinos',
            imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80',
            price: 289,
            compareAtPrice: 360,
            currency: 'EUR',
            badge: 'promo',
          },
          {
            id: 'p2',
            name: 'Chemise lin délavé',
            imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80',
            price: 89,
            currency: 'EUR',
            badge: 'nouveau',
          },
          {
            id: 'p3',
            name: 'Pantalon tailleur',
            imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80',
            price: 145,
            currency: 'EUR',
            badge: null,
          },
          {
            id: 'p4',
            name: 'Pull col rond cachemire',
            imageUrl: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=600&q=80',
            price: 195,
            compareAtPrice: 230,
            currency: 'EUR',
            badge: 'promo',
          },
        ],
      },
    },
    {
      id: 'testimonials-1',
      type: 'testimonials',
      active: true,
      styles: { paddingTop: 'lg', paddingBottom: 'lg', backgroundColor: '#FAFAF9', alignment: 'center' },
      content: {
        title: 'Ce que nos clients en disent',
        subtitle: 'Plus de 12 000 avis vérifiés depuis 2019.',
        items: [
          {
            id: 't1',
            quote:
              "La qualité des matières est incomparable. J'ai un manteau porté depuis 3 hivers, toujours impeccable.",
            authorName: 'Camille D.',
            authorRole: 'Cliente depuis 2021',
            rating: 5,
          },
          {
            id: 't2',
            quote: 'Coupes parfaites, livraison rapide, service client très réactif. Rien à redire.',
            authorName: 'Julien M.',
            authorRole: 'Client depuis 2022',
            rating: 5,
          },
          {
            id: 't3',
            quote: "Un vrai savoir-faire artisanal qu'on ne trouve plus souvent à ce niveau de prix.",
            authorName: 'Sarah L.',
            authorRole: 'Cliente depuis 2020',
            rating: 4,
          },
        ],
      },
    },
    {
      id: 'footer-1',
      type: 'footer',
      active: true,
      styles: { paddingTop: 'lg', paddingBottom: 'md', alignment: 'left' },
      content: {
        logoText: 'Maison Loro',
        description: 'Vêtements intemporels fabriqués en Europe à partir de matières naturelles.',
        columns: [
          {
            title: 'Boutique',
            links: [
              { label: 'Nouveautés', href: '#new' },
              { label: 'Femme', href: '#women' },
              { label: 'Homme', href: '#men' },
            ],
          },
          {
            title: 'Aide',
            links: [
              { label: 'Livraison', href: '#shipping' },
              { label: 'Retours', href: '#returns' },
              { label: 'Guide des tailles', href: '#sizing' },
            ],
          },
          {
            title: 'Entreprise',
            links: [
              { label: 'Notre histoire', href: '#story' },
              { label: 'Ateliers', href: '#workshops' },
              { label: 'Carrières', href: '#careers' },
            ],
          },
        ],
        socialLinks: [
          { platform: 'instagram', href: 'https://instagram.com' },
          { platform: 'facebook', href: 'https://facebook.com' },
        ],
        copyright: '© 2026 Maison Loro. Tous droits réservés.',
      },
    },
  ],
};

// ----------------------------------------------------------------------------
// 2. SAAS LANDING — application / produit logiciel
// ----------------------------------------------------------------------------

export const saasLandingPreset: ThemeConfig = {
  settings: {
    colors: {
      primary: '#4F46E5',
      secondary: '#6366F1',
      accent: '#059669',
      background: '#FFFFFF',
      text: '#111827',
      cardBackground: '#F9FAFB',
      border: '#E5E7EB',
    },
    typography: {
      headingFont: "'Montserrat', sans-serif",
      bodyFont: "'Plus Jakarta Sans', sans-serif",
    },
    borderRadius: 'lg',
    containerWidth: 'boxed',
  },
  sections: [
    {
      id: 'header-1',
      type: 'header',
      active: true,
      styles: { paddingTop: 'sm', paddingBottom: 'sm', alignment: 'left' },
      content: {
        logoType: 'text',
        logoText: 'Flowbase',
        navLinks: [
          { label: 'Produit', href: '#product' },
          { label: 'Tarifs', href: '#pricing' },
          { label: 'Ressources', href: '#resources' },
          { label: 'Entreprise', href: '#enterprise' },
        ],
        ctaLabel: 'Essai gratuit',
        ctaHref: '#signup',
        showCart: false,
      },
    },
    {
      id: 'hero-1',
      type: 'hero',
      active: true,
      styles: { paddingTop: 'xl', paddingBottom: 'lg', alignment: 'center' },
      content: {
        layout: 'centered',
        eyebrow: 'Nouveau · Automatisations IA',
        title: 'Le hub opérationnel qui connecte toute votre équipe',
        subtitle:
          'Flowbase centralise vos tâches, vos données et vos automatisations dans un seul espace de travail — sans jongler entre 12 outils différents.',
        buttons: [
          { label: 'Démarrer gratuitement', href: '#signup', variant: 'primary' },
          { label: 'Voir la démo', href: '#demo', variant: 'secondary' },
        ],
        reassuranceBadge: 'Aucune carte bancaire requise · Configuration en 5 minutes',
      },
    },
    {
      id: 'social-proof-1',
      type: 'socialProof',
      active: true,
      styles: { paddingTop: 'md', paddingBottom: 'md', alignment: 'center' },
      content: {
        title: 'Utilisé par des équipes exigeantes, partout dans le monde',
        stats: [
          { value: '14K+', label: "équipes actives" },
          { value: '2,4M', label: 'tâches automatisées / mois' },
          { value: '99,98%', label: 'disponibilité' },
          { value: '4,8/5', label: 'satisfaction client' },
        ],
        logos: [
          { name: 'Northwind', imageUrl: 'https://dummyimage.com/140x32/111827/ffffff&text=Northwind' },
          { name: 'Vantage', imageUrl: 'https://dummyimage.com/140x32/111827/ffffff&text=Vantage' },
          { name: 'Sablier', imageUrl: 'https://dummyimage.com/140x32/111827/ffffff&text=Sablier' },
          { name: 'Cortex', imageUrl: 'https://dummyimage.com/140x32/111827/ffffff&text=Cortex' },
        ],
      },
    },
    {
      id: 'features-1',
      type: 'features',
      active: true,
      styles: { paddingTop: 'lg', paddingBottom: 'lg', alignment: 'center' },
      content: {
        title: 'Tout ce dont votre équipe a besoin, réuni',
        subtitle: 'Conçu pour remplacer votre pile d’outils dispersés par un seul espace connecté.',
        columns: 3,
        items: [
          {
            icon: 'Workflow',
            title: 'Automatisations sans code',
            description: 'Créez des workflows complexes en glisser-déposer, sans écrire une ligne de code.',
          },
          {
            icon: 'Users',
            title: 'Collaboration en temps réel',
            description: 'Travaillez ensemble sur les mêmes documents, tâches et tableaux de bord, en direct.',
          },
          {
            icon: 'ShieldCheck',
            title: 'Sécurité de niveau entreprise',
            description: 'Chiffrement de bout en bout, SSO, journaux d’audit et conformité SOC 2 Type II.',
          },
          {
            icon: 'Zap',
            title: 'Intégrations natives',
            description: 'Connectez plus de 120 outils existants en quelques clics, sans configuration complexe.',
          },
          {
            icon: 'BarChart3',
            title: 'Tableaux de bord en direct',
            description: 'Suivez vos indicateurs clés en temps réel, avec des rapports personnalisables.',
          },
          {
            icon: 'Headset',
            title: 'Support dédié 24/5',
            description: 'Une équipe d’experts produit disponible pour répondre à vos questions rapidement.',
          },
        ],
      },
    },
    {
      id: 'cta-1',
      type: 'cta',
      active: true,
      styles: { paddingTop: 'md', paddingBottom: 'md', alignment: 'center' },
      content: {
        title: 'Prêt à unifier le travail de votre équipe ?',
        subtitle: 'Rejoignez plus de 14 000 équipes qui ont déjà simplifié leurs opérations avec Flowbase.',
        buttonLabel: 'Démarrer gratuitement',
        buttonHref: '#signup',
        backgroundStyle: 'gradient',
      },
    },
    {
      id: 'footer-1',
      type: 'footer',
      active: true,
      styles: { paddingTop: 'lg', paddingBottom: 'md', alignment: 'left' },
      content: {
        logoText: 'Flowbase',
        description: "L'espace de travail unifié pour les équipes qui veulent avancer plus vite.",
        columns: [
          {
            title: 'Produit',
            links: [
              { label: 'Fonctionnalités', href: '#features' },
              { label: 'Tarifs', href: '#pricing' },
              { label: 'Intégrations', href: '#integrations' },
            ],
          },
          {
            title: 'Ressources',
            links: [
              { label: 'Documentation', href: '#docs' },
              { label: 'Centre d’aide', href: '#help' },
              { label: 'Statut', href: '#status' },
            ],
          },
          {
            title: 'Entreprise',
            links: [
              { label: 'À propos', href: '#about' },
              { label: 'Carrières', href: '#careers' },
              { label: 'Contact', href: '#contact' },
            ],
          },
        ],
        socialLinks: [
          { platform: 'twitter', href: 'https://twitter.com' },
          { platform: 'linkedin', href: 'https://linkedin.com' },
          { platform: 'youtube', href: 'https://youtube.com' },
        ],
        copyright: '© 2026 Flowbase Inc. Tous droits réservés.',
      },
    },
  ],
};

// ----------------------------------------------------------------------------
// 3. BUSINESS — agence / entreprise locale
// ----------------------------------------------------------------------------

export const businessPreset: ThemeConfig = {
  settings: {
    colors: {
      primary: '#0F172A',
      secondary: '#334155',
      accent: '#CA8A04',
      background: '#FFFFFF',
      text: '#0F172A',
      cardBackground: '#F8FAFC',
      border: '#E2E8F0',
    },
    typography: {
      headingFont: "'Montserrat', sans-serif",
      bodyFont: "'Plus Jakarta Sans', sans-serif",
    },
    borderRadius: 'sm',
    containerWidth: 'boxed',
  },
  sections: [
    {
      id: 'header-1',
      type: 'header',
      active: true,
      styles: { paddingTop: 'sm', paddingBottom: 'sm', alignment: 'left' },
      content: {
        logoType: 'text',
        logoText: 'Verdier & Associés',
        navLinks: [
          { label: 'Expertises', href: '#services' },
          { label: 'Réalisations', href: '#work' },
          { label: 'Équipe', href: '#team' },
          { label: 'Contact', href: '#contact' },
        ],
        ctaLabel: 'Nous contacter',
        ctaHref: '#contact',
        showCart: false,
      },
    },
    {
      id: 'hero-1',
      type: 'hero',
      active: true,
      styles: { paddingTop: 'xl', paddingBottom: 'xl', alignment: 'left' },
      content: {
        layout: 'full-bg',
        eyebrow: 'Cabinet de conseil depuis 2008',
        title: 'Des stratégies concrètes pour des résultats mesurables',
        subtitle:
          "Nous accompagnons les PME et ETI dans leur transformation opérationnelle, avec une approche pragmatique et des livrables actionnables dès le premier mois.",
        buttons: [
          { label: 'Prendre rendez-vous', href: '#contact', variant: 'primary' },
          { label: 'Nos expertises', href: '#services', variant: 'secondary' },
        ],
        reassuranceBadge: 'Plus de 200 entreprises accompagnées en France et en Europe',
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
      },
    },
    {
      id: 'features-1',
      type: 'features',
      active: true,
      styles: { paddingTop: 'lg', paddingBottom: 'lg', alignment: 'left' },
      content: {
        title: 'Nos domaines d’expertise',
        subtitle: 'Une approche sur mesure, adaptée à la maturité et aux enjeux de chaque organisation.',
        columns: 3,
        items: [
          {
            icon: 'LineChart',
            title: 'Stratégie & croissance',
            description: 'Diagnostic, positionnement marché et plans d’action priorisés sur 12 à 18 mois.',
          },
          {
            icon: 'Settings2',
            title: 'Excellence opérationnelle',
            description: 'Optimisation des process internes et réduction des coûts sans perte de qualité.',
          },
          {
            icon: 'Users2',
            title: 'Organisation & talents',
            description: 'Structuration des équipes, plans de formation et accompagnement du changement.',
          },
        ],
      },
    },
    {
      id: 'testimonials-1',
      type: 'testimonials',
      active: true,
      styles: { paddingTop: 'lg', paddingBottom: 'lg', backgroundColor: '#F8FAFC', alignment: 'center' },
      content: {
        title: 'La confiance de nos clients',
        items: [
          {
            id: 't1',
            quote:
              "Un accompagnement rigoureux, des recommandations claires et un vrai impact sur notre rentabilité en moins d'un an.",
            authorName: 'Élodie Vasseur',
            authorRole: 'Directrice Générale, Norvic Industries',
            rating: 5,
          },
          {
            id: 't2',
            quote: 'Une équipe qui comprend nos enjeux terrain et qui livre des plans réellement applicables.',
            authorName: 'Thomas Reinach',
            authorRole: 'Fondateur, Atelier Reinach',
            rating: 5,
          },
        ],
      },
    },
    {
      id: 'cta-1',
      type: 'cta',
      active: true,
      styles: { paddingTop: 'md', paddingBottom: 'md', alignment: 'center' },
      content: {
        title: 'Discutons de vos enjeux',
        subtitle: 'Un premier échange de 30 minutes, sans engagement, pour identifier vos priorités.',
        buttonLabel: 'Planifier un échange',
        buttonHref: '#contact',
        backgroundStyle: 'solid',
      },
    },
    {
      id: 'footer-1',
      type: 'footer',
      active: true,
      styles: { paddingTop: 'lg', paddingBottom: 'md', alignment: 'left' },
      content: {
        logoText: 'Verdier & Associés',
        description: 'Cabinet de conseil en stratégie et organisation basé à Lyon, actif dans toute l’Europe.',
        columns: [
          {
            title: 'Cabinet',
            links: [
              { label: 'Notre équipe', href: '#team' },
              { label: 'Nos valeurs', href: '#values' },
              { label: 'Carrières', href: '#careers' },
            ],
          },
          {
            title: 'Expertises',
            links: [
              { label: 'Stratégie', href: '#strategy' },
              { label: 'Opérations', href: '#operations' },
              { label: 'Organisation', href: '#organization' },
            ],
          },
          {
            title: 'Contact',
            links: [
              { label: 'Nous écrire', href: '#contact' },
              { label: 'Lyon, France', href: '#map' },
              { label: '+33 4 00 00 00 00', href: 'tel:+33400000000' },
            ],
          },
        ],
        socialLinks: [{ platform: 'linkedin', href: 'https://linkedin.com' }],
        copyright: '© 2026 Verdier & Associés. Tous droits réservés.',
      },
    },
  ],
};

export const themePresets = {
  ecommerce: ecommercePreset,
  saasLanding: saasLandingPreset,
  business: businessPreset,
};

export default themePresets;
