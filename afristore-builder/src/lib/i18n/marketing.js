// Marketing-section dictionaries (7 languages). Merged into the i18n provider
// alongside translations.js. Keys: features, pricing, showcase, testimonials,
// psps, flags, howItWorks, brands.

export const MARKETING = {
  fr: {
    features: {
      badge: "Fonctionnalités",
      title: "Tout ce qu'il faut pour vendre en ligne",
      subtitle: "Une plateforme complète, de la création de boutique à l'encaissement — en un seul outil.",
      tab: { create: "Créer & Personnaliser", sell: "Vendre & Encaisser", manage: "Gérer & Livrer", grow: "Croître & Analyser" },
      items: {
        create: [
          { title: "Éditeur visuel drag & drop", text: "Créez une vitrine premium sans toucher au code. Prévisualisation desktop, tablette et mobile en temps réel." },
          { title: "Thèmes premium internationaux", text: "Des thèmes raffinés et personnalisables aux couleurs de votre marque, pensés pour les marchands du monde entier." },
          { title: "Collections intelligentes", text: "Collections manuelles ou automatiques avec règles dynamiques sur tags, prix, stock et statut." },
          { title: "Responsive natif", text: "Chaque boutique s'adapte parfaitement au mobile — là où vos clients achètent réellement." },
        ],
        sell: [
          { title: "25+ PSP mondiaux", text: "Paystack, Flutterwave, M-Pesa, Stripe, PayPal, Payunit… Cartes, Mobile Money et virements sans redirection." },
          { title: "Multi-devises & marchés", text: "Vendez partout avec gestion native des devises ISO (XOF, NGN, USD, EUR) et traduction en 7 langues." },
          { title: "Checkout sans redirection", text: "Tunnel d'achat 100% intégré — vos clients ne quittent jamais votre boutique. Abandon réduit, conversion maximale." },
          { title: "Promotions & réductions", text: "Codes promo, remises en pourcentage, montant fixe ou livraison offerte avec règles automatiques." },
        ],
        manage: [
          { title: "Stocks & variantes", text: "Suivi par variante, alertes de stock bas et gestion multi-emplacements pour ne jamais être en rupture." },
          { title: "Livraison multi-zones", text: "Tarifs par région, pays et poids. Livraison gratuite conditionnelle et suivi automatisé des colis." },
          { title: "Gestion clients", text: "Profils clients, historique d'achats, adresses multiples et tags pour un suivi complet et personnalisé." },
          { title: "Place de marché", text: "Lancez une marketplace multi-vendeurs avec gestion des vendeurs, commissions et paiements répartis." },
        ],
        grow: [
          { title: "Analytics temps réel", text: "Suivez ventes, visiteurs, taux de conversion par produit et tunnel d'achat sur un tableau de bord actionnable." },
          { title: "Assistant IA", text: "Générez descriptions produit, contenus SEO et thèmes entiers grâce à l'IA intégrée Sellia." },
          { title: "Marketing & automations", text: "Campagnes e-mail, récupération de paniers abandonnés et automatisations déclenchées par événements." },
          { title: "Alertes intelligentes", text: "Notifications automatiques de stock bas, nouvelles commandes et anomalies — par e-mail ou push." },
        ],
      },
      stats: [
        { value: "25+", label: "PSP intégrés" },
        { value: "7", label: "Langues natives" },
        { value: "4,9/5", label: "Satisfaction marchands" },
        { value: "99,9%", label: "Disponibilité" },
      ],
    },
    pricing: {
      badge: "Tarifs", title: "Des prix pour tous les marchands",
      subtitle: "14 jours d'essai gratuit sur tous les plans. Sans carte bancaire.",
      annual: "Annuel : économisez 20%", popular: "Le plus populaire", perMonth: "/mois", included: "Inclus", startCta: "Commencer",
      allPricesNote: "Tous les prix en USD. Facturation mensuelle ou annuelle.", payWith: "Payez votre abonnement avec",
      mobileTitle: "Une expérience mobile premium",
      mobileText: "Vos clients achètent depuis leur téléphone, partout dans le monde. Checkout fluide, paiements sans redirection, support Mobile Money et cartes.",
      ratingText: "4,9/5 — 12 000+ marchands",
      plans: [
        { name: "Starter", desc: "Pour lancer votre première boutique.", features: ["1 boutique", "50 produits", "Thèmes de base", "Paiements manuels", "1 utilisateur", "Sous-domaine sellia.app"] },
        { name: "Growth", desc: "Pour les marchands en croissance.", features: ["1 000 produits", "Tous les thèmes premium", "Éditeur visuel", "Paiements intégrés", "Multi-devises", "Analytics de base", "3 utilisateurs"] },
        { name: "Pro", desc: "Pour les marchands établis.", features: ["Produits illimités", "Assistant IA", "Analytics avancées", "Domaine personnalisé", "2 boutiques", "10 utilisateurs", "Accès API"] },
        { name: "Enterprise", desc: "Pour les places de marché.", features: ["Boutiques illimitées", "Marketplace multi-vendeurs", "Headless commerce", "Automations & workflows", "Utilisateurs illimités", "Support 24/7", "SLA 99,9 %"] },
      ],
    },
    showcase: {
      dashboard: { badge: "Tableau de bord", title: "Pilotez votre boutique en un coup d'œil", text: "Suivez vos ventes, vos commandes, vos clients et vos produits depuis un tableau de bord clair. Des statistiques en temps réel pour des décisions rapides.", list: ["Revenu encaissé et tendances mensuelles", "Statuts des commandes en temps réel", "Meilleures ventes et tunnel de conversion", "Gestion multi-boutiques"], cta: "Explorer le dashboard" },
      editor: { badge: "Éditeur de thème", title: "Créez une vitrine qui vous ressemble", text: "Un éditeur visuel intuitif avec drag & drop, prévisualisation responsive, undo/redo et publication instantanée.", highlights: ["Éditeur visuel drag & drop", "Prévisualisation desktop, tablette, mobile", "Thèmes premium internationaux", "Personnalisation couleurs & typographies", "Assistant IA pour générer du contenu", "Publication en un clic"], badgeLabel: "Éditeur drag & drop", badgeSub: "Sans code" },
      mobile: { badge: "Commerce mobile", title: "Là où vos clients achètent", text: "Plus de 70 % des achats en ligne se font sur mobile. Chaque thème Sellia est responsive natif — votre boutique est parfaite sur smartphone, avec un checkout fluide et des paiements sans redirection.", trustCheckout: "Checkout sans redirection", trustTracking: "Suivi de commande", createCta: "Créer ma boutique", pricingCta: "Voir les tarifs", securePayments: "Paiement sécurisé via", payBtn: "Payer 45 000 FCFA" },
    },
    testimonials: {
      badge: "Témoignages", title: "Ils vendent avec Sellia", subtitle: "Des milliers de marchands à travers le monde font confiance à Sellia.",
      stats: [ { label: "Marchands actifs" }, { label: "Pays couverts" }, { label: "Ventes traitées" }, { label: "Disponibilité" } ],
      items: [
        { quote: "J'ai lancé ma boutique de mode wax en un après-midi. Les paiements mobile money ont transformé mes ventes — mes clients n'ont plus besoin de cash.", author: "Aïssatou Diop", role: "Fondatrice, Boutique Mode Wax — Dakar" },
        { quote: "Sellia gère le multi-devises nativement. Mes clients au Nigeria et en Côte d'Ivoire paient sans friction, et je suis tout depuis un seul dashboard.", author: "Emeka Okoro", role: "CEO, TechMart — Lagos" },
        { quote: "L'éditeur de thème est intuitif et les thèmes sont sublimes. Mon image de marque a changé de niveau, et l'assistant IA m'a fait gagner des heures.", author: "Sarah Koné", role: "Fondatrice, Abidjan Beauty" },
      ],
    },
    psps: { title: "25+ prestataires de paiement mondiaux", subtitle: "Acceptez les paiements partout dans le monde — sans redirection", regions: { "Afrique": "Afrique", "Europe": "Europe", "Europe/USA": "Europe/USA", "Asie": "Asie", "USA": "USA", "Latino": "Latino" } },
    flags: { title: "Disponible dans le monde entier", subtitle: "Vendez partout — Sellia est une plateforme globale" },
    howItWorks: {
      badge: "Comment ça marche", title: "Trois étapes vers votre boutique", subtitle: "De l'inscription à votre première vente, en moins de temps qu'il n'en faut pour le dire.",
      steps: [
        { title: "Créez votre compte", text: "Inscrivez-vous gratuitement et configurez votre boutique en quelques minutes avec notre assistant d'onboarding." },
        { title: "Personnalisez votre vitrine", text: "Choisissez un thème premium, ajoutez vos produits, vos collections et vos réductions — sans coder." },
        { title: "Vendez en ligne", text: "Encaissez vos premiers paiements, gérez vos commandes et suivez vos performances en temps réel." },
      ],
    },
    brands: {
      title: "Des solutions infinies pour chaque type de marque.",
      subtitle: "Lancez-vous rapidement avec l'essentiel, ou intégrez, créez et passez à l'échelle sur notre plateforme ouverte — choisie par des marques en B2C comme en B2B.",
      desktop: "Desktop", mobile: "Mobile", autoScroll: "Défilement automatique · 12 catégories",
      launchCta: "Lancez votre boutique", footerNote: "Boutiques 100% responsives — desktop & mobile, paramétrables indépendamment.",
      categories: { "Mode & Textile": "Mode & Textile", "Electronique": "Électronique", "Beaute & Cosmetiques": "Beauté & Cosmétiques", "Bijoux & Accessoires": "Bijoux & Accessoires", "Chaussures & Sport": "Chaussures & Sport", "Maison & Deco": "Maison & Déco", "Epicerie & Boissons": "Épicerie & Boissons", "Livres & Culture": "Livres & Culture", "Restaurant & Food": "Restaurant & Food", "Jardinerie & Plantes": "Jardinerie & Plantes", "Sport & Fitness": "Sport & Fitness", "Puericulture & Bebe": "Puériculture & Bébé" },
    },
  },

  en: {
    features: {
      badge: "Features", title: "Everything you need to sell online",
      subtitle: "A complete platform, from store creation to checkout — in one tool.",
      tab: { create: "Create & Customize", sell: "Sell & Collect", manage: "Manage & Ship", grow: "Grow & Analyze" },
      items: {
        create: [
          { title: "Visual drag & drop editor", text: "Build a premium storefront without touching code. Real-time desktop, tablet and mobile preview." },
          { title: "International premium themes", text: "Refined, customizable themes in your brand colors, designed for merchants worldwide." },
          { title: "Smart collections", text: "Manual or automatic collections with dynamic rules on tags, price, stock and status." },
          { title: "Native responsive", text: "Every store adapts perfectly to mobile — where your customers actually buy." },
        ],
        sell: [
          { title: "25+ global PSPs", text: "Paystack, Flutterwave, M-Pesa, Stripe, PayPal, Payunit… Cards, Mobile Money and transfers without redirection." },
          { title: "Multi-currency & markets", text: "Sell everywhere with native ISO currency handling (XOF, NGN, USD, EUR) and 7-language translation." },
          { title: "Checkout without redirection", text: "A 100% integrated funnel — your customers never leave your store. Less abandonment, maximum conversion." },
          { title: "Promotions & discounts", text: "Coupon codes, percentage, fixed-amount or free-shipping discounts with automatic rules." },
        ],
        manage: [
          { title: "Stock & variants", text: "Per-variant tracking, low-stock alerts and multi-location management so you never run out." },
          { title: "Multi-zone shipping", text: "Rates by region, country and weight. Conditional free shipping and automated parcel tracking." },
          { title: "Customer management", text: "Customer profiles, purchase history, multiple addresses and tags for complete, personalized tracking." },
          { title: "Marketplace", text: "Launch a multi-seller marketplace with seller management, commissions and split payments." },
        ],
        grow: [
          { title: "Real-time analytics", text: "Track sales, visitors, per-product conversion and funnel on an actionable dashboard." },
          { title: "AI assistant", text: "Generate product descriptions, SEO content and entire themes with the built-in Sellia AI." },
          { title: "Marketing & automations", text: "Email campaigns, abandoned-cart recovery and event-triggered automations." },
          { title: "Smart alerts", text: "Automatic notifications for low stock, new orders and anomalies — by email or push." },
        ],
      },
      stats: [ { value: "25+", label: "Integrated PSPs" }, { value: "7", label: "Native languages" }, { value: "4.9/5", label: "Merchant satisfaction" }, { value: "99.9%", label: "Uptime" } ],
    },
    pricing: {
      badge: "Pricing", title: "Prices for every merchant",
      subtitle: "14-day free trial on all plans. No credit card required.",
      annual: "Annual: save 20%", popular: "Most popular", perMonth: "/mo", included: "Included", startCta: "Get started",
      allPricesNote: "All prices in USD. Monthly or annual billing.", payWith: "Pay your subscription with",
      mobileTitle: "A premium mobile experience",
      mobileText: "Your customers buy from their phone, anywhere in the world. Smooth checkout, payments without redirection, Mobile Money and card support.",
      ratingText: "4.9/5 — 12,000+ merchants",
      plans: [
        { name: "Starter", desc: "To launch your first store.", features: ["1 store", "50 products", "Basic themes", "Manual payments", "1 user", "sellia.app subdomain"] },
        { name: "Growth", desc: "For growing merchants.", features: ["1,000 products", "All premium themes", "Visual editor", "Integrated payments", "Multi-currency", "Basic analytics", "3 users"] },
        { name: "Pro", desc: "For established merchants.", features: ["Unlimited products", "AI assistant", "Advanced analytics", "Custom domain", "2 stores", "10 users", "API access"] },
        { name: "Enterprise", desc: "For marketplaces.", features: ["Unlimited stores", "Multi-seller marketplace", "Headless commerce", "Automations & workflows", "Unlimited users", "24/7 support", "99.9% SLA"] },
      ],
    },
    showcase: {
      dashboard: { badge: "Dashboard", title: "Run your store at a glance", text: "Track sales, orders, customers and products from a clear dashboard. Real-time stats for fast decisions.", list: ["Collected revenue and monthly trends", "Real-time order statuses", "Best sellers and conversion funnel", "Multi-store management"], cta: "Explore the dashboard" },
      editor: { badge: "Theme editor", title: "Build a storefront that looks like you", text: "An intuitive visual editor with drag & drop, responsive preview, undo/redo and instant publishing.", highlights: ["Visual drag & drop editor", "Desktop, tablet, mobile preview", "International premium themes", "Color & typography customization", "AI assistant to generate content", "One-click publishing"], badgeLabel: "Drag & drop editor", badgeSub: "No code" },
      mobile: { badge: "Mobile commerce", title: "Where your customers buy", text: "Over 70% of online purchases happen on mobile. Every Sellia theme is natively responsive — your store is perfect on smartphone, with smooth checkout and payments without redirection.", trustCheckout: "Checkout without redirection", trustTracking: "Order tracking", createCta: "Create my store", pricingCta: "See pricing", securePayments: "Secure payment via", payBtn: "Pay 45,000 FCFA" },
    },
    testimonials: {
      badge: "Testimonials", title: "They sell with Sellia", subtitle: "Thousands of merchants worldwide trust Sellia.",
      stats: [ { label: "Active merchants" }, { label: "Countries covered" }, { label: "Sales processed" }, { label: "Uptime" } ],
      items: [
        { quote: "I launched my wax fashion store in an afternoon. Mobile money payments transformed my sales — my customers no longer need cash.", author: "Aïssatou Diop", role: "Founder, Boutique Mode Wax — Dakar" },
        { quote: "Sellia handles multi-currency natively. My customers in Nigeria and Côte d'Ivoire pay without friction, and I manage everything from one dashboard.", author: "Emeka Okoro", role: "CEO, TechMart — Lagos" },
        { quote: "The theme editor is intuitive and the themes are gorgeous. My brand image leveled up, and the AI assistant saved me hours.", author: "Sarah Koné", role: "Founder, Abidjan Beauty" },
      ],
    },
    psps: { title: "25+ global payment providers", subtitle: "Accept payments anywhere in the world — without redirection", regions: { "Afrique": "Africa", "Europe": "Europe", "Europe/USA": "Europe/USA", "Asie": "Asia", "USA": "USA", "Latino": "Latam" } },
    flags: { title: "Available worldwide", subtitle: "Sell anywhere — Sellia is a global platform" },
    howItWorks: {
      badge: "How it works", title: "Three steps to your store", subtitle: "From sign-up to your first sale, faster than saying it.",
      steps: [
        { title: "Create your account", text: "Sign up free and set up your store in minutes with our onboarding assistant." },
        { title: "Customize your storefront", text: "Pick a premium theme, add your products, collections and discounts — no coding." },
        { title: "Sell online", text: "Collect your first payments, manage orders and track performance in real time." },
      ],
    },
    brands: {
      title: "Endless solutions for every type of brand.",
      subtitle: "Start fast with the essentials, or integrate, build and scale on our open platform — chosen by B2C and B2B brands alike.",
      desktop: "Desktop", mobile: "Mobile", autoScroll: "Auto-scroll · 12 categories",
      launchCta: "Launch your store", footerNote: "100% responsive stores — desktop & mobile, independently configurable.",
      categories: { "Mode & Textile": "Fashion & Textile", "Electronique": "Electronics", "Beaute & Cosmetiques": "Beauty & Cosmetics", "Bijoux & Accessoires": "Jewelry & Accessories", "Chaussures & Sport": "Shoes & Sport", "Maison & Deco": "Home & Decor", "Epicerie & Boissons": "Grocery & Drinks", "Livres & Culture": "Books & Culture", "Restaurant & Food": "Restaurant & Food", "Jardinerie & Plantes": "Garden & Plants", "Sport & Fitness": "Sport & Fitness", "Puericulture & Bebe": "Baby & Childcare" },
    },
  },

  es: {
    features: {
      badge: "Funciones", title: "Todo lo que necesitas para vender online",
      subtitle: "Una plataforma completa, de la creación de la tienda al cobro — en una sola herramienta.",
      tab: { create: "Crear y Personalizar", sell: "Vender y Cobrar", manage: "Gestionar y Enviar", grow: "Crecer y Analizar" },
      items: {
        create: [
          { title: "Editor visual drag & drop", text: "Crea una vitrina premium sin tocar código. Previsualización escritorio, tablet y móvil en tiempo real." },
          { title: "Temas premium internacionales", text: "Temas refinados y personalizables con los colores de tu marca, pensados para comerciantes de todo el mundo." },
          { title: "Colecciones inteligentes", text: "Colecciones manuales o automáticas con reglas dinámicas por etiquetas, precio, stock y estado." },
          { title: "Responsive nativo", text: "Cada tienda se adapta perfectamente al móvil — donde tus clientes compran realmente." },
        ],
        sell: [
          { title: "25+ PSP globales", text: "Paystack, Flutterwave, M-Pesa, Stripe, PayPal, Payunit… Tarjetas, Mobile Money y transferencias sin redirección." },
          { title: "Multidivisa y mercados", text: "Vende en todas partes con gestión nativa de divisas ISO (XOF, NGN, USD, EUR) y traducción a 7 idiomas." },
          { title: "Checkout sin redirección", text: "Embudo 100% integrado — tus clientes nunca abandonan tu tienda. Menos abandono, máxima conversión." },
          { title: "Promociones y descuentos", text: "Códigos promocionales, descuentos en porcentaje, monto fijo o envío gratis con reglas automáticas." },
        ],
        manage: [
          { title: "Stock y variantes", text: "Seguimiento por variante, alertas de stock bajo y gestión multi-ubicación para no quedarte sin stock." },
          { title: "Envío multi-zona", text: "Tarifas por región, país y peso. Envío gratis condicional y seguimiento automatizado de paquetes." },
          { title: "Gestión de clientes", text: "Perfiles de cliente, historial de compras, múltiples direcciones y etiquetas para un seguimiento completo." },
          { title: "Marketplace", text: "Lanza un marketplace multi-vendedor con gestión de vendedores, comisiones y pagos repartidos." },
        ],
        grow: [
          { title: "Analítica en tiempo real", text: "Sigue ventas, visitantes, conversión por producto y embudo en un panel accionable." },
          { title: "Asistente IA", text: "Genera descripciones de producto, contenido SEO y temas completos con la IA integrada de Sellia." },
          { title: "Marketing y automatizaciones", text: "Campañas de email, recuperación de carritos abandonados y automatizaciones por eventos." },
          { title: "Alertas inteligentes", text: "Notificaciones automáticas de stock bajo, nuevos pedidos y anomalías — por email o push." },
        ],
      },
      stats: [ { value: "25+", label: "PSP integrados" }, { value: "7", label: "Idiomas nativos" }, { value: "4,9/5", label: "Satisfacción" }, { value: "99,9%", label: "Disponibilidad" } ],
    },
    pricing: {
      badge: "Precios", title: "Precios para todo comerciante",
      subtitle: "14 días de prueba gratis en todos los planes. Sin tarjeta de crédito.",
      annual: "Anual: ahorra 20%", popular: "Más popular", perMonth: "/mes", included: "Incluido", startCta: "Empezar",
      allPricesNote: "Todos los precios en USD. Facturación mensual o anual.", payWith: "Paga tu suscripción con",
      mobileTitle: "Una experiencia móvil premium",
      mobileText: "Tus clientes compran desde el móvil, en cualquier lugar. Checkout fluido, pagos sin redirección, soporte Mobile Money y tarjetas.",
      ratingText: "4,9/5 — 12.000+ comerciantes",
      plans: [
        { name: "Starter", desc: "Para lanzar tu primera tienda.", features: ["1 tienda", "50 productos", "Temas básicos", "Pagos manuales", "1 usuario", "Subdominio sellia.app"] },
        { name: "Growth", desc: "Para comerciantes en crecimiento.", features: ["1.000 productos", "Todos los temas premium", "Editor visual", "Pagos integrados", "Multidivisa", "Analítica básica", "3 usuarios"] },
        { name: "Pro", desc: "Para comerciantes establecidos.", features: ["Productos ilimitados", "Asistente IA", "Analítica avanzada", "Dominio personalizado", "2 tiendas", "10 usuarios", "Acceso API"] },
        { name: "Enterprise", desc: "Para marketplaces.", features: ["Tiendas ilimitadas", "Marketplace multi-vendedor", "Headless commerce", "Automatizaciones y workflows", "Usuarios ilimitados", "Soporte 24/7", "SLA 99,9 %"] },
      ],
    },
    showcase: {
      dashboard: { badge: "Panel", title: "Gestiona tu tienda de un vistazo", text: "Sigue ventas, pedidos, clientes y productos desde un panel claro. Estadísticas en tiempo real para decisiones rápidas.", list: ["Ingresos cobrados y tendencias mensuales", "Estados de pedido en tiempo real", "Más vendidos y embudo de conversión", "Gestión multi-tienda"], cta: "Explorar el panel" },
      editor: { badge: "Editor de temas", title: "Crea una vitrina que se parezca a ti", text: "Un editor visual intuitivo con drag & drop, previsualización responsive, deshacer/rehacer y publicación instantánea.", highlights: ["Editor visual drag & drop", "Previsualización escritorio, tablet, móvil", "Temas premium internacionales", "Personalización de colores y tipografías", "Asistente IA para generar contenido", "Publicación en un clic"], badgeLabel: "Editor drag & drop", badgeSub: "Sin código" },
      mobile: { badge: "Comercio móvil", title: "Donde tus clientes compran", text: "Más del 70 % de las compras online se hacen en móvil. Cada tema Sellia es responsive nativo — tu tienda luce perfecta en el smartphone, con checkout fluido y pagos sin redirección.", trustCheckout: "Checkout sin redirección", trustTracking: "Seguimiento de pedido", createCta: "Crear mi tienda", pricingCta: "Ver precios", securePayments: "Pago seguro vía", payBtn: "Pagar 45.000 FCFA" },
    },
    testimonials: {
      badge: "Testimonios", title: "Venden con Sellia", subtitle: "Miles de comerciantes en todo el mundo confían en Sellia.",
      stats: [ { label: "Comerciantes activos" }, { label: "Países cubiertos" }, { label: "Ventas procesadas" }, { label: "Disponibilidad" } ],
      items: [
        { quote: "Lancé mi tienda de moda wax en una tarde. Los pagos con mobile money transformaron mis ventas — mis clientes ya no necesitan efectivo.", author: "Aïssatou Diop", role: "Fundadora, Boutique Mode Wax — Dakar" },
        { quote: "Sellia gestiona la multidivisa de forma nativa. Mis clientes en Nigeria y Costa de Marfil pagan sin fricción y lo gestiono todo desde un panel.", author: "Emeka Okoro", role: "CEO, TechMart — Lagos" },
        { quote: "El editor de temas es intuitivo y los temas son preciosos. Mi imagen de marca subió de nivel y el asistente IA me ahorró horas.", author: "Sarah Koné", role: "Fundadora, Abidjan Beauty" },
      ],
    },
    psps: { title: "25+ proveedores de pago globales", subtitle: "Acepta pagos en cualquier lugar del mundo — sin redirección", regions: { "Afrique": "África", "Europe": "Europa", "Europe/USA": "Europa/USA", "Asie": "Asia", "USA": "USA", "Latino": "Latam" } },
    flags: { title: "Disponible en todo el mundo", subtitle: "Vende en cualquier lugar — Sellia es una plataforma global" },
    howItWorks: {
      badge: "Cómo funciona", title: "Tres pasos hacia tu tienda", subtitle: "Del registro a tu primera venta, más rápido de lo que tardas en decirlo.",
      steps: [
        { title: "Crea tu cuenta", text: "Regístrate gratis y configura tu tienda en minutos con nuestro asistente de onboarding." },
        { title: "Personaliza tu vitrina", text: "Elige un tema premium, añade productos, colecciones y descuentos — sin programar." },
        { title: "Vende online", text: "Cobra tus primeros pagos, gestiona pedidos y sigue tu rendimiento en tiempo real." },
      ],
    },
    brands: {
      title: "Soluciones infinitas para cada tipo de marca.",
      subtitle: "Empieza rápido con lo esencial, o integra, crea y escala en nuestra plataforma abierta — elegida por marcas B2C y B2B.",
      desktop: "Escritorio", mobile: "Móvil", autoScroll: "Desplazamiento auto · 12 categorías",
      launchCta: "Lanza tu tienda", footerNote: "Tiendas 100% responsive — escritorio y móvil, configurables de forma independiente.",
      categories: { "Mode & Textile": "Moda y Textil", "Electronique": "Electrónica", "Beaute & Cosmetiques": "Belleza y Cosmética", "Bijoux & Accessoires": "Joyería y Accesorios", "Chaussures & Sport": "Calzado y Deporte", "Maison & Deco": "Hogar y Decoración", "Epicerie & Boissons": "Alimentación y Bebidas", "Livres & Culture": "Libros y Cultura", "Restaurant & Food": "Restaurante y Food", "Jardinerie & Plantes": "Jardinería y Plantas", "Sport & Fitness": "Deporte y Fitness", "Puericulture & Bebe": "Puericultura y Bebé" },
    },
  },

  pt: {
    features: {
      badge: "Recursos", title: "Tudo o que precisa para vender online",
      subtitle: "Uma plataforma completa, da criação da loja ao recebimento — numa só ferramenta.",
      tab: { create: "Criar e Personalizar", sell: "Vender e Receber", manage: "Gerenciar e Enviar", grow: "Crescer e Analisar" },
      items: {
        create: [
          { title: "Editor visual drag & drop", text: "Crie uma vitrine premium sem tocar em código. Pré-visualização desktop, tablet e celular em tempo real." },
          { title: "Temas premium internacionais", text: "Temas refinados e personalizáveis nas cores da sua marca, pensados para comerciantes do mundo todo." },
          { title: "Coleções inteligentes", text: "Coleções manuais ou automáticas com regras dinâmicas por tags, preço, estoque e status." },
          { title: "Responsivo nativo", text: "Cada loja se adapta perfeitamente ao celular — onde seus clientes realmente compram." },
        ],
        sell: [
          { title: "25+ PSP globais", text: "Paystack, Flutterwave, M-Pesa, Stripe, PayPal, Payunit… Cartões, Mobile Money e transferências sem redirecionamento." },
          { title: "Multimoeda e mercados", text: "Venda em todo lugar com gestão nativa de moedas ISO (XOF, NGN, USD, EUR) e tradução em 7 idiomas." },
          { title: "Checkout sem redirecionamento", text: "Funil 100% integrado — seus clientes nunca saem da sua loja. Menos abandono, conversão máxima." },
          { title: "Promoções e descontos", text: "Códigos promocionais, descontos em porcentagem, valor fixo ou frete grátis com regras automáticas." },
        ],
        manage: [
          { title: "Estoque e variantes", text: "Rastreamento por variante, alertas de estoque baixo e gestão multi-local para nunca ficar sem estoque." },
          { title: "Envio multi-zona", text: "Tarifas por região, país e peso. Frete grátis condicional e rastreamento automatizado de encomendas." },
          { title: "Gestão de clientes", text: "Perfis de cliente, histórico de compras, múltiplos endereços e tags para um acompanhamento completo." },
          { title: "Marketplace", text: "Lance um marketplace multi-vendedor com gestão de vendedores, comissões e pagamentos divididos." },
        ],
        grow: [
          { title: "Analytics em tempo real", text: "Acompanhe vendas, visitantes, conversão por produto e funil em um painel acionável." },
          { title: "Assistente IA", text: "Gere descrições de produto, conteúdo SEO e temas completos com a IA integrada da Sellia." },
          { title: "Marketing e automações", text: "Campanhas de e-mail, recuperação de carrinhos abandonados e automações por eventos." },
          { title: "Alertas inteligentes", text: "Notificações automáticas de estoque baixo, novos pedidos e anomalias — por e-mail ou push." },
        ],
      },
      stats: [ { value: "25+", label: "PSP integrados" }, { value: "7", label: "Idiomas nativos" }, { value: "4,9/5", label: "Satisfação" }, { value: "99,9%", label: "Disponibilidade" } ],
    },
    pricing: {
      badge: "Preços", title: "Preços para todo comerciante",
      subtitle: "14 dias de teste grátis em todos os planos. Sem cartão de crédito.",
      annual: "Anual: economize 20%", popular: "Mais popular", perMonth: "/mês", included: "Incluído", startCta: "Começar",
      allPricesNote: "Todos os preços em USD. Cobrança mensal ou anual.", payWith: "Pague sua assinatura com",
      mobileTitle: "Uma experiência celular premium",
      mobileText: "Seus clientes compram pelo celular, em qualquer lugar. Checkout fluido, pagamentos sem redirecionamento, suporte Mobile Money e cartões.",
      ratingText: "4,9/5 — 12.000+ comerciantes",
      plans: [
        { name: "Starter", desc: "Para lançar sua primeira loja.", features: ["1 loja", "50 produtos", "Temas básicos", "Pagamentos manuais", "1 usuário", "Subdomínio sellia.app"] },
        { name: "Growth", desc: "Para comerciantes em crescimento.", features: ["1.000 produtos", "Todos os temas premium", "Editor visual", "Pagamentos integrados", "Multimoeda", "Analytics básico", "3 usuários"] },
        { name: "Pro", desc: "Para comerciantes estabelecidos.", features: ["Produtos ilimitados", "Assistente IA", "Analytics avançado", "Domínio personalizado", "2 lojas", "10 usuários", "Acesso à API"] },
        { name: "Enterprise", desc: "Para marketplaces.", features: ["Lojas ilimitadas", "Marketplace multi-vendedor", "Headless commerce", "Automações e workflows", "Usuários ilimitados", "Suporte 24/7", "SLA 99,9 %"] },
      ],
    },
    showcase: {
      dashboard: { badge: "Painel", title: "Gerencie sua loja num relance", text: "Acompanhe vendas, pedidos, clientes e produtos de um painel claro. Estatísticas em tempo real para decisões rápidas.", list: ["Receita recebida e tendências mensais", "Status dos pedidos em tempo real", "Mais vendidos e funil de conversão", "Gestão multi-loja"], cta: "Explorar o painel" },
      editor: { badge: "Editor de temas", title: "Crie uma vitrine que se parece com você", text: "Um editor visual intuitivo com drag & drop, pré-visualização responsiva, desfazer/refazer e publicação instantânea.", highlights: ["Editor visual drag & drop", "Pré-visualização desktop, tablet, celular", "Temas premium internacionais", "Personalização de cores e tipografias", "Assistente IA para gerar conteúdo", "Publicação em um clique"], badgeLabel: "Editor drag & drop", badgeSub: "Sem código" },
      mobile: { badge: "Comércio celular", title: "Onde seus clientes compram", text: "Mais de 70 % das compras online acontecem no celular. Cada tema Sellia é responsivo nativo — sua loja fica perfeita no smartphone, com checkout fluido e pagamentos sem redirecionamento.", trustCheckout: "Checkout sem redirecionamento", trustTracking: "Rastreamento de pedido", createCta: "Criar minha loja", pricingCta: "Ver preços", securePayments: "Pagamento seguro via", payBtn: "Pagar 45.000 FCFA" },
    },
    testimonials: {
      badge: "Depoimentos", title: "Eles vendem com a Sellia", subtitle: "Milhares de comerciantes no mundo todo confiam na Sellia.",
      stats: [ { label: "Comerciantes ativos" }, { label: "Países cobertos" }, { label: "Vendas processadas" }, { label: "Disponibilidade" } ],
      items: [
        { quote: "Lancei minha loja de moda wax em uma tarde. Os pagamentos por mobile money transformaram minhas vendas — meus clientes não precisam mais de dinheiro vivo.", author: "Aïssatou Diop", role: "Fundadora, Boutique Mode Wax — Dakar" },
        { quote: "A Sellia gerencia multimoeda nativamente. Meus clientes na Nigéria e na Costa do Marfim pagam sem atrito e eu gerencio tudo de um painel só.", author: "Emeka Okoro", role: "CEO, TechMart — Lagos" },
        { quote: "O editor de temas é intuitivo e os temas são lindos. Minha imagem de marca subiu de nível e o assistente IA me poupou horas.", author: "Sarah Koné", role: "Fundadora, Abidjan Beauty" },
      ],
    },
    psps: { title: "25+ provedores de pagamento globais", subtitle: "Aceite pagamentos em qualquer lugar do mundo — sem redirecionamento", regions: { "Afrique": "África", "Europe": "Europa", "Europe/USA": "Europa/USA", "Asie": "Ásia", "USA": "USA", "Latino": "Latam" } },
    flags: { title: "Disponível no mundo todo", subtitle: "Venda em qualquer lugar — a Sellia é uma plataforma global" },
    howItWorks: {
      badge: "Como funciona", title: "Três passos para a sua loja", subtitle: "Do cadastro à primeira venda, mais rápido do que se diz.",
      steps: [
        { title: "Crie sua conta", text: "Cadastre-se grátis e configure sua loja em minutos com nosso assistente de onboarding." },
        { title: "Personalize sua vitrine", text: "Escolha um tema premium, adicione produtos, coleções e descontos — sem programar." },
        { title: "Venda online", text: "Receba seus primeiros pagamentos, gerencie pedidos e acompanhe o desempenho em tempo real." },
      ],
    },
    brands: {
      title: "Soluções infinitas para cada tipo de marca.",
      subtitle: "Comece rápido com o essencial, ou integre, crie e escale em nossa plataforma aberta — escolhida por marcas B2C e B2B.",
      desktop: "Desktop", mobile: "Celular", autoScroll: "Rolagem automática · 12 categorias",
      launchCta: "Lance sua loja", footerNote: "Lojas 100% responsivas — desktop e celular, configuráveis de forma independente.",
      categories: { "Mode & Textile": "Moda e Têxtil", "Electronique": "Eletrônicos", "Beaute & Cosmetiques": "Beleza e Cosméticos", "Bijoux & Accessoires": "Joias e Acessórios", "Chaussures & Sport": "Calçados e Esporte", "Maison & Deco": "Casa e Decoração", "Epicerie & Boissons": "Mercearia e Bebidas", "Livres & Culture": "Livros e Cultura", "Restaurant & Food": "Restaurante e Food", "Jardinerie & Plantes": "Jardinagem e Plantas", "Sport & Fitness": "Esporte e Fitness", "Puericulture & Bebe": "Puericultura e Bebê" },
    },
  },

  ar: {
    features: {
      badge: "المزايا", title: "كل ما تحتاجه للبيع عبر الإنترنت",
      subtitle: "منصة متكاملة، من إنشاء المتجر إلى التحصيل — في أداة واحدة.",
      tab: { create: "إنشاء وتخصيص", sell: "بيع وتحصيل", manage: "إدارة وشحن", grow: "نمو وتحليل" },
      items: {
        create: [
          { title: "محرر مرئي بالسحب والإفلات", text: "أنشئ واجهة احترافية دون لمس الكود. معاينة فورية للحواسيب والأجهزة اللوحية والجوال." },
          { title: "قوالب احترافية عالمية", text: "قوالب أنيقة وقابلة للتخصيص بألوان علامتك، مصممة لتجار العالم." },
          { title: "مجموعات ذكية", text: "مجموعات يدوية أو تلقائية بقواعد ديناميكية على الوسوم والسعر والمخزون والحالة." },
          { title: "تجاوب أصلي", text: "كل متجر يتكيّف تمامًا مع الجوال — حيث يشتري عملاؤك فعليًا." },
        ],
        sell: [
          { title: "+25 معالجًا عالميًا", text: "Paystack وFlutterwave وM-Pesa وStripe وPayPal وPayunit… بطاقات وموبايل موني وتحويلات دون إعادة توجيه." },
          { title: "عملات وأسواق متعددة", text: "بِع في كل مكان مع إدارة أصلية لعملات ISO (XOF, NGN, USD, EUR) وترجمة إلى 7 لغات." },
          { title: "دفع دون إعادة توجيه", text: "مسار 100% مدمج — عملاؤك لا يغادرون متجرك أبدًا. هجر أقل، تحويل أعلى." },
          { title: "عروض وخصومات", text: "أكواد ترويجية وخصومات بالنسبة أو مبلغ ثابت أو شحن مجاني بقواعد تلقائية." },
        ],
        manage: [
          { title: "مخزون وخيارات", text: "تتبّع لكل خيار، تنبيهات نقص المخزون وإدارة متعددة المواقع لعدم نفاد المنتجات." },
          { title: "شحن متعدد المناطق", text: "أسعار حسب المنطقة والبلد والوزن. شحن مجاني مشروط وتتبّع آلي للطرود." },
          { title: "إدارة العملاء", text: "ملفات العملاء، سجل المشتريات، عناوين متعددة ووسوم لمتابعة كاملة ومخصصة." },
          { title: "سوق متعدد", text: "أطلق سوقًا متعدد البائعين بإدارة البائعين والعمولات وتوزيع المدفومات." },
        ],
        grow: [
          { title: "تحليلات فورية", text: "تابع المبيعات والزوار والتحويل لكل منتج والمسار في لوحة قابلة للتنفيذ." },
          { title: "مساعد ذكاء اصطناعي", text: "أنشئ أوصاف المنتجات ومحتوى SEO وقوالب كاملة بذكاء Sellia المدمج." },
          { title: "تسويق وأتمتة", text: "حملات بريدية واستعادة السلات المتروكة وأتمتة مُطلقة بالأحداث." },
          { title: "تنبيهات ذكية", text: "إشعارات تلقائية لنقص المخزون والطلبات الجديدة والشذوذ — بالبريد أو الدفع." },
        ],
      },
      stats: [ { value: "+25", label: "معالج مدفومات" }, { value: "7", label: "لغات أصلية" }, { value: "4.9/5", label: "رضا التجار" }, { value: "99.9%", label: "التوفر" } ],
    },
    pricing: {
      badge: "الأسعار", title: "أسعار لكل تاجر",
      subtitle: "تجربة مجانية 14 يومًا في كل الباقات. بدون بطاقة ائتمان.",
      annual: "سنوي: وفّر 20%", popular: "الأكثر شعبية", perMonth: "/شهر", included: "مشمول", startCta: "ابدأ",
      allPricesNote: "جميع الأسعار بالدولار. فوترة شهرية أو سنوية.", payWith: "ادفع اشتراكك عبر",
      mobileTitle: "تجربة جوال احترافية",
      mobileText: "عملاؤك يشترون من هواتفهم في أي مكان. دفع سلس، مدفومات دون إعادة توجيه، دعم موبايل موني والبطاقات.",
      ratingText: "4.9/5 — +12,000 تاجر",
      plans: [
        { name: "Starter", desc: "لإطلاق أول متجر لك.", features: ["متجر واحد", "50 منتجًا", "قوالب أساسية", "مدفومات يدوية", "مستخدم واحد", "نطاق فرعي sellia.app"] },
        { name: "Growth", desc: "للتجار في نمو.", features: ["1,000 منتج", "كل القوالب الاحترافية", "محرر مرئي", "مدفومات مدمجة", "عملات متعددة", "تحليلات أساسية", "3 مستخدمين"] },
        { name: "Pro", desc: "للتجار الراسخين.", features: ["منتجات غير محدودة", "مساعد ذكاء", "تحليلات متقدمة", "نطاق مخصص", "متجران", "10 مستخدمين", "وصول API"] },
        { name: "Enterprise", desc: "للأسواق.", features: ["متاجر غير محدودة", "سوق متعدد البائعين", "تجارة headless", "أتمتة وسير عمل", "مستخدمون غير محدودين", "دعم 24/7", "اتفاقية 99.9%"] },
      ],
    },
    showcase: {
      dashboard: { badge: "لوحة التحكم", title: "أدر متجرك بنظرة", text: "تابع المبيعات والطلبات والعملاء والمنتجات من لوحة واضحة. إحصاءات فورية لقرارات سريعة.", list: ["الإيرادات المحصّلة والاتجاهات الشهرية", "حالات الطلب فورية", "الأكثر مبيعًا ومسار التحويل", "إدارة متعددة المتاجر"], cta: "استكشف اللوحة" },
      editor: { badge: "محرر القوالب", title: "أنشئ واجهة تشبهك", text: "محرر مرئي بديهي بالسحب والإفلات، معاينة متجاوبة، تراجع/إعادة ونشر فوري.", highlights: ["محرر مرئي بالسحب والإفلات", "معاينة حاسوب/لوحي/جوال", "قوالب احترافية عالمية", "تخصيص الألوان والخطوط", "مساعد ذكاء لتوليد المحتوى", "نشر بنقرة واحدة"], badgeLabel: "محرر بالسحب والإفلات", badgeSub: "بدون كود" },
      mobile: { badge: "تجارة الجوال", title: "حيث يشتري عملاؤك", text: "أكثر من 70% من المشتريات تتم على الجوال. كل قالب Sellia متجاوب أصلي — متجرك مثالي على الهاتف مع دفع سلس ومدفومات دون إعادة توجيه.", trustCheckout: "دفع دون إعادة توجيه", trustTracking: "تتبّع الطلب", createCta: "أنشئ متجري", pricingCta: "عرض الأسعار", securePayments: "دفع آمن عبر", payBtn: "ادفع 45,000 فرنك" },
    },
    testimonials: {
      badge: "آراء", title: "يبيعون مع Sellia", subtitle: "آلاف التجار حول العالم يثقون بـ Sellia.",
      stats: [ { label: "تجار نشطون" }, { label: "دول مغطاة" }, { label: "مبيعات معالجة" }, { label: "التوفر" } ],
      items: [
        { quote: "أطلقت متجر أزياء الووكس في بعد ظهيرة. مدفوعات الموبايل موني غيّرت مبيعاتي — لم يعد عملائي بحاجة للنقد.", author: "Aïssatou Diop", role: "مؤسِّسة، Boutique Mode Wax — داكار" },
        { quote: "تدير Sellia العملات المتعددة أصليًا. عملائي في نيجيريا وساحل العاج يدفعون بسلاسة وأدير كل شيء من لوحة واحدة.", author: "Emeka Okoro", role: "الرئيس التنفيذي، TechMart — لاغوس" },
        { quote: "محرر القوالب بديهي والقوالب رائعة. ارتقت صورة علامتي، ووفّر عليّ المساعد الذكي ساعات.", author: "Sarah Koné", role: "مؤسِّسة، Abidjan Beauty" },
      ],
    },
    psps: { title: "+25 معالجًا عالميًا للمدفومات", subtitle: "اقبل المدفومات في أي مكان بالعالم — دون إعادة توجيه", regions: { "Afrique": "إفريقيا", "Europe": "أوروبا", "Europe/USA": "أوروبا/USA", "Asie": "آسيا", "USA": "USA", "Latino": "أمريكا اللاتينية" } },
    flags: { title: "متاح في العالم أجمع", subtitle: "بِع في أي مكان — Sellia منصة عالمية" },
    howItWorks: {
      badge: "كيف يعمل", title: "ثلاث خطوات نحو متجرك", subtitle: "من التسجيل إلى أول بيع، أسرع من أن تقوله.",
      steps: [
        { title: "أنشئ حسابك", text: "سجّل مجانًا وأعد متجرك في دقائق بمساعد الإعداد." },
        { title: "خصّص واجهتك", text: "اختر قالبًا احترافيًا، أضف منتجاتك ومجموعاتك وخصوماتك — دون برمجة." },
        { title: "بِع عبر الإنترنت", text: "تحصّل أول المدفومات، أدر طلباتك وتابع أداءك فوريًا." },
      ],
    },
    brands: {
      title: "حلول لا نهائية لكل نوع علامة.",
      subtitle: "انطلق بسرعة بالأساسيات، أو ادمج وأنشئ وتوسّع على منصتنا المفتوحة — اختيار العلامات B2C وB2B.",
      desktop: "حاسوب", mobile: "جوال", autoScroll: "تمرير تلقائي · 12 فئة",
      launchCta: "أطلق متجرك", footerNote: "متاجر متجاوبة 100% — حاسوب وجوال، قابلة للضبط بشكل مستقل.",
      categories: { "Mode & Textile": "أزياء ونسيج", "Electronique": "إلكترونيات", "Beaute & Cosmetiques": "جمال ومستحضرات", "Bijoux & Accessoires": "مجوهرات وإكسسوارات", "Chaussures & Sport": "أحذية ورياضة", "Maison & Deco": "منزل وديكور", "Epicerie & Boissons": "بقالة ومشروبات", "Livres & Culture": "كتب وثقافة", "Restaurant & Food": "مطعم وطعام", "Jardinerie & Plantes": "حدائق ونباتات", "Sport & Fitness": "رياضة ولياقة", "Puericulture & Bebe": "رعاية طفل" },
    },
  },

  zh: {
    features: {
      badge: "功能", title: "在线销售所需的一切",
      subtitle: "从建店到收款的一体化平台——一个工具搞定。",
      tab: { create: "创建与定制", sell: "销售与收款", manage: "管理与发货", grow: "增长与分析" },
      items: {
        create: [
          { title: "可视化拖放编辑器", text: "无需写代码即可构建高端店铺。实时桌面、平板与移动端预览。" },
          { title: "国际化高级主题", text: "精致可定制的主题，采用您的品牌配色，专为全球商家设计。" },
          { title: "智能商品集", text: "手动或自动商品集，支持按标签、价格、库存与状态的动态规则。" },
          { title: "原生响应式", text: "每个店铺都能完美适配移动端——您的客户真正购物之处。" },
        ],
        sell: [
          { title: "25+ 全球支付商", text: "Paystack、Flutterwave、M-Pesa、Stripe、PayPal、Payunit……银行卡、移动支付与转账，无需跳转。" },
          { title: "多币种与多市场", text: "原生 ISO 币种管理（XOF、NGN、USD、EUR）与 7 种语言翻译，卖向全球。" },
          { title: "无跳转结账", text: "100% 内嵌结账流程——客户无需离开您的店铺。更低弃单，更高转化。" },
          { title: "促销与折扣", text: "优惠券、百分比、固定金额或免运费折扣，支持自动规则。" },
        ],
        manage: [
          { title: "库存与变体", text: "按变体跟踪、低库存提醒与多仓位管理，永不缺货。" },
          { title: "多区域配送", text: "按地区、国家与重量定价。条件免运费与自动包裹跟踪。" },
          { title: "客户管理", text: "客户档案、购买历史、多地址与标签，实现完整个性化跟踪。" },
          { title: "集市", text: "启动多卖家集市，管理卖家、佣金与分账支付。" },
        ],
        grow: [
          { title: "实时分析", text: "在可操作的仪表盘上跟踪销售、访客、单品转化与漏斗。" },
          { title: "AI 助手", text: "用内置 Sellia AI 生成商品描述、SEO 内容与完整主题。" },
          { title: "营销与自动化", text: "邮件营销、弃购挽回与事件触发的自动化。" },
          { title: "智能提醒", text: "低库存、新订单与异常的自动通知——邮件或推送。" },
        ],
      },
      stats: [ { value: "25+", label: "集成支付商" }, { value: "7", label: "原生语言" }, { value: "4.9/5", label: "商家满意度" }, { value: "99.9%", label: "可用性" } ],
    },
    pricing: {
      badge: "价格", title: "适合每位商家的价格",
      subtitle: "所有方案享 14 天免费试用。无需信用卡。",
      annual: "年付：节省 20%", popular: "最受欢迎", perMonth: "/月", included: "包含", startCta: "开始",
      allPricesNote: "所有价格以美元计。月付或年付。", payWith: "使用以下方式支付订阅",
      mobileTitle: "高端移动体验",
      mobileText: "您的客户随时随地用手机购物。流畅结账、无跳转支付，支持移动支付与银行卡。",
      ratingText: "4.9/5 — 12,000+ 商家",
      plans: [
        { name: "Starter", desc: "用于开设您的第一家店。", features: ["1 家店铺", "50 个商品", "基础主题", "手动收款", "1 个用户", "sellia.app 子域名"] },
        { name: "Growth", desc: "面向成长中的商家。", features: ["1,000 个商品", "所有高级主题", "可视化编辑器", "集成支付", "多币种", "基础分析", "3 个用户"] },
        { name: "Pro", desc: "面向成熟商家。", features: ["无限商品", "AI 助手", "高级分析", "自定义域名", "2 家店铺", "10 个用户", "API 访问"] },
        { name: "Enterprise", desc: "面向集市。", features: ["无限店铺", "多卖家集市", "Headless 商务", "自动化与工作流", "无限用户", "24/7 支持", "99.9% SLA"] },
      ],
    },
    showcase: {
      dashboard: { badge: "仪表盘", title: "一目了然管理您的店铺", text: "在清晰的仪表盘上跟踪销售、订单、客户与商品。实时统计助力快速决策。", list: ["已收收入与月度趋势", "实时订单状态", "热销品与转化漏斗", "多店管理"], cta: "探索仪表盘" },
      editor: { badge: "主题编辑器", title: "打造像您的店铺", text: "直观的可视化拖放编辑器，响应式预览、撤销/重做与即时发布。", highlights: ["可视化拖放编辑器", "桌面、平板、移动端预览", "国际化高级主题", "颜色与字体定制", "AI 助手生成内容", "一键发布"], badgeLabel: "拖放编辑器", badgeSub: "无需代码" },
      mobile: { badge: "移动商务", title: "您的客户购物之处", text: "超过 70% 的线上购物在移动端完成。每个 Sellia 主题都原生响应式——您的店铺在手机上完美呈现，结账流畅、支付无跳转。", trustCheckout: "无跳转结账", trustTracking: "订单跟踪", createCta: "创建我的店铺", pricingCta: "查看价格", securePayments: "安全支付通过", payBtn: "支付 45,000 FCFA" },
    },
    testimonials: {
      badge: "用户评价", title: "他们用 Sellia 销售", subtitle: "全球成千上万的商家信赖 Sellia。",
      stats: [ { label: "活跃商家" }, { label: "覆盖国家" }, { label: "处理销售额" }, { label: "可用性" } ],
      items: [
        { quote: "我用一个下午就上线了蜡染时装店。移动支付彻底改变了我的销售——我的客户不再需要现金。", author: "Aïssatou Diop", role: "创始人，Boutique Mode Wax — 达喀尔" },
        { quote: "Sellia 原生支持多币种。我在尼日利亚和科特迪瓦的客户无摩擦支付，我只用一个仪表盘管理一切。", author: "Emeka Okoro", role: "CEO，TechMart — 拉各斯" },
        { quote: "主题编辑器很直观，主题也很精美。我的品牌形象升级了，AI 助手为我省下数小时。", author: "Sarah Koné", role: "创始人，Abidjan Beauty" },
      ],
    },
    psps: { title: "25+ 全球支付商", subtitle: "在全球任何地方收款——无需跳转", regions: { "Afrique": "非洲", "Europe": "欧洲", "Europe/USA": "欧洲/美国", "Asie": "亚洲", "USA": "美国", "Latino": "拉美" } },
    flags: { title: "全球可用", subtitle: "随处销售——Sellia 是全球平台" },
    howItWorks: {
      badge: "运作方式", title: "三步开启您的店铺", subtitle: "从注册到首单，比说出来还快。",
      steps: [
        { title: "创建您的账户", text: "免费注册，用我们的引导助手几分钟内完成店铺设置。" },
        { title: "定制您的店铺", text: "选择高级主题，添加商品、商品集与折扣——无需写代码。" },
        { title: "在线销售", text: "收到首笔款项，管理订单并实时跟踪业绩。" },
      ],
    },
    brands: {
      title: "为每种品牌提供无限解决方案。",
      subtitle: "快速上手核心功能，或在我们开放平台上集成、构建与扩展——B2C 与 B2B 品牌的共同选择。",
      desktop: "桌面", mobile: "移动", autoScroll: "自动滚动 · 12 个类别",
      launchCta: "开设您的店铺", footerNote: "100% 响应式店铺——桌面与移动，可独立配置。",
      categories: { "Mode & Textile": "时尚与纺织", "Electronique": "电子产品", "Beaute & Cosmetiques": "美容与化妆品", "Bijoux & Accessoires": "珠宝与配饰", "Chaussures & Sport": "鞋类与运动", "Maison & Deco": "家居与装饰", "Epicerie & Boissons": "食品与饮料", "Livres & Culture": "图书与文化", "Restaurant & Food": "餐饮与美食", "Jardinerie & Plantes": "园艺与植物", "Sport & Fitness": "运动与健身", "Puericulture & Bebe": "母婴用品" },
    },
  },

  de: {
    features: {
      badge: "Funktionen", title: "Alles, was Sie zum Online-Verkauf brauchen",
      subtitle: "Eine komplette Plattform, vom Shop-Aufbau bis zum Zahlungseingang — in einem Tool.",
      tab: { create: "Erstellen & Anpassen", sell: "Verkaufen & Einnehmen", manage: "Verwalten & Versenden", grow: "Wachsen & Analysieren" },
      items: {
        create: [
          { title: "Visueller Drag-&-Drop-Editor", text: "Erstellen Sie eine Premium-Vitrine ohne Code. Echtzeit-Vorschau für Desktop, Tablet und Mobile." },
          { title: "Internationale Premium-Themes", text: "Raffinierte, anpassbare Themes in Ihren Markenfarben, designed für Händler weltweit." },
          { title: "Intelligente Kollektionen", text: "Manuelle oder automatische Kollektionen mit dynamischen Regeln für Tags, Preis, Bestand und Status." },
          { title: "Natives responsives Design", text: "Jeder Shop passt sich perfekt ans Smartphone an — dort, wo Ihre Kunden wirklich kaufen." },
        ],
        sell: [
          { title: "25+ globale PSPs", text: "Paystack, Flutterwave, M-Pesa, Stripe, PayPal, Payunit… Karten, Mobiles Geld und Überweisungen ohne Weiterleitung." },
          { title: "Multi-Währung & Märkte", text: "Verkaufen Sie überall mit nativem ISO-Währungsmanagement (XOF, NGN, USD, EUR) und 7-Sprachen-Übersetzung." },
          { title: "Checkout ohne Weiterleitung", text: "100% integrierter Trichter — Ihre Kunden verlassen nie Ihren Shop. Weniger Abbrüche, maximale Conversion." },
          { title: "Aktionen & Rabatte", text: "Couponcodes, Prozent-, Festbetrag- oder gratis-Versand-Rabatte mit automatischen Regeln." },
        ],
        manage: [
          { title: "Bestand & Varianten", text: "Tracking pro Variante, Low-Stock-Warnungen und Multi-Standort-Verwaltung gegen Lieferengpässe." },
          { title: "Multi-Zonen-Versand", text: "Preise nach Region, Land und Gewicht. Bedingter Gratisversand und automatisches Paket-Tracking." },
          { title: "Kundenverwaltung", text: "Kundenprofile, Kaufhistorie, mehrere Adressen und Tags für vollständiges, personalisiertes Tracking." },
          { title: "Marketplace", text: "Starten Sie einen Multi-Verkäufer-Marketplace mit Verkäuferverwaltung, Provisionen und geteilten Zahlungen." },
        ],
        grow: [
          { title: "Echtzeit-Analytics", text: "Verfolgen Sie Verkäufe, Besucher, Produkt-Conversion und Trichter auf einem handlungsorientierten Dashboard." },
          { title: "KI-Assistent", text: "Generieren Sie Produktbeschreibungen, SEO-Inhalte und komplette Themes mit der integrierten Sellia-KI." },
          { title: "Marketing & Automatisierung", text: "E-Mail-Kampagnen, Warenkorb-Wiederherstellung und ereignisgesteuerte Automatisierungen." },
          { title: "Smart-Benachrichtigungen", text: "Automatische Hinweise zu Low-Stock, neuen Bestellungen und Anomalien — per E-Mail oder Push." },
        ],
      },
      stats: [ { value: "25+", label: "Integrierte PSPs" }, { value: "7", label: "Native Sprachen" }, { value: "4.9/5", label: "Händlerzufriedenheit" }, { value: "99.9%", label: "Verfügbarkeit" } ],
    },
    pricing: {
      badge: "Preise", title: "Preise für jeden Händler",
      subtitle: "14 Tage kostenlos testen auf allen Plänen. Ohne Kreditkarte.",
      annual: "Jährlich: 20% sparen", popular: "Beliebteste", perMonth: "/Monat", included: "Enthalten", startCta: "Loslegen",
      allPricesNote: "Alle Preise in USD. Monatliche oder jährliche Abrechnung.", payWith: "Bezahlen Sie Ihr Abo mit",
      mobileTitle: "Premium mobile Erfahrung",
      mobileText: "Ihre Kunden kaufen per Smartphone, überall. Flüssiger Checkout, Zahlungen ohne Weiterleitung, Mobile-Geld- und Karten-Support.",
      ratingText: "4.9/5 — 12.000+ Händler",
      plans: [
        { name: "Starter", desc: "Um Ihren ersten Shop zu starten.", features: ["1 Shop", "50 Produkte", "Basis-Themes", "Manuelle Zahlungen", "1 Benutzer", "sellia.app-Subdomain"] },
        { name: "Growth", desc: "Für wachsende Händler.", features: ["1.000 Produkte", "Alle Premium-Themes", "Visueller Editor", "Integrierte Zahlungen", "Multi-Währung", "Basis-Analytics", "3 Benutzer"] },
        { name: "Pro", desc: "Für etablierte Händler.", features: ["Unbegrenzte Produkte", "KI-Assistent", "Erweiterte Analytics", "Eigene Domain", "2 Shops", "10 Benutzer", "API-Zugriff"] },
        { name: "Enterprise", desc: "Für Marketplaces.", features: ["Unbegrenzte Shops", "Multi-Verkäufer-Marketplace", "Headless Commerce", "Automatisierungen & Workflows", "Unbegrenzte Benutzer", "24/7-Support", "99,9% SLA"] },
      ],
    },
    showcase: {
      dashboard: { badge: "Dashboard", title: "Steuern Sie Ihren Shop auf einen Blick", text: "Verfolgen Sie Verkäufe, Bestellungen, Kunden und Produkte in einem klaren Dashboard. Echtzeit-Statistiken für schnelle Entscheidungen.", list: ["Eingenommener Umsatz und Monatstrends", "Echtzeit-Bestellstatus", "Bestseller und Conversion-Trichter", "Multi-Shop-Verwaltung"], cta: "Dashboard erkunden" },
      editor: { badge: "Theme-Editor", title: "Erstellen Sie eine Vitrine, die zu Ihnen passt", text: "Ein intuitiver visueller Editor mit Drag & Drop, responsiver Vorschau, Undo/Redo und sofortiger Veröffentlichung.", highlights: ["Visueller Drag-&-Drop-Editor", "Desktop-, Tablet-, Mobile-Vorschau", "Internationale Premium-Themes", "Farb- & Typografie-Anpassung", "KI-Assistent für Inhalte", "Veröffentlichung mit einem Klick"], badgeLabel: "Drag-&-Drop-Editor", badgeSub: "Ohne Code" },
      mobile: { badge: "Mobile Commerce", title: "Wo Ihre Kunden kaufen", text: "Über 70 % der Online-Käufe erfolgen mobil. Jedes Sellia-Theme ist nativ responsiv — Ihr Shop ist perfekt auf dem Smartphone, mit flüssigem Checkout und Zahlungen ohne Weiterleitung.", trustCheckout: "Checkout ohne Weiterleitung", trustTracking: "Bestellverfolgung", createCta: "Shop erstellen", pricingCta: "Preise ansehen", securePayments: "Sichere Zahlung via", payBtn: "45.000 FCFA bezahlen" },
    },
    testimonials: {
      badge: "Stimmen", title: "Sie verkaufen mit Sellia", subtitle: "Tausende Händler weltweit vertrauen Sellia.",
      stats: [ { label: "Aktive Händler" }, { label: "Abgedeckte Länder" }, { label: "Verarbeiteter Umsatz" }, { label: "Verfügbarkeit" } ],
      items: [
        { quote: "Ich habe meinen Wax-Mode-Shop an einem Nachmittag gestartet. Mobiles-Geld-Zahlungen haben meine Verkäufe verwandelt — meine Kunden brauchen kein Bargeld mehr.", author: "Aïssatou Diop", role: "Gründerin, Boutique Mode Wax — Dakar" },
        { quote: "Sellia verwaltet Multi-Währung nativ. Meine Kunden in Nigeria und der Elfenbeinküste zahlen reibungslos, und ich verwalte alles aus einem Dashboard.", author: "Emeka Okoro", role: "CEO, TechMart — Lagos" },
        { quote: "Der Theme-Editor ist intuitiv und die Themes sind wunderschön. Mein Markenimage hat ein Level zugelegt, und der KI-Assistent hat mir Stunden gespart.", author: "Sarah Koné", role: "Gründerin, Abidjan Beauty" },
      ],
    },
    psps: { title: "25+ globale Zahlungsanbieter", subtitle: "Zahlungen weltweit annehmen — ohne Weiterleitung", regions: { "Afrique": "Afrika", "Europe": "Europa", "Europe/USA": "Europa/USA", "Asie": "Asien", "USA": "USA", "Latino": "Latam" } },
    flags: { title: "Weltweit verfügbar", subtitle: "Überall verkaufen — Sellia ist eine globale Plattform" },
    howItWorks: {
      badge: "So funktioniert es", title: "Drei Schritte zu Ihrem Shop", subtitle: "Von der Anmeldung bis zum ersten Verkauf, schneller als man sagen kann.",
      steps: [
        { title: "Konto erstellen", text: "Registrieren Sie sich kostenlos und richten Sie Ihren Shop in Minuten mit unserem Onboarding-Assistenten ein." },
        { title: "Vitrine anpassen", text: "Wählen Sie ein Premium-Theme, fügen Sie Produkte, Kollektionen und Rabatte hinzu — ohne Code." },
        { title: "Online verkaufen", text: "Nehmen Sie erste Zahlungen entgegen, verwalten Sie Bestellungen und verfolgen Sie Ihre Leistung in Echtzeit." },
      ],
    },
    brands: {
      title: "Unendliche Lösungen für jede Art von Marke.",
      subtitle: "Starten Sie schnell mit dem Wesentlichen, oder integrieren, erstellen und skalieren Sie auf unserer offenen Plattform — gewählt von B2C- und B2B-Marken.",
      desktop: "Desktop", mobile: "Mobile", autoScroll: "Auto-Scroll · 12 Kategorien",
      launchCta: "Shop starten", footerNote: "100% responsive Shops — Desktop & Mobile, unabhängig konfigurierbar.",
      categories: { "Mode & Textile": "Mode & Textil", "Electronique": "Elektronik", "Beaute & Cosmetiques": "Beauty & Kosmetik", "Bijoux & Accessoires": "Schmuck & Accessoires", "Chaussures & Sport": "Schuhe & Sport", "Maison & Deco": "Haus & Deko", "Epicerie & Boissons": "Lebensmittel & Getränke", "Livres & Culture": "Bücher & Kultur", "Restaurant & Food": "Restaurant & Food", "Jardinerie & Plantes": "Garten & Pflanzen", "Sport & Fitness": "Sport & Fitness", "Puericulture & Bebe": "Baby & Kinderpflege" },
    },
  },
};