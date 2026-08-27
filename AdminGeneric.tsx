import { PageHeader, Card } from '../dashboard/ui';
import { Construction } from 'lucide-react';

// Every section using this component (Utilisateurs, Facturation SaaS, CMS
// Plateforme, Modération, Statistiques globales, Audit & Logs,
// Configuration) used to show 5 identical fake rows ('Élément 1'...'Élément
// 5', a fake 'Actif' badge on all of them) with dead Export/Manage buttons
// — the same fabricated placeholder regardless of which section you were
// on. Rather than keep faking it, this states plainly that it isn't built
// yet. AdminHome and AdminStores already show real data (tenants,
// subscription_events); the rest need their own real data model each,
// not one shared fake table.
export default function AdminGeneric({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <Card className="p-10 flex flex-col items-center text-center gap-3">
        <Construction size={28} className="text-gray-300" />
        <p className="text-sm text-gray-500 max-w-md">Cette section n'est pas encore construite. Les vraies données (boutiques, plans, revenus) sont déjà disponibles dans Vue globale et Boutiques — celle-ci a besoin de son propre modèle de données.</p>
      </Card>
    </div>
  );
}
