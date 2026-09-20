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

export default function Landing() {
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