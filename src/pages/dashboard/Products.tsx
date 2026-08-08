import { PageHeader, Card, Button, EmptyState, Table, Badge } from './ui';
import { Package, Plus, Sparkles, Folder, Boxes, Truck, Gift, FileIcon, X, Tag, Layers, Check, Edit2, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getProducts, saveProducts, getCategories, saveCategories, type StoreProduct, type CategoryMap } from '../../lib/app-state';
import { ImageUploadField } from '../../components/ImageUpload';

export default function Products() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<CategoryMap>({});

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);

  // Form states
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState(0);
  const [prodStock, setProdStock] = useState(10);
  const [prodStatus, setProdStatus] = useState<'active' | 'out_of_stock'>('active');
  const [prodCategory, setProdCategory] = useState('');
  const [prodSubcategory, setProdSubcategory] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodDescription, setProdDescription] = useState('');

  // States to add new category/subcategory inline
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddSubcategoryInput, setShowAddSubcategoryInput] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  useEffect(() => {
    setProducts(getProducts());
    setCategories(getCategories());
  }, []);

  const formatPrice = (product: StoreProduct) => {
    return `${product.price.toLocaleString('fr-FR')} ${product.currency || 'XOF'}`;
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdPrice(10000);
    setProdStock(10);
    setProdStatus('active');
    setProdImage('');
    setProdDescription('');

    // Default to the first category if available
    const keys = Object.keys(categories);
    const firstCat = keys[0] || '';
    setProdCategory(firstCat);
    setProdSubcategory(firstCat ? (categories[firstCat]?.[0] || '') : '');

    setShowAddCategoryInput(false);
    setShowAddSubcategoryInput(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: StoreProduct) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdPrice(p.price);
    setProdStock(p.stock);
    setProdStatus(p.status);
    setProdImage(p.image || '');
    setProdDescription(p.description || '');
    setProdCategory(p.category || '');
    setProdSubcategory(p.subcategory || '');

    setShowAddCategoryInput(false);
    setShowAddSubcategoryInput(false);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    let updatedList: StoreProduct[] = [];
    if (editingProduct) {
      updatedList = products.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            name: prodName,
            price: Number(prodPrice),
            stock: Number(prodStock),
            status: Number(prodStock) === 0 ? 'out_of_stock' : prodStatus,
            category: prodCategory,
            subcategory: prodSubcategory,
            image: prodImage,
            description: prodDescription,
          };
        }
        return p;
      });
    } else {
      const newProd: StoreProduct = {
        id: `p-${Date.now()}`,
        name: prodName,
        price: Number(prodPrice),
        stock: Number(prodStock),
        status: Number(prodStock) === 0 ? 'out_of_stock' : prodStatus,
        currency: 'XOF',
        category: prodCategory,
        subcategory: prodSubcategory,
        image: prodImage,
        description: prodDescription,
      };
      updatedList = [newProd, ...products];
    }

    setProducts(updatedList);
    saveProducts(updatedList);
    setIsModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      saveProducts(updated);
    }
  };

  const handleCreateCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories[trimmed]) {
      alert('Cette catégorie existe déjà !');
      return;
    }
    const updated = { ...categories, [trimmed]: [] };
    setCategories(updated);
    saveCategories(updated);
    setProdCategory(trimmed);
    setProdSubcategory('');
    setNewCategoryName('');
    setShowAddCategoryInput(false);
  };

  const handleCreateSubcategory = () => {
    const trimmed = newSubcategoryName.trim();
    if (!trimmed || !prodCategory) return;
    const subs = categories[prodCategory] || [];
    if (subs.includes(trimmed)) {
      alert('Cette sous-catégorie existe déjà pour cette catégorie !');
      return;
    }
    const updated = {
      ...categories,
      [prodCategory]: [...subs, trimmed]
    };
    setCategories(updated);
    saveCategories(updated);
    setProdSubcategory(trimmed);
    setNewSubcategoryName('');
    setShowAddSubcategoryInput(false);
  };

  const subModules = [
    { label: 'Collections', icon: Folder, desc: 'Regroupez vos produits' },
    { label: 'Inventory', icon: Boxes, desc: 'Stocks multi-emplacements' },
    { label: 'Purchase orders', icon: Package, desc: 'Commandes fournisseurs' },
    { label: 'Transfers', icon: Truck, desc: 'Transferts de stock' },
    { label: 'Gift cards', icon: Gift, desc: 'Cartes cadeaux' },
    { label: 'Files', icon: FileIcon, desc: 'Bibliothèque de médias' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produits"
        subtitle="Gérez votre catalogue, vos stocks et vos catégories."
        action={
          <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
            <Plus size={16} /> Ajouter un produit
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {subModules.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4 hover:shadow-md transition-all cursor-pointer">
              <Icon size={18} className="text-emerald-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">{s.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-gray-900">Tous les produits</h3>
          <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
            <Sparkles size={14} /> Générer par IA
          </Button>
        </div>
        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Aucun produit"
            desc="Ajoutez votre premier produit pour commencer à vendre."
            action={<Button onClick={handleOpenAddModal}><Plus size={16} /> Ajouter</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table headers={['Produit', 'Catégorie / Sous-Cat', 'Prix', 'Stock', 'Statut', 'Actions']}>
              {products.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3.5 px-4 font-medium text-gray-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 bg-gray-100" style={p.image ? { backgroundImage: `url(${p.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                        {!p.image && <Package size={18} className="text-gray-400" />}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-400">ID: {p.id}{p.status === 'active' ? ' · Visible sur la boutique' : ' · Masqué'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-700">
                    {p.category ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full w-max">
                          <Tag size={10} /> {p.category}
                        </span>
                        {p.subcategory && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 pl-1">
                            <Layers size={9} /> {p.subcategory}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs italic text-gray-400">Non classifié</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700 font-semibold">{formatPrice(p)}</td>
                  <td className="py-3.5 px-4 text-gray-700 font-medium">{p.stock} pcs</td>
                  <td className="py-3.5 px-4">
                    <Badge color={p.stock === 0 ? 'red' : 'green'}>
                      {p.stock === 0 ? 'Rupture' : 'Actif'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="text-gray-500 hover:text-emerald-600 transition-colors p-1"
                        title="Éditer le produit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-gray-500 hover:text-rose-600 transition-colors p-1"
                        title="Supprimer le produit"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        )}
      </Card>

      {/* Modern Dialog Modal for Adding/Editing Product & custom category creation */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <Package size={16} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Product Image (upload only — no links) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Image du produit (téléversement)
                </label>
                <ImageUploadField
                  value={prodImage}
                  onChange={setProdImage}
                  maxWidth={600}
                />
                <p className="text-[10px] text-gray-400">Téléversez une image — elle s’affichera sur la boutique. Aucun lien externe.</p>
              </div>

              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Robe Wax Kente Royale"
                  value={prodName}
                  onChange={e => setProdName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Product Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Description
                </label>
                <textarea
                  placeholder="Décrivez votre produit (matière, dimensions, origine…)"
                  value={prodDescription}
                  onChange={e => setProdDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Price & Stock Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Prix (XOF) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodPrice}
                    onChange={e => setProdPrice(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Stock Disponible *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodStock}
                    onChange={e => setProdStock(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Statut du catalogue
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProdStatus('active')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
                      prodStatus === 'active'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Actif
                  </button>
                  <button
                    type="button"
                    onClick={() => setProdStatus('out_of_stock')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
                      prodStatus === 'out_of_stock'
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Rupture de stock
                  </button>
                </div>
              </div>

              {/* Category creation and selection block */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <Tag size={12} className="text-emerald-600" /> Catégorie principale
                  </span>
                  {!showAddCategoryInput && (
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryInput(true)}
                      className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Plus size={10} /> Créer une catégorie
                    </button>
                  )}
                </div>

                {showAddCategoryInput ? (
                  <div className="flex items-center gap-2 animate-in slide-in-from-top-1 duration-150">
                    <input
                      type="text"
                      placeholder="Ex: Chaussures, Mode Homme"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      title="Enregistrer la catégorie"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategoryInput(false);
                        setNewCategoryName('');
                      }}
                      className="p-1.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                      title="Annuler"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <select
                    value={prodCategory}
                    onChange={e => {
                      const selected = e.target.value;
                      setProdCategory(selected);
                      // Set default subcategory to the first one available
                      setProdSubcategory(selected ? (categories[selected]?.[0] || '') : '');
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none bg-white"
                  >
                    <option value="">-- Sélectionner une catégorie --</option>
                    {Object.keys(categories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}

                {/* Subcategory selection block - depends on Category */}
                {prodCategory && (
                  <div className="pt-2 border-t border-gray-200/50 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                        <Layers size={12} className="text-emerald-600" /> Sous-Catégorie
                      </span>
                      {!showAddSubcategoryInput && (
                        <button
                          type="button"
                          onClick={() => setShowAddSubcategoryInput(true)}
                          className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <Plus size={10} /> Créer une sous-catégorie
                        </button>
                      )}
                    </div>

                    {showAddSubcategoryInput ? (
                      <div className="flex items-center gap-2 animate-in slide-in-from-top-1 duration-150">
                        <input
                          type="text"
                          placeholder={`Ex: Sandales (sous ${prodCategory})`}
                          value={newSubcategoryName}
                          onChange={e => setNewSubcategoryName(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleCreateSubcategory}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          title="Enregistrer la sous-catégorie"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddSubcategoryInput(false);
                            setNewSubcategoryName('');
                          }}
                          className="p-1.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                          title="Annuler"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <select
                        value={prodSubcategory}
                        onChange={e => setProdSubcategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none bg-white"
                      >
                        <option value="">-- Sélectionner une sous-catégorie --</option>
                        {(categories[prodCategory] || []).map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-semibold"
                >
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
