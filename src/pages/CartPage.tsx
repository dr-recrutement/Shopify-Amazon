import { Card, Button } from './dashboard/ui';
import { Trash2, ShoppingBag, ArrowRight, Shield, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { formatPrice } from '../lib/theme-engine';

export default function CartPage({ tenantId: _tenantId }: { tenantId: string }) {
  const { items, totalCents, updateQuantity, removeItem } = useCart();
  const currency = items[0]?.currency || 'XOF';

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="p-12 text-center max-w-sm">
          <ShoppingBag size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-3">Votre panier est vide.</p>
          <Link to="/" className="inline-block text-brand-600 font-medium text-sm hover:underline">
            Retour à la boutique
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <h1 className="text-3xl font-semibold text-gray-900 mb-6 tracking-tight">Panier</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => (
              <Card key={item.productId} className="p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                  {item.thumbnail
                    ? <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                    : <span className="text-xs text-gray-300">Pas d'image</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-sm text-brand-600 font-bold">{formatPrice(item.priceCents, item.currency)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-7 h-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"
                  >−</button>
                  <span className="text-sm w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-7 h-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"
                  >+</button>
                </div>
                <button onClick={() => removeItem(item.productId)} className="text-gray-300 hover:text-red-600 flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Résumé</h3>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Sous-total</span>
                <span>{formatPrice(totalCents, currency)}</span>
              </div>
              <div className="pt-2 border-t border-gray-100 flex justify-between mb-4">
                <span className="font-semibold">Total</span>
                <span className="font-semibold text-lg">{formatPrice(totalCents, currency)}</span>
              </div>
              <Link to="/checkout">
                <Button className="w-full">Passer commande <ArrowRight size={16} /></Button>
              </Link>
              <div className="mt-3 space-y-1.5 text-xs text-gray-400">
                <div className="flex items-center gap-2"><Shield size={12} /> Paiement sécurisé</div>
                <div className="flex items-center gap-2"><Truck size={12} /> Livraison selon votre localisation</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
