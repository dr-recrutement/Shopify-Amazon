import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, StatCard } from './ui';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Mail, Package, Target, ShoppingCart, Users, DollarSign, ArrowRight } from 'lucide-react';

export default function Growth() {
  const { tenant } = useTenant();
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, products: 0, avgOrder: 0 });
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tenant) return;
    const [orders, customers, products] = await Promise.all([
      supabase.from('orders').select('total_cents, status').eq('tenant_id', tenant.id),
      supabase.from('customers').select('id, created_at').eq('tenant_id', tenant.id),
      supabase.from('products').select('id, stock').eq('tenant_id', tenant.id),
    ]);
    const orderData = orders.data || [];
    const revenue = orderData.reduce((s, o) => s + (o.total_cents || 0), 0);
    const orderCount = orderData.length;
    const custCount = (customers.data || []).length;
    const prodCount = (products.data || []).length;
    const lowStock = (products.data || []).filter((p: any) => p.stock <= 5).length;
    setStats({ revenue, orders: orderCount, customers: custCount, products: prodCount, avgOrder: orderCount ? revenue / orderCount : 0 });
    const newRecs: any[] = [];
    if (prodCount < 10) newRecs.push({ icon: Package, title: 'Ajouter plus de produits', desc: `Vous avez ${prodCount} produits. Les boutiques avec 10+ produits vendent 2x plus.`, cta: 'Ajouter un produit', link: '/app/products' });
    if (orderCount > 0) newRecs.push({ icon: ShoppingCart, title: 'Optimiser le panier moyen', desc: `Panier moyen: ${(stats.avgOrder / 100).toLocaleString('fr-FR')} ${tenant.currency}. Proposez des produits complémentaires.`, cta: 'Voir les produits', link: '/app/products' });
    if (lowStock > 0) newRecs.push({ icon: Target, title: 'Réapprovisionner les stocks faibles', desc: `${lowStock} produit(s) en stock faible. Réapprovisionnez pour ne pas perdre de ventes.`, cta: 'Gérer les stocks', link: '/app/products' });
    if (custCount > 0) newRecs.push({ icon: Mail, title: 'Cibler les clients inactifs', desc: `${custCount} client(s) enregistré(s). Une campagne promotionnelle pourrait réactiver les inactifs.`, cta: 'Créer une campagne', link: '/app/marketing' });
    if (newRecs.length === 0) newRecs.push({ icon: TrendingUp, title: 'Votre boutique est en bonne santé', desc: 'Continuez à ajouter des produits et des campagnes marketing pour croître.', cta: 'Voir le dashboard', link: '/app' });
    setRecs(newRecs);
    setLoading(false);
  }, [tenant]);

  useEffect(() => { if (tenant) load(); }, [tenant, load]);

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  const fmt = (cents: number) => `${(cents / 100).toLocaleString('fr-FR')} ${tenant?.currency || 'XOF'}`;
  const growthScore = Math.min(100, stats.products * 5 + stats.orders * 10 + stats.customers * 8);

  return (
    <div>
      <PageHeader title="Growth" subtitle="Recommandations et métriques de croissance basées sur vos données réelles." />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Score de croissance" value={`${growthScore}/100`} icon={TrendingUp} color="orange" />
        <StatCard label="Revenu total" value={fmt(stats.revenue)} icon={DollarSign} color="green" />
        <StatCard label="Commandes" value={String(stats.orders)} icon={ShoppingCart} color="blue" />
        <StatCard label="Clients" value={String(stats.customers)} icon={Users} color="orange" />
      </div>
      <div className="space-y-3">
        {recs.map((r, i) => {
          const Icon = r.icon;
          return (
            <Card key={i} className="p-5 flex items-start gap-4 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0"><Icon size={18} className="text-orange-600" /></div>
              <div className="flex-1"><h3 className="font-semibold text-gray-900">{r.title}</h3><p className="text-sm text-gray-500 mt-1">{r.desc}</p></div>
              <Button variant="secondary" size="sm" className="flex-shrink-0" onClick={() => window.location.hash = r.link}>{r.cta} <ArrowRight size={14} /></Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
