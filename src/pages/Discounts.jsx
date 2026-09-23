import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import DiscountForm from '@/components/admin/DiscountForm';
import { formatMoney } from '@/lib/world/currencies';
import { hasFeature } from '@/lib/plans';
import PaywallCard from '@/components/admin/PaywallCard';
import {
  Tag, Loader2, ArrowLeft, AlertCircle, Plus, Pencil, Trash2, Percent, DollarSign, Truck,
} from 'lucide-react';

const TYPE_STYLE = {
  percentage: { icon: Percent, label: (v) => `${v}%`, color: 'bg-[#6366F1]/10 text-[#6366F1]' },
  fixed_amount: { icon: DollarSign, label: (v, cur) => formatMoney(v, cur), color: 'bg-[#008060]/10 text-[#008060]' },
  free_shipping: { icon: Truck, label: () => 'Livraison', color: 'bg-[#0EA5E9]/10 text-[#0EA5E9]' },
};
const STATUS_STYLE = {
  active: 'bg-[#008060]/10 text-[#008060]',
  scheduled: 'bg-[#0EA5E9]/10 text-[#0EA5E9]',
  disabled: 'bg-[#E1E1E1] text-[#6D7175]',
  expired: 'bg-[#FF5F57]/10 text-[#FF5F57]',
};
const STATUS_LABEL = { active: 'Active', scheduled: 'Programmée', disabled: 'Désactivée', expired: 'Expirée' };

export default function Discounts() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('tenant_id', store.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      const now = Date.now();
      setDiscounts((data || []).map((row) => ({
        ...row,
        type: row.discount_type,
        min_order_amount: (row.min_amount_cents || 0) / 100,
        usage_limit: row.max_uses || 0,
        status: !row.is_active ? 'disabled'
          : (row.ends_at && new Date(row.ends_at).getTime() < now) ? 'expired'
          : (row.starts_at && new Date(row.starts_at).getTime() > now) ? 'scheduled'
          : 'active',
      })));
    } catch (e) {
      console.error('Failed to load discounts:', e);
      setDiscounts([]);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const remove = async (d) => {
    if (!confirm(`Supprimer le code « ${d.code} » ?`)) return;
    const { error } = await supabase.from('discount_codes').delete().eq('id', d.id);
    if (error) { alert(error.message); return; }
    setDiscounts((l) => l.filter((x) => x.id !== d.id));
  };

  if (storeLoading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Créez d'abord votre boutique</h1>
        <Link to="/onboarding" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#00694d] mt-3">Configurer ma boutique</Link>
      </div>
    );
  }
  if (!hasFeature(store.plan, 'discounts')) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <PaywallCard requiredPlan="growth" title="Les codes promo nécessitent le plan Growth" description="Créez des réductions et codes promo pour booster vos ventes. Passez au plan Growth ou supérieur pour y accéder." />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F4F4F4]">
      <div className="sticky top-0 z-10 bg-white border-b border-[#E1E1E1] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="text-[#6D7175] hover:text-[#202223]"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-base font-bold text-[#202223] flex items-center gap-2"><Tag className="w-4 h-4 text-[#008060]" /> Réductions</h1>
            <p className="text-xs text-[#6D7175]">{store.name} · {discounts.length} code(s)</p>
          </div>
        </div>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-3 sm:px-4 py-2 rounded-md hover:bg-[#00694d] shrink-0">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>

      <div className="px-4 sm:px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>
        ) : discounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-[#E1E1E1]">
            <Tag className="w-10 h-10 text-[#C9C9C9] mb-2" />
            <p className="text-sm font-medium text-[#202223]">Aucune réduction</p>
            <p className="text-xs text-[#6D7175] mt-1 mb-4">Créez des codes promo pour booster vos ventes.</p>
            <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#00694d]"><Plus className="w-4 h-4" /> Créer une réduction</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {discounts.map((d) => {
              const t = TYPE_STYLE[d.type] || TYPE_STYLE.percentage;
              const TI = t.icon;
              return (
                <div key={d.id} className="bg-white rounded-xl border border-[#E1E1E1] p-4 group hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.color}`}><TI className="w-4 h-4" /></div>
                      <div>
                        <p className="text-sm font-bold font-mono text-[#202223]">{d.code}</p>
                        <p className="text-[11px] text-[#6D7175]">{t.label(d.value, store.currency)}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLE[d.status] || STATUS_STYLE.active}`}>{STATUS_LABEL[d.status] || d.status}</span>
                  </div>
                  <div className="mt-3 space-y-0.5 text-[11px] text-[#6D7175]">
                    {d.min_order_amount > 0 && <p>Min. : {formatMoney(d.min_order_amount, store.currency)}</p>}
                    <p>Utilisé : {d.used_count || 0}{d.usage_limit > 0 ? ` / ${d.usage_limit}` : ' (illimité)'}</p>
                    {d.ends_at && <p>Expire le {new Date(d.ends_at).toLocaleDateString('fr-FR')}</p>}
                  </div>
                  <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => { setEditing(d); setFormOpen(true); }} className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium text-[#6D7175] border border-[#E1E1E1] rounded py-1 hover:bg-black/5"><Pencil className="w-3 h-3" /> Éditer</button>
                    <button onClick={() => remove(d)} className="flex items-center justify-center px-2 text-[#6D7175] border border-[#E1E1E1] rounded hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DiscountForm open={formOpen} onOpenChange={setFormOpen} store={store} discount={editing} onSaved={load} />
    </div>
  );
}