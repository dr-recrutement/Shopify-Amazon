import { PageHeader, Card, Button, EmptyState, Table, Badge } from './ui';
import { Package, Plus, Sparkles, Folder, Boxes, Truck, Gift, FileIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getProducts, saveProducts, type StoreProduct } from '../../lib/app-state';

export default function Products() {
  const [products, setProducts] = useState<StoreProduct[]>([]);

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const formatPrice = (product: StoreProduct) => `${product.price.toLocaleString('fr-FR')} ${product.currency}`;

  const subModules = [
    { label: 'Collections', icon: Folder, desc: 'Regroupez vos produits' },
    { label: 'Inventory', icon: Boxes, desc: 'Stocks multi-emplacements' },
    { label: 'Purchase orders', icon: Package, desc: 'Commandes fournisseurs' },
    { label: 'Transfers', icon: Truck, desc: 'Transferts de stock' },
    { label: 'Gift cards', icon: Gift, desc: 'Cartes cadeaux' },
    { label: 'Files', icon: FileIcon, desc: 'Bibliothèque de médias' },
  ];

  return (
    <div>
      <PageHeader title="Produits" subtitle="Gérez votre catalogue, vos stocks et vos collections." action={<Button onClick={() => {
        const next: StoreProduct[] = [...products, { id: `p${Date.now()}`, name: 'Nouveau produit', price: 10000, stock: 10, status: 'active' as const, currency: 'XOF' }];
        setProducts(next);
        saveProducts(next);
      }}><Plus size={16} /> Ajouter un produit</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {subModules.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4 hover:shadow-md transition-all cursor-pointer">
              <Icon size={18} className="text-orange-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">{s.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
            </Card>
          );
        })}
      </div>
      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Tous les produits</h3>
          <Button variant="secondary" size="sm"><Sparkles size={14} /> Générer par IA</Button>
        </div>
        {products.length === 0 ? (
          <EmptyState icon={Package} title="Aucun produit" desc="Ajoutez votre premier produit pour commencer à vendre." action={<Button><Plus size={16} /> Ajouter</Button>} />
        ) : (
          <Table headers={['Produit', 'Prix', 'Stock', 'Statut', '']}>
            {products.map(p => (
              <tr key={p.name} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{p.name}</td>
                <td className="py-3 px-4 text-gray-700">{formatPrice(p)}</td>
                <td className="py-3 px-4 text-gray-700">{p.stock}</td>
                <td className="py-3 px-4"><Badge color={p.stock === 0 ? 'red' : 'green'}>{p.stock === 0 ? 'Rupture' : 'Actif'}</Badge></td>
                <td className="py-3 px-4"><button className="text-orange-600 text-sm font-medium hover:underline">Éditer</button></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
