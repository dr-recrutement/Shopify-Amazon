import json

FR = {
  "about": {
    "meta_title": "À propos de Sellia",
    "meta_desc": "Sellia est la plateforme e-commerce premium développée par Liafrik pour permettre à tout marchand de lancer, gérer et développer une boutique en ligne à l'international.",
    "h1": "À propos de Sellia",
    "hero_p": "Sellia est développée par Liafrik pour donner aux marchands du monde entier une alternative premium aux grandes plateformes e-commerce — plus complète sur les paiements locaux, plus simple à prendre en main, et pensée pour vendre à l'international dès le premier jour.",
    "stats": [
      {"value": "12 000+", "label": "marchands actifs"},
      {"value": "25+", "label": "moyens de paiement intégrés"},
      {"value": "7", "label": "langues disponibles"},
      {"value": "4,9/5", "label": "satisfaction moyenne"}
    ],
    "mission_h2": "Notre mission",
    "mission_p": "Donner à tout marchand — d'Abidjan à Paris, de Lagos à Montréal — les mêmes outils premium que les plus grandes marques, sans la complexité technique ni les coûts cachés des plateformes historiques.",
    "values": [
      {"title": "Une ambition mondiale", "text": "Sellia est conçu pour vendre partout dans le monde : multi-devises natif, Mobile Money et cartes internationales dans une seule plateforme."},
      {"title": "Le premium comme standard", "text": "Thèmes soignés, checkout sans redirection, sécurité et performance ne sont pas des options payantes — c'est la base de chaque plan."},
      {"title": "Des marchands, pas des tickets", "text": "Chaque fonctionnalité part d'un vrai besoin de commerçant, pas d'une case à cocher marketing."},
      {"title": "L'IA au service du commerce", "text": "Sellia Assistant génère contenus, thèmes et optimisations SEO pour que vous vous concentriez sur vos produits et vos clients."}
    ],
    "cta_h2": "Envie de rejoindre l'aventure Sellia ?",
    "cta_p": "Lancez votre boutique aujourd'hui, ou découvrez nos offres d'emploi.",
    "cta_button1": "Créer ma boutique",
    "cta_button2": "Voir les carrières"
  },
  "contact": {
    "meta_title": "Contact",
    "meta_desc": "Contactez l'équipe Sellia : support technique, service client ou réseaux sociaux. Nous répondons rapidement à tous les marchands.",
    "h1": "Contactez-nous",
    "hero_p": "Une équipe disponible pour répondre à vos questions, avant et après votre inscription.",
    "channel1_title": "Support technique",
    "channel1_text": "Une question sur votre boutique, un bug, une fonctionnalité ?",
    "channel2_title": "Service client",
    "channel2_text": "Facturation, commandes, votre compte marchand.",
    "follow_title": "Suivez Sellia",
    "follow_p": "Actualités produit, nouveautés et coulisses de la plateforme."
  },
  "careers": {
    "meta_title": "Carrières",
    "meta_desc": "Rejoignez l'équipe Liafrik qui développe Sellia, la plateforme e-commerce premium. Découvrez notre mission et comment postuler.",
    "h1": "Carrières chez Sellia",
    "hero_p": "Sellia est développée par l'équipe Liafrik. Nous grandissons vite et sommes toujours à l'écoute de profils talentueux — même en dehors de nos offres publiées.",
    "reasons": [
      {"title": "Impact international", "text": "Votre travail sert des marchands sur plusieurs continents, dès le premier jour."},
      {"title": "Un produit qui bouge vite", "text": "Nouvelles fonctionnalités, nouveaux marchés, nouveaux moyens de paiement — l'équipe avance vite et ship souvent."},
      {"title": "Une équipe à taille humaine", "text": "Chez Liafrik, chaque personne compte et a un impact direct et visible sur le produit."}
    ],
    "spontaneous_h2": "Aucun poste ouvert ne correspond à votre profil ?",
    "spontaneous_p": "Envoyez-nous votre candidature spontanée — nous lisons chaque message.",
    "spontaneous_button": "Postuler par e-mail"
  }
}

json.dump(FR, open('/tmp/i18n2/fr.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('FR batch1 written')
