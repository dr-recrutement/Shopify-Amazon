import { useState } from 'react';
import { Store, Palette, CreditCard, Globe2, BarChart3, Bot, ShoppingBag, Layers, Truck, Tag, Users, Smartphone, Zap, ShieldCheck, TrendingUp, Boxes, Megaphone, Star, Wallet, Bell } from 'lucide-react';

const TABS = [
  {
    id: 'create', label: 'Créer & Personnaliser', icon: Palette,
    features: [
      { icon: Store, title: 'Éditeur visuel drag & drop', text: 'Créez une vitrine premium sans toucher au code. Prévisualisation desktop, tablette et mobile en temps réel.' },
      { icon: Palette, title: 'Thèmes premium internationaux', text: 'Des thèmes raffinés et personnalisables aux couleurs de votre marque, pensés pour les marchands du monde entier.' },
      { icon: Layers, title: 'Collections intelligentes', text: 'Collections manuelles ou automatiques avec règles dynamiques sur tags, prix, stock et statut.' },
      { icon: Smartphone, title: 'Responsive natif', text: 'Chaque boutique s’adapte parfaitement au mobile — là où vos clients achètent réellement.' },
    ],
  },
  {
    id: 'sell', label: 'Vendre & Encaisser', icon: Wallet,
    features: [
      { icon: CreditCard, title: '25+ PSP mondiaux', text: 'Paystack, Flutterwave, M-Pesa, Stripe, PayPal, Payunit… Cartes, Mobile Money et virements sans redirection.' },
      { icon: Globe2, title: 'Multi-devises & marchés', text: 'Vendez partout avec gestion native des devises ISO (XOF, NGN, USD, EUR) et traduction en 7 langues.' },
      { icon: ShieldCheck, title: 'Checkout sans redirection', text: 'Tunnel d’achat 100% intégré — vos clients ne quittent jamais votre boutique. Abandon réduit, conversion maximale.' },
      { icon: Tag, title: 'Promotions & réductions', text: 'Codes promo, remises en pourcentage, montant fixe ou livraison offerte avec règles automatiques.' },
    ],
  },
  {
    id: 'manage', label: 'Gérer & Livrer', icon: Boxes,
    features: [
      { icon: Boxes, title: 'Stocks & variantes', text: 'Suivi par variante, alertes de stock bas et gestion multi-emplacements pour ne jamais être en rupture.' },
      { icon: Truck, title: 'Livraison multi-zones', text: 'Tarifs par région, pays et poids. Livraison gratuite conditionnelle et suivi automatisé des colis.' },
      { icon: Users, title: 'Gestion clients', text: 'Profils clients, historique d’achats, adresses multiples et tags pour un suivi complet et personnalisé.' },
      { icon: ShoppingBag, title: 'Place de marché', text: 'Lancez une marketplace multi-vendeurs avec gestion des vendeurs, commissions et paiements répartis.' },
    ],
  },
  {
    id: 'grow', label: 'Croître & Analyser', icon: TrendingUp,
    features: [
      { icon: BarChart3, title: 'Analytics temps réel', text: 'Suivez ventes, visiteurs, taux de conversion par produit et tunnel d’achat sur un tableau de bord actionnable.' },
      { icon: Bot, title: 'Assistant IA', text: 'Générez descriptions produit, contenus SEO et thèmes entiers grâce à l’IA intégrée Sellia.' },
      { icon: Megaphone, title: 'Marketing & automations', text: 'Campagnes e-mail, récupération de paniers abandonnés et automatisations déclenchées par événements.' },
      { icon: Bell, title: 'Alertes intelligentes', text: 'Notifications automatiques de stock bas, nouvelles commandes et anomalies — par e-mail ou push.' },
    ],
  },
];

export default function LandingFeatures() {
  const [active, setActive] = useState('create');
  const current = TABS.find((t) => t.id === active) || TABS[0];

  return (
    <section id="fonctionnalites" className="py-20 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-gold uppercase tracking-wide">Fonctionnalités</span>
          <h2 className="mt-2 font-landing font-semibold text-2xl sm:text-[2rem] text-foreground tracking-tight">Tout ce qu’il faut pour vendre en ligne</h2>
          <p className="mt-3 text-muted-foreground text-lg">Une plateforme complète, de la création de boutique à l’encaissement — en un seul outil.</p>
        </div>

        {/* Tab pills */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                active === t.id
                  ? 'bg-brand text-brand-foreground shadow-lg shadow-brand/20'
                  : 'bg-white border border-border text-foreground hover:border-brand/40 hover:bg-surface'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Feature grid for active tab */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {current.features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-white p-6 hover:border-brand/40 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-muted flex items-center justify-center group-hover:bg-brand transition-colors shrink-0">
                  <f.icon className="w-6 h-6 text-brand group-hover:text-brand-foreground transition-colors" />
                </div>
                <div>
                  <h3 className="font-landing font-bold text-lg text-foreground">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stat strip */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Zap, value: '25+', label: 'PSP intégrés' },
            { icon: Globe2, value: '7', label: 'Langues natives' },
            { icon: Star, value: '4,9/5', label: 'Satisfaction marchands' },
            { icon: TrendingUp, value: '99,9%', label: 'Disponibilité' },
          ].map((s) => (
            <div key={s.label} className="text-center rounded-2xl bg-surface border border-border p-5">
              <s.icon className="w-5 h-5 text-brand mx-auto mb-2" />
              <p className="font-landing font-bold text-2xl text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}