import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import ProductForm from '@/components/admin/ProductForm';
import { formatMoney } from '@/lib/world/currencies';
import { getFeatureValue } from '@/lib/plans';
import Papa from 'papaparse';
import {
  Plus, Search, Loader2, Package, Pencil, Trash2, ArrowLeft, AlertCircle, Upload,
} from 'lucide-react';

const STATUS_STYLE = {
  active: 'bg-[#008060]/10 text-[#008060]',
  draft: 'bg-[#E1E1E1] text-[#6D7175]',
  archived: 'bg-[#FF5F57]/10 text-[#FF5F57]',
};
const STATUS_LABEL = { active: 'Actif', draft: 'Brouillon', archived: 'Archivé' };

export default function Products() {
  const { t } = useTranslation();
  const { store, loading: storeLoading } = useCurrentStore();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const productLimit = store ? getFeatureValue(store.plan, 'products') : Infinity;
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState(() => new URLSearchParams(window.location.search).get('q') || '');
  const [status, setStatus] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', store.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      // price_cents/name -> the price/title field names this page (and
      // ProductForm) already read; metafields carries the extra attributes
      // (vendor, product_type, tags, barcode, weight, track_inventory) that
      // have no dedicated column on the native `products` table yet.
      setProducts((data || []).map((row) => ({
        ...row,
        title: row.name,
        price: (row.price_cents || 0) / 100,
        compare_at_price: (row.compare_at_price_cents || 0) / 100,
        cost_price: row.cost_price_cents ? row.cost_price_cents / 100 : '',
        ...(row.metafields || {}),
      })));
    } catch (e) {
      console.error('Failed to load products:', e);
      setProducts([]);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const uq = new URLSearchParams(location.search).get('q');
    if (uq != null) setQ(uq);
  }, [location.search]);

  const filtered = products.filter((p) => {
    if (status !== 'all' && p.status !== status) return false;
    if (q && !(`${p.title} ${p.vendor || ''} ${p.sku || ''}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [importResult, setImportResult] = useState(null);

  // Real CSV import - the practical need for dropshippers importing a
  // supplier's product catalog rather than re-typing each item one at a
  // time. Expected headers (case-insensitive, extras ignored): name,
  // price, description, cost_price, sku, stock, images (semicolon- or
  // comma-separated URLs), supplier_name, supplier_url.
  const importCsv = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        if (rows.length === 0) { setImportResult({ ok: 0, failed: 0, errors: ['Fichier vide ou illisible.'] }); return; }
        const limit = productLimit;
        const remaining = Number.isFinite(limit) ? Math.max(0, limit - products.length) : rows.length;
        if (remaining < rows.length) {
          setImportResult({ ok: 0, failed: rows.length, errors: [`Limite de plan atteinte : ${remaining} produit(s) seulement peuvent être ajoutés.`] });
          return;
        }
        setImporting(true);
        setImportProgress({ done: 0, total: rows.length });
        let ok = 0; const errors = [];
        const findCol = (row, ...names) => {
          const key = Object.keys(row).find((k) => names.includes(k.trim().toLowerCase()));
          return key ? row[key] : undefined;
        };
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const name = findCol(row, 'name', 'title', 'nom')?.trim();
          const priceRaw = findCol(row, 'price', 'prix');
          if (!name || !priceRaw) { errors.push(`Ligne ${i + 2} : nom ou prix manquant`); setImportProgress({ done: i + 1, total: rows.length }); continue; }
          const imagesRaw = findCol(row, 'images', 'image') || '';
          const costRaw = findCol(row, 'cost_price', 'prix_coutant', 'cost');
          try {
            const { error } = await supabase.from('products').insert({
              tenant_id: store.id,
              name,
              description: findCol(row, 'description') || '',
              price_cents: Math.round(parseFloat(priceRaw) * 100) || 0,
              cost_price_cents: costRaw ? Math.round(parseFloat(costRaw) * 100) : null,
              sku: findCol(row, 'sku') || '',
              stock: parseInt(findCol(row, 'stock', 'quantity', 'quantite'), 10) || 0,
              images: imagesRaw.split(/[;,]/).map((s) => s.trim()).filter(Boolean),
              supplier_name: findCol(row, 'supplier_name', 'fournisseur') || null,
              supplier_url: findCol(row, 'supplier_url', 'lien_fournisseur') || null,
              status: 'draft',
              currency: store.currency,
            });
            if (error) throw error;
            ok++;
          } catch (e) {
            errors.push(`Ligne ${i + 2} (${name}) : ${e.message}`);
          }
          setImportProgress({ done: i + 1, total: rows.length });
        }
        setImporting(false);
        setImportResult({ ok, failed: errors.length, errors });
        if (ok > 0) load();
      },
      error: (err) => setImportResult({ ok: 0, failed: 1, errors: [err.message] }),
    });
  };

  const openEdit = (p) => { setEditing(p); setFormOpen(true); };
  const remove = async (p) => {
    if (!confirm(`Supprimer « ${p.title} » ?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) { alert(error.message); return; }
    setProducts((l) => l.filter((x) => x.id !== p.id));
  };

  if (storeLoading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  }

  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Créez d'abord votre boutique</h1>
        <p className="text-sm text-[#6D7175] mt-1 mb-4">Vous devez configurer une boutique avant d'ajouter des produits.</p>
        <Link to="/onboarding" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#00694d]">Configurer ma boutique</Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F4F4F4]">
      <div className="sticky top-0 z-10 bg-white border-b border-[#E1E1E1] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="text-[#6D7175] hover:text-[#202223]"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-[#202223] flex items-center gap-2"><Package className="w-4 h-4 text-[#008060]" /> {t('products.title')}</h1>
            <p className="text-xs text-[#6D7175] truncate">
              {store.name} · {store.currency}
              {Number.isFinite(productLimit) && <span className={products.length >= productLimit ? 'text-red-500 font-semibold' : ''}> · {products.length}/{productLimit} produits</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 bg-white border border-[#E1E1E1] text-[#202223] text-sm font-medium px-3 sm:px-4 py-2 rounded-md hover:bg-black/5 cursor-pointer">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} <span className="hidden sm:inline">{importing ? `${t('products.import_csv')}… ${importProgress.done}/${importProgress.total}` : t('products.import_csv')}</span>
            <input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ''; }} disabled={importing} />
          </label>
          <button onClick={openNew} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-3 sm:px-4 py-2 rounded-md hover:bg-[#00694d]">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t('products.add')}</span>
          </button>
        </div>
      </div>
      {importResult && (
        <div className={`px-4 sm:px-6 py-2.5 text-xs border-b ${importResult.failed > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-[#008060]/5 border-[#008060]/20 text-[#008060]'}`}>
          {importResult.ok} produit(s) importé(s){importResult.failed > 0 ? `, ${importResult.failed} échec(s)` : ''}.
          {importResult.errors?.length > 0 && <span> {importResult.errors.slice(0, 2).join(' · ')}</span>}
        </div>
      )}

      <div className="px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex items-center gap-2 bg-white border border-[#E1E1E1] rounded-md px-3 flex-1">
            <Search className="w-4 h-4 text-[#6D7175]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('products.search_placeholder')} className="w-full bg-transparent py-2 text-sm outline-none" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-white border border-[#E1E1E1] rounded-md px-3 py-2 text-sm">
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="draft">Brouillons</option>
            <option value="archived">Archivés</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="w-10 h-10 text-[#C9C9C9] mb-2" />
              <p className="text-sm font-medium text-[#202223]">{t('products.empty')}</p>
              <p className="text-xs text-[#6D7175] mt-1 mb-4">Commencez par ajouter votre premier produit.</p>
              <button onClick={openNew} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#00694d]"><Plus className="w-4 h-4" /> {t('products.add_product')}</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAFAFA] text-[11px] font-semibold text-[#6D7175] uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5">{t('products.col_product')}</th>
                  <th className="text-left px-4 py-2.5 hidden sm:table-cell">{t('products.col_status')}</th>
                  <th className="text-left px-4 py-2.5 hidden md:table-cell">{t('products.col_stock')}</th>
                  <th className="text-right px-4 py-2.5">{t('products.col_price')}</th>
                  <th className="text-right px-4 py-2.5 hidden lg:table-cell">{t('products.col_margin')}</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E1E1]">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-[#F4F4F4] border border-[#E1E1E1] overflow-hidden shrink-0">
                          {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-[#C9C9C9] m-auto mt-2.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#202223] truncate">{p.title}</p>
                          <p className="text-[11px] text-[#6D7175] truncate">{p.sku || p.product_type || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[p.status] || STATUS_STYLE.draft}`}>{t(`products.status_${p.status}`, STATUS_LABEL[p.status] || p.status)}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[#6D7175]">
                      {(p.variants || []).length ? `${p.variants.length} ${t('products.variants')}` : (p.track_inventory ? t('products.tracked') : '—')}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#202223]">
                      {formatMoney(p.price, p.currency || store.currency)}
                      {p.compare_at_price > 0 && <span className="block text-[11px] text-[#6D7175] line-through font-normal">{formatMoney(p.compare_at_price, p.currency || store.currency)}</span>}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      {p.cost_price > 0 ? (
                        <span className={`text-xs font-semibold ${p.price - p.cost_price >= 0 ? 'text-[#008060]' : 'text-red-600'}`}>
                          {formatMoney(p.price - p.cost_price, p.currency || store.currency)}
                          <span className="block text-[10px] font-normal text-[#6D7175]">{p.price > 0 ? (((p.price - p.cost_price) / p.price) * 100).toFixed(0) : 0}%</span>
                        </span>
                      ) : <span className="text-[11px] text-[#6D7175]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded text-[#6D7175] hover:bg-black/5"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => remove(p)} className="p-1.5 rounded text-[#6D7175] hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      <ProductForm open={formOpen} onOpenChange={setFormOpen} store={store} product={editing} onSaved={load} />
    </div>
  );
}