import { Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPlan } from '@/lib/plans';

export default function PaywallCard({ requiredPlan, title, description }) {
  const plan = getPlan(requiredPlan);
  return (
    <div className="rounded-xl border border-border bg-surface p-6 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Lock className="w-5 h-5 text-muted-foreground" />
      </div>
      <h3 className="font-heading font-bold text-base text-foreground">{title || `Plan ${plan.name} requis`}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
        {description || `Cette fonctionnalité nécessite le plan ${plan.name} (${plan.price}${plan.period}). Mettez à niveau pour y accéder.`}
      </p>
      <Link to="/settings" className="mt-4 inline-flex items-center gap-1.5 bg-foreground text-background font-semibold px-5 py-2.5 rounded-full text-sm hover:opacity-90 transition-opacity">
        Mettre à niveau <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}