import type { ReactNode } from 'react';
import { Mail, Check } from 'lucide-react';
import { Card } from './dashboard/ui';
import { PLANS } from '../lib/constants';

const DEPARTMENTS = [
  { label: 'Service client', email: 'cs@liafrik.com', desc: 'Questions sur votre compte ou votre boutique.' },
  { label: 'Aide générale', email: 'help@liafrik.com', desc: 'Toute autre question.' },
  { label: 'Ventes', email: 'sales@liafrik.com', desc: 'Plans, tarifs, démonstration.' },
  { label: 'Support technique', email: 'support@liafrik.com', desc: 'Problème technique ou bug.' },
  { label: 'Sécurité', email: 'security@liafrik.com', desc: 'Signaler une faille ou un abus.' },
];

export function ContactPageContent() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {DEPARTMENTS.map(d => (
        <a key={d.email} href={`mailto:${d.email}`} className="block">
          <Card className="p-5 hover:border-brand-300 hover:shadow-md transition-all h-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0"><Mail size={18} className="text-brand-600" /></div>
              <div>
                <p className="font-semibold text-gray-900">{d.label}</p>
                <p className="text-sm text-brand-600">{d.email}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500">{d.desc}</p>
          </Card>
        </a>
      ))}
    </div>
  );
}

function planLimitLabel(value: number): string {
  return value === -1 ? 'Illimité' : String(value);
}

// Built directly from the real PLANS enforcement data (src/lib/plan-access.ts
// applies these exact fields) — not a separate marketing list that could
// silently drift from what the product actually enforces.
export function FeaturesPageContent() {
  const rows: Array<{ label: string; get: (p: (typeof PLANS)[number]) => ReactNode }> = [
    { label: 'Produits', get: p => planLimitLabel(p.products) },
    { label: 'Membres d\'équipe', get: p => planLimitLabel(p.staff) },
    { label: 'Générations IA / mois', get: p => planLimitLabel(p.aiGenerations) },
    { label: 'Domaine personnalisé', get: () => <Check size={14} className="text-green-600 mx-auto" /> },
    { label: 'Vidéos IA', get: p => p.videoAI ? <Check size={14} className="text-green-600 mx-auto" /> : <span className="text-gray-300">—</span> },
    { label: 'Chatbot IA', get: p => p.chatbotAI ? <Check size={14} className="text-green-600 mx-auto" /> : <span className="text-gray-300">—</span> },
    { label: 'Assistant comptable IA', get: p => p.accountingAI ? <Check size={14} className="text-green-600 mx-auto" /> : <span className="text-gray-300">—</span> },
    { label: 'Listing Marketplace', get: p => p.marketplaceListing ? <Check size={14} className="text-green-600 mx-auto" /> : <span className="text-gray-300">—</span> },
    { label: 'Badge vérifié', get: p => p.verifiedBadge ? <Check size={14} className="text-green-600 mx-auto" /> : <span className="text-gray-300">—</span> },
    { label: 'Accès API', get: p => p.apiAccess ? <Check size={14} className="text-green-600 mx-auto" /> : <span className="text-gray-300">—</span> },
  ];
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Ce qui vous attend selon votre plan</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 pr-4 font-medium text-gray-500">Fonctionnalité</th>
              {PLANS.map(p => <th key={p.id} className="text-center py-2 px-3 font-medium text-gray-900">{p.name}<br /><span className="font-normal text-gray-400">${p.price}/mois</span></th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.label} className="border-b border-gray-50">
                <td className="py-2.5 pr-4 text-gray-700">{r.label}</td>
                {PLANS.map(p => <td key={p.id} className="text-center py-2.5 px-3">{r.get(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-gray-400">Domaine personnalisé inclus sur tous les plans. Super admins : accès illimité, aucun abonnement facturé.</p>
    </Card>
  );
}

export function ComingSoonContent() {
  return (
    <Card className="p-10 text-center">
      <p className="text-gray-500">Cette section n'est pas encore disponible. Revenez bientôt.</p>
    </Card>
  );
}
