import { useEffect, useState, useRef, useCallback } from 'react';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader, Badge, Button, Input, Modal } from './ui';
import {
  Plus, Package, Search, Pencil, Trash2, Image as ImageIcon, Upload, X,
  Star, ChevronUp, ChevronDown, FolderPlus, Folder, FolderTree, Loader2,
  AlertTriangle, CheckCircle2, Tag,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type ProductStatus = 'active' | 'draft' | 'archived';

interface Product {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  stock: number;
  status: ProductStatus;
  sku: string | null;
  compare_at_price_cents: number | null;
  created_at: string;
  images?: string[];
}

interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  position: number;
  created_at: string;
}

interface ProductCategory {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  parent_category_id: string | null;
  slug: string | null;
  position: number;
  created_at: string;
}

interface CategoryAssignment {
  id: string;
  product_id: string;
  category_id: string;
}

interface ProductWithMeta extends Product {
  thumbnail?: string | null;
  categoryNames: string[];
  categoryIds: string[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const CURRENCY_LABEL: Record<string, string> = {
  XOF: 'FCFA',
  XAF: 'FCFA',
  EUR: '€',
  USD: '$',
  GBP: '£',
};

const fmtMoney = (cents: number | null, currency = 'XOF') => {
  const c = cents ?? 0;
  const sym = CURRENCY_LABEL[currency] ?? currency;
  return `${c.toLocaleString('fr-FR')} ${sym}`;
};

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Compress / resize an image file client-side before upload.
 * Max width 800px, JPEG quality 0.8.
 */
async function compressImage(file: File, maxW = 800, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Le fichier n’est pas une image.'));
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = img.width > maxW ? maxW / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('Canvas non supporté')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error('Échec de la compression'));
        },
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image invalide')); };
    img.src = url;
  });
}

const randomId = () => Math.random().toString(36).slice(2, 10);
const uniqueFileName = (ext = 'jpg') => `${Date.now()}-${randomId()}.${ext}`;

/* ------------------------------------------------------------------ */
/* Pending image (before upload / before product exists)              */
/* ------------------------------------------------------------------ */

interface PendingImage {
  id: string;       // local id
  file: File;
  previewUrl: string;
  uploading: boolean;
  progress: number; // 0..100
  error?: string;
  remoteUrl?: string; // set after upload
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

type Tab = 'products' | 'categories';

export default function Products() {
  const { tenant } = useTenant();
  const [tab, setTab] = useState<Tab>('products');

  return (
    <div>
      <PageHeader
        title="Produits"
        subtitle="Gérez votre catalogue, les images et les catégories"
        action={
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <TabButton active={tab === 'products'} onClick={() => setTab('products')} icon={<Package size={15} />}>Produits</TabButton>
            <TabButton active={tab === 'categories'} onClick={() => setTab('categories')} icon={<FolderTree size={15} />}>Catégories</TabButton>
          </div>
        }
      />
      {tab === 'products' ? <ProductsTab tenantId={tenant?.id} currency={tenant?.currency} /> : <CategoriesTab tenantId={tenant?.id} />}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${active ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
      {icon}{children}
    </button>
  );
}

/* ================================================================== */
/* PRODUCTS TAB                                                        */
/* ================================================================== */

function ProductsTab({ tenantId, currency }: { tenantId?: string; currency?: string }) {
  const [products, setProducts] = useState<ProductWithMeta[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductWithMeta | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ProductWithMeta | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data: prods, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const list = (prods as Product[]) || [];

      if (list.length === 0) { setProducts([]); return; }

      const ids = list.map((p) => p.id);

      // Images
      const { data: imgs } = await supabase
        .from('product_images')
        .select('id,product_id,url,position')
        .in('product_id', ids)
        .order('position', { ascending: true });
      const imgRows = (imgs as ProductImage[]) || [];
      const imgByProduct: Record<string, ProductImage[]> = {};
      imgRows.forEach((im) => {
        (imgByProduct[im.product_id] ||= []).push(im);
      });

      // Category assignments
      const { data: assigns } = await supabase
        .from('product_category_assignments')
        .select('id,product_id,category_id')
        .in('product_id', ids);
      const assignRows = (assigns as CategoryAssignment[]) || [];
      const catByProduct: Record<string, string[]> = {};
      assignRows.forEach((a) => { (catByProduct[a.product_id] ||= []).push(a.category_id); });

      // Categories (names)
      const allCatIds = Array.from(new Set(assignRows.map((a) => a.category_id)));
      const { data: cats } = await supabase
        .from('product_categories')
        .select('id,name')
        .in('id', allCatIds.length ? allCatIds : ['00000000-0000-0000-0000-000000000000']);
      const catRows = (cats as Pick<ProductCategory, 'id' | 'name'>[]) || [];
      const catName: Record<string, string> = {};
      catRows.forEach((c) => { catName[c.id] = c.name; });

      const merged: ProductWithMeta[] = list.map((p) => {
        const imgs = imgByProduct[p.id] || [];
        const cIds = catByProduct[p.id] || [];
        return {
          ...p,
          thumbnail: imgs[0]?.url ?? p.images?.[0] ?? null,
          categoryIds: cIds,
          categoryNames: cIds.map((id) => catName[id]).filter(Boolean),
        };
      });
      setProducts(merged);
    } catch (e) {
      console.error('load products', e);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const filtered = search.trim()
    ? products.filter((p) => {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q)
          || (p.sku || '').toLowerCase().includes(q)
          || p.categoryNames.some((c) => c.toLowerCase().includes(q));
      })
    : products;

  const openNew = () => { setEditing(null); setShowModal(true); };
  const openEdit = (p: ProductWithMeta) => { setEditing(p); setShowModal(true); };

  return (
    <>
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit, SKU, catégorie…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" />
          </div>
          <Button onClick={openNew}><Plus size={16} /> Nouveau produit</Button>
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm py-12 text-center flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Package size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Aucun produit. Cliquez sur « Nouveau produit » pour en créer un.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-medium">Image</th>
                  <th className="pb-3 font-medium">Nom</th>
                  <th className="pb-3 font-medium">Prix</th>
                  <th className="pb-3 font-medium">Stock</th>
                  <th className="pb-3 font-medium">Catégorie</th>
                  <th className="pb-3 font-medium">Statut</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 pr-2">
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                        {p.thumbnail
                          ? <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                          : <ImageIcon size={16} className="text-gray-300" />}
                      </div>
                    </td>
                    <td className="py-3 font-medium text-gray-900">
                      {p.name}
                      {p.sku && <div className="text-xs text-gray-400 font-normal">SKU: {p.sku}</div>}
                    </td>
                    <td className="py-3 text-gray-900 whitespace-nowrap">
                      {fmtMoney(p.price_cents, p.currency || currency)}
                      {p.compare_at_price_cents != null && p.compare_at_price_cents > p.price_cents && (
                        <div className="text-xs text-gray-400 line-through font-normal">{fmtMoney(p.compare_at_price_cents, p.currency || currency)}</div>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={p.stock <= 0 ? 'text-red-600 font-medium' : p.stock < 5 ? 'text-orange-600 font-medium' : 'text-gray-700'}>{p.stock}</span>
                    </td>
                    <td className="py-3 text-gray-600">
                      {p.categoryNames.length ? (
                        <div className="flex flex-wrap gap-1">{p.categoryNames.map((c) => <Badge key={c} color="blue">{c}</Badge>)}</div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3"><StatusBadge status={p.status} /></td>
                    <td className="py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-brand-600" title="Modifier">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setConfirmDelete(p)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-500 hover:text-red-600" title="Supprimer">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <ProductModal
          tenantId={tenantId!}
          currency={currency || 'XOF'}
          editing={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}

      {confirmDelete && (
        <DeleteConfirm
          product={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onDeleted={() => { setConfirmDelete(null); load(); }}
        />
      )}
    </>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const map: Record<ProductStatus, { color: 'green' | 'gray' | 'orange'; label: string }> = {
    active: { color: 'green', label: 'Actif' },
    draft: { color: 'gray', label: 'Brouillon' },
    archived: { color: 'orange', label: 'Archivé' },
  };
  const { color, label } = map[status] || map.draft;
  return <Badge color={color}>{label}</Badge>;
}

/* ================================================================== */
/* DELETE CONFIRM                                                      */
/* ================================================================== */

function DeleteConfirm({ product, onCancel, onDeleted }: { product: ProductWithMeta; onCancel: () => void; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const doDelete = async () => {
    setBusy(true); setErr(null);
    try {
      // Delete images rows + storage objects
      const { data: imgs } = await supabase.from('product_images').select('url').eq('product_id', product.id);
      const urls = ((imgs as { url: string }[]) || []).map((i) => i.url);
      if (urls.length) {
        const paths = urls.map((u) => {
          try { return decodeURIComponent(u.split('/product-images/')[1] || ''); } catch { return ''; }
        }).filter(Boolean);
        if (paths.length) await supabase.storage.from('product-images').remove(paths);
      }
      await supabase.from('product_images').delete().eq('product_id', product.id);
      await supabase.from('product_category_assignments').delete().eq('product_id', product.id);
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (error) throw error;
      onDeleted();
    } catch (e: any) {
      setErr(e.message || 'Erreur lors de la suppression');
    } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onCancel} title="Supprimer le produit" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <p className="text-sm text-gray-600">
            Voulez-vous vraiment supprimer <span className="font-semibold text-gray-900">{product.name}</span> ? Cette action est irréversible et supprimera aussi ses images.
          </p>
        </div>
        {err && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{err}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>Annuler</Button>
          <Button variant="danger" onClick={doDelete} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Supprimer
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ================================================================== */
/* PRODUCT MODAL (Add / Edit)                                         */
/* ================================================================== */

interface FormState {
  name: string;
  description: string;
  price: string;            // in major units (e.g. FCFA)
  compareAt: string;
  stock: string;
  sku: string;
  status: ProductStatus;
  categoryIds: string[];
}

function ProductModal({ tenantId, currency, editing, onClose, onSaved }: {
  tenantId: string; currency: string; editing: ProductWithMeta | null; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => ({
    name: editing?.name || '',
    description: editing?.description || '',
    price: editing?.price_cents ? String(Math.round(editing.price_cents)) : '',
    compareAt: editing?.compare_at_price_cents ? String(Math.round(editing.compare_at_price_cents)) : '',
    stock: editing?.stock != null ? String(editing.stock) : '0',
    sku: editing?.sku || '',
    status: editing?.status || 'active',
    categoryIds: editing?.categoryIds || [],
  }));
  const [pending, setPending] = useState<PendingImage[]>([]);   // new images (not yet saved to DB)
  const [savedImages, setSavedImages] = useState<ProductImage[]>([]); // existing DB images
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load categories + existing images
  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from('product_categories').select('*').eq('tenant_id', tenantId).order('name');
      setCategories((cats as ProductCategory[]) || []);
      if (editing) {
        const { data: imgs } = await supabase.from('product_images').select('*').eq('product_id', editing.id).order('position', { ascending: true });
        setSavedImages((imgs as ProductImage[]) || []);
      }
    })();
  }, [tenantId, editing]);

  // Cleanup preview URLs on unmount
  useEffect(() => () => { pending.forEach((p) => URL.revokeObjectURL(p.previewUrl)); }, [pending]);

  const set = (k: keyof FormState, v: any) => setForm((f) => ({ ...f, [k]: v }));

  /* ---- image handling ---- */

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (arr.length === 0) return;
    const newPending: PendingImage[] = arr.map((file) => ({
      id: randomId(),
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: false,
      progress: 0,
    }));
    setPending((p) => [...p, ...newPending]);

    // Upload each immediately to storage; store remoteUrl on the pending item.
    for (const item of newPending) {
      await uploadPending(item.id, item.file);
    }
  }, []);

  const uploadPending = async (localId: string, file: File) => {
    setPending((prev) => prev.map((p) => p.id === localId ? { ...p, uploading: true, progress: 5, error: undefined } : p));
    try {
      const blob = await compressImage(file);
      const path = `${tenantId}/${uniqueFileName('jpg')}`;
      // Simulate progress while uploading (Supabase JS client doesn't expose per-file progress)
      let prog = 10;
      const tick = setInterval(() => {
        prog = Math.min(prog + 15, 85);
        setPending((prev) => prev.map((p) => p.id === localId ? { ...p, progress: prog } : p));
      }, 250);
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      clearInterval(tick);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path);
      setPending((prev) => prev.map((p) => p.id === localId ? { ...p, uploading: false, progress: 100, remoteUrl: pub.publicUrl } : p));
    } catch (e: any) {
      setPending((prev) => prev.map((p) => p.id === localId ? { ...p, uploading: false, progress: 0, error: e.message || 'Échec upload' } : p));
    }
  };

  const removePending = (id: string) => {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const removeSaved = async (img: ProductImage) => {
    // remove from storage
    try {
      const path = decodeURIComponent(img.url.split('/product-images/')[1] || '');
      if (path) {
        const { error: storageErr } = await supabase.storage.from('product-images').remove([path]);
        if (storageErr) console.error('[Products] Erreur suppression fichier storage:', storageErr);
      }
    } catch (e) { console.error('[Products] Exception suppression fichier storage:', e); }
    const { error: dbErr } = await supabase.from('product_images').delete().eq('id', img.id);
    if (dbErr) {
      console.error('[Products] Erreur suppression ligne product_images:', dbErr);
      alert(`Impossible de supprimer cette image : ${dbErr.message}`);
      return;
    }
    setSavedImages((prev) => prev.filter((i) => i.id !== img.id));
  };

  const movePending = (id: string, dir: -1 | 1) => {
    setPending((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const moveSaved = async (img: ProductImage, dir: -1 | 1) => {
    setSavedImages((prev) => {
      const i = prev.findIndex((x) => x.id === img.id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      // persist new positions
      copy.forEach((im, idx) => { supabase.from('product_images').update({ position: idx }).eq('id', im.id); });
      return copy;
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  /* ---- save ---- */

  const save = async () => {
    setErr(null);
    if (!form.name.trim()) { setErr('Le nom est obligatoire.'); return; }
    const priceCents = Math.round(Number(form.price) || 0);
    const compareCents = form.compareAt ? Math.round(Number(form.compareAt)) : null;
    const stock = Math.max(0, Math.round(Number(form.stock) || 0));
    setBusy(true);
    try {
      const payload = {
        tenant_id: tenantId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        price_cents: priceCents,
        compare_at_price_cents: compareCents,
        currency,
        stock,
        sku: form.sku.trim() || null,
        status: form.status,
      };

      let productId = editing?.id;
      let isNew = false;

      if (editing) {
        const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select('id').single();
        if (error) throw error;
        productId = (data as { id: string }).id;
        isNew = true;
      }

      // Persist pending images
      const uploaded = pending.filter((p) => p.remoteUrl && !p.error);
      if (uploaded.length) {
        const startIdx = savedImages.length;
        const rows = uploaded.map((p, idx) => ({
          product_id: productId,
          url: p.remoteUrl!,
          position: startIdx + idx,
        }));
        const { error: imgErr } = await supabase.from('product_images').insert(rows);
        if (imgErr) throw imgErr;
        // Also mirror into products.images array (legacy field) for convenience
        const allUrls = [...savedImages.map((i) => i.url), ...uploaded.map((p) => p.remoteUrl!)];
        await supabase.from('products').update({ images: allUrls }).eq('id', productId);
      } else if (isNew) {
        await supabase.from('products').update({ images: [] }).eq('id', productId);
      }

      // Reconcile saved images positions
      savedImages.forEach((im, idx) => {
        supabase.from('product_images').update({ position: idx }).eq('id', im.id);
      });

      // Categories: replace assignments
      await supabase.from('product_category_assignments').delete().eq('product_id', productId);
      if (form.categoryIds.length) {
        const assigns = form.categoryIds.map((cid) => ({ product_id: productId, category_id: cid }));
        const { error: catErr } = await supabase.from('product_category_assignments').insert(assigns);
        if (catErr) throw catErr;
      }

      onSaved();
    } catch (e: any) {
      setErr(e.message || 'Erreur lors de l’enregistrement');
    } finally { setBusy(false); }
  };

  /* ---- render ---- */

  return (
    <Modal open onClose={onClose} title={editing ? 'Modifier le produit' : 'Nouveau produit'} maxWidth="max-w-2xl">
      <div className="space-y-5">
        {err && <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-2.5 flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{err}</div>}

        <Input label="Nom du produit *" value={form.name} onChange={(v) => set('name', v)} placeholder="Ex: Tissu pagne premium" />

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Description du produit…"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 resize-y" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label={`Prix (${CURRENCY_LABEL[currency] || currency})`} type="number" value={form.price} onChange={(v) => set('price', v)} placeholder="0" />
          <Input label="Prix barré (optionnel)" type="number" value={form.compareAt} onChange={(v) => set('compareAt', v)} placeholder="0" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Stock" type="number" value={form.stock} onChange={(v) => set('stock', v)} placeholder="0" />
          <Input label="SKU (optionnel)" value={form.sku} onChange={(v) => set('sku', v)} placeholder="REF-001" />
        </div>

        {/* Category multi-select */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Catégories</label>
          {categories.length === 0 ? (
            <p className="text-xs text-gray-400">Aucune catégorie. Créez-en dans l’onglet Catégories.</p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {categories.map((c) => {
                const selected = form.categoryIds.includes(c.id);
                return (
                  <button key={c.id} type="button" onClick={() => set('categoryIds', selected ? form.categoryIds.filter((x) => x !== c.id) : [...form.categoryIds, c.id])}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${selected ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300'}`}>
                    {c.parent_category_id && <span className="opacity-60">↳</span>}{c.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
          <div className="inline-flex rounded-lg border border-gray-200 p-1">
            {(['active', 'draft', 'archived'] as ProductStatus[]).map((s) => (
              <button key={s} type="button" onClick={() => set('status', s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md ${form.status === s ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {s === 'active' ? 'Actif' : s === 'draft' ? 'Brouillon' : 'Archivé'}
              </button>
            ))}
          </div>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Images du produit</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragOver ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'}`}
          >
            <Upload size={22} className="mx-auto text-gray-400 mb-1.5" />
            <p className="text-sm text-gray-600 font-medium">Glissez-déposez vos images ici</p>
            <p className="text-xs text-gray-400 mt-0.5">ou cliquez pour parcourir · JPG/PNG/WebP · max 800px, compression auto</p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }} />
          </div>

          {/* Image grid (saved + pending) */}
          {(savedImages.length > 0 || pending.length > 0) && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
              {savedImages.map((img, idx) => (
                <ImageTile key={img.id} url={img.url} isMain={idx === 0} label="Enregistrée"
                  onUp={() => moveSaved(img, -1)} onDown={() => moveSaved(img, 1)}
                  onRemove={() => removeSaved(img)} canUp={idx > 0} canDown={idx < savedImages.length - 1} />
              ))}
              {pending.map((p, idx) => (
                <ImageTile key={p.id} url={p.previewUrl} isMain={idx === 0 && savedImages.length === 0}
                  uploading={p.uploading} progress={p.progress} error={p.error}
                  onUp={() => movePending(p.id, -1)} onDown={() => movePending(p.id, 1)}
                  onRemove={() => removePending(p.id)}
                  canUp={idx > 0} canDown={idx < pending.length - 1}
                  canRemove />
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1"><Star size={11} className="text-brand-500" /> La première image est l’image principale.</p>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={busy}>Annuler</Button>
          <Button onClick={save} disabled={busy || pending.some((p) => p.uploading)}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {editing ? 'Enregistrer' : 'Créer le produit'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ImageTile({ url, isMain, uploading, progress, error, onUp, onDown, onRemove, canUp, canDown, canRemove = true, label }: {
  url: string; isMain?: boolean; uploading?: boolean; progress?: number; error?: string;
  onUp: () => void; onDown: () => void; onRemove: () => void;
  canUp: boolean; canDown: boolean; canRemove?: boolean; label?: string;
}) {
  return (
    <div className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
      <img src={url} alt="" className="w-full h-full object-cover" />
      {isMain && (
        <div className="absolute top-1 left-1 bg-brand-500 text-white rounded-full px-1.5 py-0.5 text-[10px] font-semibold flex items-center gap-0.5 shadow">
          <Star size={9} /> Principale
        </div>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
          <Loader2 size={18} className="animate-spin mb-1" />
          <div className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all" style={{ width: `${progress || 0}%` }} />
          </div>
          <span className="text-[10px] mt-1">{progress}%</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white text-[10px] text-center p-1">{error}</div>
      )}
      {/* Controls */}
      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {canRemove && (
          <button onClick={onRemove} className="w-6 h-6 rounded-md bg-black/60 text-white hover:bg-red-600 flex items-center justify-center" title="Supprimer">
            <X size={12} />
          </button>
        )}
      </div>
      <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onUp} disabled={!canUp} className="w-6 h-6 rounded-md bg-black/60 text-white hover:bg-black/80 disabled:opacity-30 flex items-center justify-center" title="Monter">
          <ChevronUp size={12} />
        </button>
        <button onClick={onDown} disabled={!canDown} className="w-6 h-6 rounded-md bg-black/60 text-white hover:bg-black/80 disabled:opacity-30 flex items-center justify-center" title="Descendre">
          <ChevronDown size={12} />
        </button>
      </div>
      {label && !uploading && !error && (
        <div className="absolute bottom-1 left-1 bg-black/60 text-white rounded px-1 text-[9px]">{label}</div>
      )}
    </div>
  );
}

/* ================================================================== */
/* CATEGORIES TAB                                                      */
/* ================================================================== */

function CategoriesTab({ tenantId }: { tenantId?: string }) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProductCategory | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase.from('product_categories').select('*').eq('tenant_id', tenantId).order('position', { ascending: true });
    if (error) console.error('[Categories] Erreur chargement catégories:', error);
    if (!error) setCategories((data as ProductCategory[]) || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  // Build tree: parents + their children
  const parents = categories.filter((c) => !c.parent_category_id);
  const childrenOf = (parentId: string) => categories.filter((c) => c.parent_category_id === parentId);

  return (
    <>
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Catégories & sous-catégories</h2>
            <p className="text-xs text-gray-400">Organisez votre catalogue pour vos clients.</p>
          </div>
          <Button onClick={() => { setEditing(null); setShowModal(true); }}><Plus size={16} /> Nouvelle catégorie</Button>
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm py-10 text-center flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Aucune catégorie. Créez votre première catégorie.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {parents.map((parent) => (
              <CategoryRow key={parent.id} category={parent} depth={0}
                onEdit={() => { setEditing(parent); setShowModal(true); }}
                onDelete={() => setConfirmDelete(parent)} />
            ))}
            {parents.length === 0 && categories.length > 0 && (
              // All are children (orphan) — show flat
              categories.map((c) => (
                <CategoryRow key={c.id} category={c} depth={0}
                  onEdit={() => { setEditing(c); setShowModal(true); }}
                  onDelete={() => setConfirmDelete(c)} />
              ))
            )}
            {/* Render children under each parent */}
            {parents.map((parent) => {
              const kids = childrenOf(parent.id);
              if (kids.length === 0) return null;
              return (
                <div key={`${parent.id}-kids`}>
                  {kids.map((kid) => (
                    <CategoryRow key={kid.id} category={kid} depth={1}
                      onEdit={() => { setEditing(kid); setShowModal(true); }}
                      onDelete={() => setConfirmDelete(kid)} />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showModal && (
        <CategoryModal tenantId={tenantId!} editing={editing} parents={parents}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }} />
      )}

      {confirmDelete && (
        <DeleteCategoryConfirm category={confirmDelete} productsCount={0}
          onCancel={() => setConfirmDelete(null)}
          onDeleted={() => { setConfirmDelete(null); load(); }} />
      )}
    </>
  );
}

function CategoryRow({ category, depth, onEdit, onDelete }: {
  category: ProductCategory; depth: number; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-gray-50 group" style={{ paddingLeft: 8 + depth * 24 }}>
      <div className="flex items-center gap-2 min-w-0">
        {depth === 0
          ? <Folder size={16} className="text-brand-500 shrink-0" />
          : <span className="text-gray-300 text-sm shrink-0">↳</span>}
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{category.name}</p>
          {category.description && <p className="text-xs text-gray-400 truncate">{category.description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-brand-600" title="Modifier">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete} className="w-7 h-7 rounded-md hover:bg-red-50 flex items-center justify-center text-gray-500 hover:text-red-600" title="Supprimer">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function CategoryModal({ tenantId, editing, parents, onClose, onSaved }: {
  tenantId: string; editing: ProductCategory | null; parents: ProductCategory[];
  onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name || '');
  const [description, setDescription] = useState(editing?.description || '');
  const [imageUrl, setImageUrl] = useState((editing as any)?.image_url || '');
  const [parentId, setParentId] = useState<string>(editing?.parent_category_id || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isSub = !!parentId;

  const save = async () => {
    setErr(null);
    if (!name.trim()) { setErr('Le nom est obligatoire.'); return; }
    setBusy(true);
    try {
      const payload = {
        tenant_id: tenantId,
        name: name.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        slug: slugify(name),
        parent_category_id: parentId || null,
      };
      if (editing) {
        const { error } = await supabase.from('product_categories').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_categories').insert(payload);
        if (error) throw error;
      }
      onSaved();
    } catch (e: any) {
      // Graceful: if parent_category_id column missing, retry without it
      if (e.message && /parent_category_id|column/i.test(e.message)) {
        try {
          const fallback = {
            tenant_id: tenantId,
            name: name.trim(),
            description: description.trim() || null,
            image_url: imageUrl.trim() || null,
            slug: slugify(name),
          };
          if (editing) {
            await supabase.from('product_categories').update(fallback).eq('id', editing.id);
          } else {
            await supabase.from('product_categories').insert(fallback);
          }
          onSaved();
          return;
        } catch (e2: any) {
          setErr(e2.message || 'Erreur');
        }
      } else {
        setErr(e.message || 'Erreur');
      }
    } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'} maxWidth="max-w-md">
      <div className="space-y-4">
        {err && <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-2.5 flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{err}</div>}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
          <div className="inline-flex rounded-lg border border-gray-200 p-1">
            <button type="button" onClick={() => setParentId('')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 ${!isSub ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Folder size={13} /> Catégorie
            </button>
            <button type="button" onClick={() => setParentId(parents[0]?.id || '')}
              disabled={parents.length === 0}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 ${isSub ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'} disabled:opacity-40`}>
              <FolderPlus size={13} /> Sous-catégorie
            </button>
          </div>
          {isSub && (
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie parente</label>
              <select value={parentId} onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 bg-white">
                {parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <Input label="Nom *" value={name} onChange={setName} placeholder="Ex: Pagnes" />
        <Input label="Image (URL)" value={imageUrl} onChange={setImageUrl} placeholder="https://…" />
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description courte…"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400 resize-y" />
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={busy}>Annuler</Button>
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Tag size={16} />}
            {editing ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteCategoryConfirm({ category, onCancel, onDeleted }: {
  category: ProductCategory; productsCount: number; onCancel: () => void; onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const doDelete = async () => {
    setBusy(true); setErr(null);
    try {
      // Remove assignments referencing this category
      await supabase.from('product_category_assignments').delete().eq('category_id', category.id);
      const { error } = await supabase.from('product_categories').delete().eq('id', category.id);
      if (error) throw error;
      onDeleted();
    } catch (e: any) {
      setErr(e.message || 'Erreur');
    } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onCancel} title="Supprimer la catégorie" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <p className="text-sm text-gray-600">
            Supprimer <span className="font-semibold text-gray-900">{category.name}</span> ? Les sous-catégories et les associations de produits seront également supprimées.
          </p>
        </div>
        {err && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{err}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>Annuler</Button>
          <Button variant="danger" onClick={doDelete} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Supprimer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
