import { useEffect } from 'react';
import LandingNav from '@/components/landing/LandingNav';
import LandingHero from '@/components/landing/LandingHero';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingShowcase from '@/components/landing/LandingShowcase';
import LandingBrands from '@/components/landing/LandingBrands';
import LandingHowItWorks from '@/components/landing/LandingHowItWorks';
import LandingTestimonials from '@/components/landing/LandingTestimonials';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingPSPs from '@/components/landing/LandingPSPs';
import LandingFlags from '@/components/landing/LandingFlags';
import LandingFooter from '@/components/landing/LandingFooter';
import { applySEO, applyOrganizationJsonLd, applyFAQJsonLd } from '@/lib/seo';

const HOME_FAQS = [
  { q: 'Sellia est-il une alternative à Shopify, Wix ou WooCommerce ?', a: "Oui. Sellia est une plateforme e-commerce tout-en-un pensée comme alternative premium à Shopify, BigCommerce, PrestaShop, WooCommerce, Odoo et Wix, avec en plus le Mobile Money intégré nativement." },
  { q: 'Quel est le prix de Sellia ?', a: "Les plans démarrent à 7$/mois, avec un essai gratuit de 14 jours sans carte bancaire requise." },
  { q: 'Sellia accepte-t-il le Mobile Money ?', a: "Oui, nativement : Orange Money, Wave, MTN Mobile Money, Airtel Money, ainsi que plus de 25 prestataires de paiement mondiaux, sans redirection hors de votre boutique." },
];

export default function Landing() {
  useEffect(() => {
    applyOrganizationJsonLd();
    applyFAQJsonLd('sellia-jsonld-faq-home', HOME_FAQS);
    applySEO({
      title: 'Sellia — Alternative premium à Shopify, BigCommerce, PrestaShop, WooCommerce, Odoo et Wix',
      description: "Créez votre boutique en ligne avec Sellia : thèmes premium, paiements Mobile Money et 25+ PSP, assistant IA. L'alternative complète à Shopify, BigCommerce, PrestaShop, WooCommerce, Odoo et Wix.",
      url: 'https://sellia.liafrik.com/',
    });
  }, []);

  return (
    <div className="min-h-screen bg-background font-landing">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingPSPs />
        <LandingFeatures />
        <LandingFlags />
        <LandingShowcase />
        <LandingBrands />
        <LandingHowItWorks />
        <LandingTestimonials />
        <LandingPricing />
      </main>
      <LandingFooter />
    </div>
  );
}