import { UserPlus, Store, Rocket } from 'lucide-react';

const STEPS = [
  { icon: UserPlus, title: 'Créez votre compte', text: 'Inscrivez-vous gratuitement et configurez votre boutique en quelques minutes avec notre assistant d’onboarding.' },
  { icon: Store, title: 'Personnalisez votre vitrine', text: 'Choisissez un thème premium, ajoutez vos produits, vos collections et vos réductions — sans coder.' },
  { icon: Rocket, title: 'Vendez en ligne', text: 'Encaissez vos premiers paiements, gérez vos commandes et suivez vos performances en temps réel.' },
];

export default function LandingHowItWorks() {
  return (
    <section id="process" className="py-20 lg:py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-gold uppercase tracking-wide">Comment ça marche</span>
          <h2 className="mt-2 font-landing font-semibold text-2xl sm:text-[2rem] text-foreground tracking-tight">Trois étapes vers votre boutique</h2>
          <p className="mt-3 text-muted-foreground text-lg">De l’inscription à votre première vente, en moins de temps qu’il n’en faut pour le dire.</p>
        </div>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative">
              <div className="rounded-2xl bg-white border border-border p-7 h-full hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center">
                    <s.icon className="w-6 h-6 text-brand-foreground" />
                  </div>
                  <span className="font-landing font-extrabold text-4xl text-border">{i + 1}</span>
                </div>
                <h3 className="mt-5 font-landing font-bold text-xl text-foreground">{s.title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
              {i < STEPS.length - 1 && <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-border" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}