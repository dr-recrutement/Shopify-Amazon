import { Package, CreditCard, Truck, Tag } from 'lucide-react';
import FeatureGroupPage from '@/components/marketing/FeatureGroupPage';

const SECTIONS = [
  {
    id: 'gestion-stocks', icon: Package, title: 'Gestion des stocks',
    text: "Suivi précis par variante, alertes de stock bas et gestion multi-emplacements pour ne jamais être pris au dépourvu quand une commande arrive.",
    points: ["Suivi par variante (taille, couleur…)", "Alertes automatiques de stock bas", "Gestion multi-emplacements", "Historique complet des mouvements"],
    image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'paiements-integres', icon: CreditCard, title: 'Paiements intégrés',
    text: "Plus de 25 prestataires de paiement mondiaux, dont le Mobile Money nativement — Orange Money, Wave, MTN Mobile Money, Airtel Money — sans application tierce.",
    points: ["Mobile Money natif, sans plugin", "Cartes bancaires et virements", "Multi-devises (XOF, NGN, USD, EUR…)", "Aucune redirection hors de la boutique"],
    image: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'livraison-multi-zones', icon: Truck, title: 'Livraison multi-zones',
    text: "Des tarifs de livraison configurables par région, pays et poids, avec suivi automatisé des colis pour rassurer vos clients du paiement à la réception.",
    points: ["Tarifs par région, pays et poids", "Livraison gratuite conditionnelle", "Suivi de commande automatisé", "Zones de livraison illimitées"],
    image: 'https://images.unsplash.com/photo-1601599963565-b7f49deb2076?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'promotions-reductions', icon: Tag, title: 'Promotions & réductions',
    text: "Codes promo, remises en pourcentage ou montant fixe, livraison offerte — avec des règles automatiques pour animer vos ventes sans effort manuel.",
    points: ["Codes promo personnalisables", "Remises en % ou montant fixe", "Livraison offerte conditionnelle", "Règles automatiques par produit ou collection"],
    image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=900&q=80',
  },
];

export default function FeatureManage() {
  return (
    <FeatureGroupPage
      eyebrow="Gérer"
      title="Gérez stocks, paiements et livraisons sans effort"
      description="Découvrez la gestion des stocks, les paiements intégrés (Mobile Money inclus), la livraison multi-zones et les promotions de Sellia."
      url="/fonctionnalites/gerer"
      intro="Du stock au paiement jusqu'à la livraison — Sellia automatise les tâches répétitives pour que vous puissiez vous concentrer sur vos produits et vos clients."
      heroImage="/marketing/hero/rupixen-payment-4334491_1920.jpg"
      sections={SECTIONS}
    />
  );
}
