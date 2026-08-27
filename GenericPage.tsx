import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card } from '../pages/dashboard/ui';

export default function GenericPage({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <h1 className="font-serif-display text-4xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-3 text-gray-600 text-lg">{subtitle}</p>}
        <div className="mt-8">{children ?? <Card className="p-8"><p className="text-gray-600">Contenu de la page.</p></Card>}</div>
      </div>
      <Footer />
    </div>
  );
}
