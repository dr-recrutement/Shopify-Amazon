import { useState, useEffect, useCallback, useMemo } from 'react';
import { Package, AlertTriangle, Loader2, Search, TrendingDown, Boxes, ArrowUpDown, X, BellRing } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { formatMoney } from '@/lib/world/currencies';

const LOW_THRESHOLD = 5;

export default function Inventory() {
  const { store, loading } = useCurrentStore();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [adjusting, setAdjusting] = useState(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setProducts(await base44.entities.Product.filter({ store_id: store.id }, '-created_date', 500));
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const flat = useMemo(() => {
    const rows = [];
    products.forEach((p) => {
      if (p.variants?.length) {
        p.variants.forEach((v, i) => rows.push({ id: p.id, variantIndex: i, title: p.title, variantTitle: v.title || 'Défaut', sku: v.sku || p.sku || '—', stock: v.stock ?? 0, price: v.price ?? p.price, track: p.track_inventory }));
      } else {
        rows.push({ id: p.id, variantIndex: -1, title: p.title, variantTitle: '—', sku: p.sku || '—', stock: p.stock ?? 0, price: p.price, track: p.track_inventory });
      }
    });
    return rows;
  }, [products]);

  const filtered = useMemo(() => {
    return flat.filter((r) => {
      const m = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.sku.toLowerCase().includes(search.toLowerCase());
      const f = filter === 'low' ? r.stock > 0 && r.stock <= LOW_THRESHOLD : filter === 'out' ? r.stock <= 0 : filter === 'ok' ? r.stock > LOW_THRESHOLD : true;
      return m && f;
    });
  }, [flat, search, filter]);

  const stats = useMemo(() => ({
    total: flat.length,
    low: flat.filter((r) => r.stock > 0 && r.stock <= LOW_THRESHOLD).length,
    out: flat.filter((r) => r.stock <= 0).length,
    value: flat.reduce((s, r) => s + (r.stock * (r.price || 0)), 0),
  }), [flat]);

  const adjustStock = async (row, delta) => {
    setAdjusting(row.id + row.variantIndex);
    try {
      const prod = products.find((p) => p.id === row.id);
      if (!prod) return;
      if (row.variantIndex >= 0 && prod.variants) {
        const updated = [...prod.variants];
        updated[row.variantIndex] = { ...updated[row.variantIndex], stock: Math.max(0, (updated[row.variantIndex].stock || 0) + delta) };
        await base44.entities.Product.update(row.id, { variants: updated });
      } else {
        await base44.entities.Product.update(row.id, { stock: Math.max(0, (prod.stock || 0) + delta) });
      }
      await load();
    } finally { setAdjusting(null); }
  };

  const setStockAbsolute = async (row, val) => {
    setAdjusting(row.id + row.variantIndex + 'set');
    try {
      const prod = products.find((p) => p.id === row.id);
      if (!prod) return;
      if (row.variantIndex >= 0 && prod.variants) {
        const updated = [...prod.variants];
        updated[row.variantIndex] = { ...updated[row.variantIndex], stock: Math.max(0, val) };
        await base44.entities.Product.update(row.id, { variants: updated });
      } else {
        await base44.entities.Product.update(row.id, { stock: Math.max(0, val) });
      }
      await load();
    } finally { setAdjusting(null); }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Boxes className="w-5 h-5 text-[#6D7175]" />
        <h1 className="text-xl font-bold text-[#202223]">Gestion des stocks</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><Package className="w-5 h-5 text-[#008060] mb-2" /><p className="text-2xl font-bold text-[#202223]">{stats.total}</p><p className="text-xs text-[#6D7175]">Références</p></div>
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><AlertTriangle className="w-5 h-5 text-amber-500 mb-2" /><p className="text-2xl font-bold text-[#202223]">{stats.low}</p><p className="text-xs text-[#6D7175]">Stock faible</p></div>
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><TrendingDown className="w-5 h-5 text-red-500 mb-2" /><p className="text-2xl font-bold text-[#202223]">{stats.out}</p><p className="text-xs text-[#6D7175]">Ruptures</p></div>
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><ArrowUpDown className="w-5 h-5 text-[#008060] mb-2" /><p className="text-2xl font-bold text-[#202223]">{formatMoney(stats.value, store?.currency)}</p><p className="text-xs text-[#6D7175]">Valeur stock</p></div>
      </div>

      {/* Low-stock alert banner */}
      {(stats.low > 0 || stats.out > 0) && !alertDismissed && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <BellRing className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">Alerte stock bas — action requise</p>
            <p className="text-xs text-amber-700 mt-1">
              {stats.out > 0 && <>{stats.out} produit(s) en rupture · </>}
              {stats.low > 0 && <>{stats.low} produit(s) sous le seuil critique (≤ {LOW_THRESHOLD}). </>}
              Réapprovisionnez pour éviter les ventes perdues.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {flat.filter((r) => r.stock <= LOW_THRESHOLD).slice(0, 6).map((r, i) => (
                <span key={i} className={`text-[11px] font-semibold px-2 py-1 rounded-full ${r.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                  {r.title} · {r.variantTitle !== '—' ? r.variantTitle + ' · ' : ''}{r.stock} restant(s)
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => setAlertDismissed(true)} className="text-amber-600 hover:text-amber-900 shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-[#E1E1E1] rounded-lg px-3 py-2 flex-1"><Search className="w-4 h-4 text-[#6D7175]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou SKU" className="outline-none text-sm w-full" /></div>
        <div className="flex gap-2">
          {[['all', 'Tous'], ['low', 'Stock faible'], ['out', 'Rupture'], ['ok', 'En stock']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`text-xs font-semibold px-3 py-2 rounded-full transition ${filter === k ? 'bg-[#008060] text-white' : 'bg-white border border-[#E1E1E1] text-[#6D7175] hover:bg-black/5'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F4F4F4] text-left text-xs text-[#6D7175]"><tr><th className="px-4 py-3 font-semibold">Produit</th><th className="px-4 py-3 font-semibold">Variante</th><th className="px-4 py-3 font-semibold">SKU</th><th className="px-4 py-3 font-semibold text-right">Stock</th><th className="px-4 py-3 font-semibold text-right">Ajustement</th></tr></thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-t border-[#E1E1E1] hover:bg-[#F4F4F4]">
                <td className="px-4 py-3 font-medium text-[#202223]">{r.title}</td>
                <td className="px-4 py-3 text-[#6D7175]">{r.variantTitle}</td>
                <td className="px-4 py-3 text-[#6D7175] font-mono text-xs">{r.sku}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-bold ${r.stock <= 0 ? 'text-red-600' : r.stock <= LOW_THRESHOLD ? 'text-amber-600' : 'text-[#202223]'}`}>{r.stock}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => adjustStock(r, -1)} disabled={adjusting === r.id + r.variantIndex} className="w-7 h-7 rounded-md border border-[#E1E1E1] text-[#6D7175] hover:bg-red-50 hover:text-red-600 disabled:opacity-40 font-bold">−</button>
                    <input type="number" defaultValue="" onBlur={(e) => { const v = e.target.value; if (v !== '') setStockAbsolute(r, +v); }} placeholder={String(r.stock)} className="w-16 text-center border border-[#E1E1E1] rounded-md py-1 text-xs" />
                    <button onClick={() => adjustStock(r, 1)} disabled={adjusting === r.id + r.variantIndex} className="w-7 h-7 rounded-md border border-[#E1E1E1] text-[#6D7175] hover:bg-[#008060]/10 hover:text-[#008060] disabled:opacity-40 font-bold">+</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#6D7175]">Aucune référence trouvée.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}