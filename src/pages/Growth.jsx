import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingCart, Users, Package, Loader2, AlertCircle, ArrowRight, Zap, Target, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { formatMoney } from '@/lib/world/currencies';

export default function Growth() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [carts, setCarts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const [o, c, ca, p] = await Promise.all([
        base44.entities.Order.filter({ store_id: store.id }, '-created_date', 500),
        base44.entities.Customer.filter({ store_id: store.id }, '-created_date', 200),
        base44.entities.Cart.filter({ store_id: store.id, status: 'abandoned' }, '-created_date', 50),
        base44.entities.Product.filter({ store_id: store.id }, '-created_date', 100),
      ]);
      setOrders(o); setCustomers(c); setCarts(ca); setProducts(p);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const stats = (() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const recentOrders = orders.filter((o) => new Date(o.created_date) >= thirtyDaysAgo);
    const revenue = recentOrders.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + (o.total || 0), 0);
    const newCustomers = customers.filter((c) => c.created_date && new Date(c.created_date) >= thirtyDaysAgo).length;
    return { revenue, recentOrders: recentOrders.length, newCustomers, abandoned: carts.length };
  })();

  const opportunities = [];
  if (carts.length > 0) opportunities.push({ icon: ShoppingCart, text: `${carts.length} panier${carts.length > 1 ? 's' : ''} abandonné${carts.length > 1 ? 's' : ''} à relancer`, action: 'Voir les paniers', to: '/orders' });
  const draftProducts = products.filter((p) => p.status === 'draft').length;
  if (draftProducts > 0) opportunities.push({ icon: Package, text: `${draftProducts} produit${draftProducts > 1 ? 's' : ''} en brouillon à publier`, action: 'Publier', to: '/products' });
  const noImgProducts = products.filter((p) => !p.images || p.images.length === 0).length;
  if (noImgProducts > 0) opportunities.push({ icon: Target, text: `${noImgProducts} produit${noImgProducts > 1 ? 's' : ''} sans image`, action: 'Ajouter des images', to: '/products' });
  const noDescProducts = products.filter((p) => !p.description).length;
  if (noDescProducts > 0) opportunities.push({ icon: Zap, text: `${noDescProducts} produit${noDescProducts > 1 ? 's' : ''} sans description`, action: 'Compléter', to: '/products' });

  if (storeLoading || loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-brand mx-auto mb-3" />
        <h1 className="text-lg font-bold text-foreground">Configurez votre boutique</h1>
        <Link to="/store-setup" className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground text-sm font-medium px-4 py-2 rounded-full hover:bg-brand/90 mt-3">Configurer</Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Croissance</h1>
          <p className="text-xs text-muted-foreground">Opportunités et leviers pour développer votre activité (30 derniers jours).</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBox icon={TrendingUp} label="Revenu (30 j)" value={formatMoney(stats.revenue, store.currency)} />
        <StatBox icon={ShoppingCart} label="Commandes (30 j)" value={String(stats.recentOrders)} />
        <StatBox icon={Users} label="Nouveaux clients" value={String(stats.newCustomers)} />
        <StatBox icon={ShoppingCart} label="Paniers abandonnés" value={String(stats.abandoned)} />
      </div>

      {/* Opportunities */}
      <div className="rounded-2xl border border-border bg-white p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-brand" />
          <h2 className="font-heading font-bold text-base text-foreground">Opportunités de croissance</h2>
        </div>
        {opportunities.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-brand-muted flex items-center justify-center mx-auto mb-3"><Zap className="w-5 h-5 text-brand" /></div>
            <p className="text-sm font-medium text-foreground">Tout est en ordre !</p>
            <p className="text-xs text-muted-foreground mt-1">Aucune action prioritaire détectée pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {opportunities.map((o, i) => (
              <Link key={i} to={o.to} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-brand/40 hover:bg-surface transition-colors group">
                <div className="w-9 h-9 rounded-full bg-brand-muted flex items-center justify-center shrink-0"><o.icon className="w-4 h-4 text-brand" /></div>
                <p className="text-sm text-foreground flex-1">{o.text}</p>
                <span className="text-xs font-semibold text-brand flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">{o.action} <ArrowRight className="w-3 h-3" /></span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Abandoned carts */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-heading font-bold text-base text-foreground">Paniers abandonnés récents</h2>
        </div>
        {carts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Aucun panier abandonné. Bravo !</p>
        ) : (
          <div className="space-y-2">
            {carts.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{(c.items || []).length} article{(c.items || []).length > 1 ? 's' : ''}</p>
                  <p className="text-xs text-muted-foreground">{new Date(c.created_date).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-bold text-foreground">{formatMoney(c.total || 0, store.currency)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="font-heading font-extrabold text-xl text-foreground">{value}</p>
    </div>
  );
}