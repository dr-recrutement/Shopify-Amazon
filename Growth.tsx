import { PageHeader, Card } from './ui';
import { ArrowRight, Package, Globe, CreditCard, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getProducts, getCustomers, getTenantStorageKey } from '../../lib/app-state';
import { fetchCloudProducts, fetchCloudCustomers } from '../../lib/tenant-sync';

export default function Growth() {
  const [productCount, setProductCount] = useState(getProducts().length);
  const [customerCount, setCustomerCount] = useState(getCustomers().length);
  const [hasGateway, setHasGateway] = useState(false);
  const [hasCustomDomain, setHasCustomDomain] = useState(false);

  useEffect(() => {
    fetchCloudProducts().then(cloud => { if (cloud) setProductCount(cloud.length); });
    fetchCloudCustomers().then(cloud => { if (cloud) setCustomerCount(cloud.length); });
    try {
      const gateways = JSON.parse(localStorage.getItem(getTenantStorageKey('liafrikos_gateways')) || '{}');
      setHasGateway(Object.values(gateways).some((g: any) => g?.connected));
      const domains = JSON.parse(localStorage.getItem(getTenantStorageKey('liafrikos_domains')) || '[]');
      setHasCustomDomain(domains.some((d: any) => d.type === 'external'));
    } catch {
      // no local data yet — recommendations below still show, just as "not done"
    }
  }, []);

  // Every recommendation here is computed from real, current store data —
  // no fabricated 'growth score' or invented revenue estimate (this page
  // used to show a hardcoded '65/100' and '+45,000 XOF' regardless of the
  // merchant's actual store).
  const recs = [
    !hasGateway && { icon: CreditCard, title: 'Connectez un moyen de paiement', desc: "Aucune passerelle de paiement n'est encore connectée — vos clients ne peuvent pas encore payer.", cta: 'Connecter', to: '/app/settings' },
    productCount < 10 && { icon: Package, title: 'Ajoutez plus de produits', desc: `Vous avez ${productCount} produit(s). Les boutiques avec 10+ produits donnent une meilleure impression de choix.`, cta: 'Ajouter un produit', to: '/app/products' },
    !hasCustomDomain && { icon: Globe, title: 'Connectez votre propre domaine', desc: "Un domaine personnalisé (monsite.com) renforce la confiance par rapport à un sous-domaine.", cta: 'Connecter un domaine', to: '/app/settings' },
    customerCount === 0 && { icon: Users, title: 'Partagez votre boutique', desc: "Aucun client enregistré pour l'instant. Partagez le lien de votre boutique pour attirer vos premiers visiteurs.", cta: 'Voir ma boutique', to: '/app/online-store' },
  ].filter(Boolean) as { icon: typeof Package; title: string; desc: string; cta: string; to: string }[];

  return (
    <div>
      <PageHeader title="Growth" subtitle="Recommandations basées sur l'état réel de votre boutique." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Produits</p><p className="mt-2 text-3xl font-bold">{productCount}</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Clients</p><p className="mt-2 text-3xl font-bold">{customerCount}</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Actions recommandées</p><p className="mt-2 text-3xl font-bold text-brand-600">{recs.length}</p></Card>
      </div>
      {recs.length === 0 ? (
        <Card className="p-8 text-center text-sm text-gray-500">Votre boutique est bien configurée — aucune action urgente pour l'instant.</Card>
      ) : (
        <div className="space-y-3">
          {recs.map((r, i) => {
            const Icon = r.icon;
            return (
              <Card key={i} className="p-5 flex items-start gap-4 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0"><Icon size={18} className="text-brand-600" /></div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{r.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{r.desc}</p>
                </div>
                <Link to={r.to} className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50">
                  {r.cta} <ArrowRight size={14} />
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
