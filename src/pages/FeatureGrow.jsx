import { BarChart3, Globe2, Bot } from 'lucide-react';
import FeatureGroupPage from '@/components/marketing/FeatureGroupPage';

const SECTIONS = [
  {
    id: 'analytics-temps-reel', icon: BarChart3, title: 'Analytics en temps réel',
    text: "Un tableau de bord clair pour suivre ventes, visiteurs, taux de conversion par produit et tunnel d'achat — des données actionnables, pas juste des chiffres.",
    points: ["Revenu et tendances en temps réel", "Taux de conversion par produit", "Rapports exportables", "Vue multi-boutiques"],
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'multi-devises', icon: Globe2, title: 'Multi-devises',
    text: "Vendez partout avec une gestion native des devises ISO (XOF, NGN, USD, EUR…) et une interface traduite en 7 langues — sans configuration technique.",
    points: ["Devises ISO natives", "Conversion automatique des prix", "7 langues disponibles", "Un seul catalogue, plusieurs marchés"],
    image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'sellia-assistant', icon: Bot, title: 'Sellia Assistant',
    text: "L'assistant IA intégré à Sellia génère descriptions produit, contenus SEO et même des thèmes entiers — pour gagner des heures chaque semaine.",
    points: ["Descriptions produit générées par IA", "Contenus optimisés pour le SEO", "Génération de thèmes complets", "Disponible dans les plans Pro et Enterprise"],
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80',
  },
];

export default function FeatureGrow() {
  return (
    <FeatureGroupPage
      eyebrow="Croître"
      title="Analysez, vendez à l'international, gagnez du temps"
      description="Découvrez les analytics en temps réel, le multi-devises et Sellia Assistant (IA) — les outils de croissance de la plateforme Sellia."
      url="/fonctionnalites/croitre"
      intro="Des données claires, une portée internationale native et une IA qui travaille pour vous — pour faire grandir votre boutique sans multiplier les outils."
      sections={SECTIONS}
    />
  );
}
