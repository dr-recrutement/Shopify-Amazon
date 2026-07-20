import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export default function LegalNoticePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">Mentions légales</h1>
        <p className="mt-2 text-sm text-gray-500">Dernière mise à jour : 19 juillet 2026</p>

        <div className="mt-8 prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Éditeur</h2>
            <p><strong>LIYAH GROUP</strong><br />Direction Générale : Yaoundé, Cameroun 🇨🇲<br />Email : info@liafrik.com<br />Téléphone : +237 6 00 00 00 00</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Produit</h2>
            <p>LiAfrikOS — plateforme SaaS multi-tenant e-commerce panafricaine, conçue et développée au Cameroun par LIYAH GROUP, pour toute l'Afrique.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Hébergement</h2>
            <p>Frontend : Cloudflare Pages (réseau global CDN).<br />Base de données & Auth : Supabase (PostgreSQL).<br />Fonctions serverless : Cloudflare Workers / Supabase Edge Functions.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Propriété intellectuelle</h2>
            <p>La plateforme LiAfrikOS, son code, son design et sa marque sont la propriété exclusive de LIYAH GROUP. Les contenus créés par les vendeurs (produits, images, descriptions) appartiennent aux vendeurs respectifs.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
            <p>Pour toute question juridique : <strong>info@liafrik.com</strong></p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
