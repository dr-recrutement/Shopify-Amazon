import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { Package, ShoppingCart, Users, Activity as ActivityIcon, Loader2, ArrowLeft } from 'lucide-react';

function relTime(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'à l’instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `il y a ${days} j`;
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function ActivityLogs() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const [products, orders, customers] = await Promise.all([
        base44.entities.Product.filter({ store_id: store.id }, '-updated_date', 25),
        base44.entities.Order.filter({ store_id: store.id }, '-updated_date', 25),
        base44.entities.Customer.filter({ store_id: store.id }, '-updated_date', 25),
      ]);
      const merged = [
        ...(products || []).map((p) => ({ type: 'product', id: p.id, label: p.title || 'Produit', at: p.updated_date, created: p.created_date, isNew: p.created_date === p.updated_date })),
        ...(orders || []).map((o) => ({ type: 'order', id: o.id, label: o.order_number || `Commande ${o.id.slice(0, 6)}`, at: o.updated_date, created: o.created_date, isNew: o.created_date === o.updated_date })),
        ...(customers || []).map((c) => ({ type: 'customer', id: c.id, label: [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email || 'Client', at: c.updated_date, created: c.created_date, isNew: c.created_date === c.updated_date })),
      ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 40);
      setItems(merged);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const ICONS = { product: Package, order: ShoppingCart, customer: Users };
  const COLORS = { product: 'text-[#008060] bg-[#008060]/10', order: 'text-purple-600 bg-purple-500/10', customer: 'text-blue-600 bg-blue-500/10' };

  if (storeLoading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/dashboard" className="text-[#6D7175] hover:text-[#202223]"><ArrowLeft className="w-5 h-5" /></Link>
        <ActivityIcon className="w-5 h-5 text-[#008060]" />
        <h1 className="text-xl font-bold text-[#202223]">Activité récente</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-10 text-center text-sm text-[#6D7175]">Aucune activité enregistrée pour le moment.</div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E1E1E1] divide-y divide-[#F4F4F4]">
          {items.map((it, i) => {
            const Icon = ICONS[it.type];
            return (
              <div key={it.id + i} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${COLORS[it.type]}`}><Icon className="w-4 h-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#202223] truncate">{it.label}</p>
                  <p className="text-[11px] text-[#6D7175]">{it.isNew ? 'Créé' : 'Modifié'}</p>
                </div>
                <span className="text-[11px] text-[#6D7175] shrink-0">{relTime(it.at)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}