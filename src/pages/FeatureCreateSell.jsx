import { Palette, Sparkles, ShoppingCart } from 'lucide-react';
import FeatureGroupPage from '@/components/marketing/FeatureGroupPage';

const SECTIONS = [
  {
    id: 'editeur-boutique', icon: Palette, title: 'Éditeur de boutique',
    text: "Un éditeur visuel par glisser-déposer pour construire une vitrine premium sans écrire une ligne de code, avec prévisualisation en direct sur desktop, tablette et mobile.",
    points: ["Glisser-déposer sur toutes les sections", "Prévisualisation responsive en temps réel", "Publication instantanée, sans redéploiement", "Undo/redo illimité pendant l'édition"],
    image: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'themes-premium', icon: Sparkles, title: 'Thèmes premium',
    text: "Des thèmes raffinés et entièrement personnalisables — couleurs, typographies, mise en page — pensés pour les marchands du monde entier, inclus dans votre abonnement sans surcoût.",
    points: ["Thèmes inclus, aucun achat séparé", "Personnalisation complète des couleurs et polices", "Changement de thème à tout moment", "Optimisés pour la conversion"],
    image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'checkout-optimise', icon: ShoppingCart, title: 'Checkout optimisé',
    text: "Un tunnel d'achat 100% intégré à votre boutique — vos clients ne sont jamais redirigés vers un site tiers pour payer, ce qui réduit sensiblement l'abandon de panier.",
    points: ["Aucune redirection externe au paiement", "Formulaire de commande simplifié", "Compatible Mobile Money et cartes", "Reprise automatique des paniers abandonnés"],
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80',
  },
];

export default function FeatureCreateSell() {
  return (
    <FeatureGroupPage
      eyebrow="Créer & Vendre"
      title="Créez une boutique premium, sans code"
      description="Découvrez l'éditeur de boutique, les thèmes premium et le checkout optimisé de Sellia — tout ce qu'il faut pour créer et vendre en ligne."
      url="/fonctionnalites/creer-vendre"
      intro="De l'éditeur visuel aux thèmes premium jusqu'au tunnel de paiement — tout ce dont vous avez besoin pour lancer une boutique qui inspire confiance dès la première visite."
      sections={SECTIONS}
    />
  );
}
