import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { GraduationCap, BookOpen, Video, FileText, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

const COURSES = [
  { id: 1, title: 'Démarrer sa boutique en 10 minutes', level: 'Débutant', duration: '15 min', lessons: 5, icon: BookOpen, desc: 'Apprenez à créer votre boutique, ajouter un produit et configurer le paiement.' },
  { id: 2, title: 'Maîtriser le Mobile Money', level: 'Débutant', duration: '20 min', lessons: 6, icon: Video, desc: 'Connectez Flutterwave, Paystack, Orange Money, MTN MoMo et acceptez vos premiers paiements.' },
  { id: 3, title: 'Optimiser ses fiches produit', level: 'Intermédiaire', duration: '30 min', lessons: 8, icon: FileText, desc: 'Photos, descriptions, variantes, SEO — tout pour convertir vos visiteurs en acheteurs.' },
  { id: 4, title: 'Marketing WhatsApp & Instagram', level: 'Intermédiaire', duration: '45 min', lessons: 10, icon: Video, desc: 'Stratégies marketing adaptées au marché africain : WhatsApp Business, Instagram, TikTok.' },
  { id: 5, title: 'Gérer sa comptabilité simplement', level: 'Avancé', duration: '40 min', lessons: 7, icon: FileText, desc: 'Livre de comptes, marges, factures, rapports financiers — sans jargon comptable.' },
  { id: 6, title: 'Exploser ses ventes avec l\'IA', level: 'Avancé', duration: '50 min', lessons: 12, icon: GraduationCap, desc: 'Descriptions auto, logos, bannières, publicités, vidéos TikTok, chatbot — exploitez l\'IA LiAfrikOS.' },
];

const LEARNING_PATHS = [
  { name: 'Parcours Vendeur Débutant', courses: 3, duration: '1h', badge: 'Gratuit', color: 'orange' },
  { name: 'Parcours Croissance', courses: 4, duration: '2h30', badge: 'Premium', color: 'blue' },
  { name: 'Parcours Expert IA', courses: 5, duration: '3h', badge: 'Entreprise', color: 'gray' },
];

export default function AcademyPage() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
            <GraduationCap size={16} /> Académie vendeur
          </div>
          <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">Apprenez à vendre en ligne, depuis l'Afrique</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Des parcours structurés, conçus par des vendeurs africains pour des vendeurs africains. Mobile Money, marketing WhatsApp, IA, comptabilité — tout pour réussir.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {LEARNING_PATHS.map(p => (
            <div key={p.name} className="p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.color === 'orange' ? 'bg-orange-100 text-orange-700' : p.color === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{p.badge}</span>
                <Clock size={14} className="text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900">{p.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{p.courses} cours · {p.duration}</p>
              <button className="mt-4 w-full py-2 bg-gray-100 text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">Voir le parcours</button>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Tous les cours</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COURSES.map(c => {
            const Icon = c.icon;
            return (
              <div key={c.id} className="group p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:border-orange-200 transition-all cursor-pointer" onClick={() => setSelected(selected === c.id ? null : c.id)}>
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                  <Icon size={22} className="text-orange-600" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{c.level}</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12} /> {c.duration}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{c.title}</h3>
                <p className="text-sm text-gray-600">{c.desc}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500">{c.lessons} leçons</span>
                  <ArrowRight size={16} className="text-orange-600 group-hover:translate-x-1 transition-transform" />
                </div>
                {selected === c.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    {Array.from({ length: c.lessons }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 size={14} className="text-green-600" /> Leçon {i + 1}: {['Introduction', 'Configuration', 'Pratique', 'Exercices', 'Quiz'][i % 5]}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
