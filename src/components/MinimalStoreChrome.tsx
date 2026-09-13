import { Link } from 'react-router-dom';

/** Cart, checkout, and order-tracking are pages a SHOPPER lands on while
 *  buying from a specific merchant's store — they must never show
 *  Sellia's own marketing navbar/footer (pricing, features, login links
 *  to our platform). This is deliberately minimal: just the merchant's
 *  own name and a way back to their store, nothing about Sellia. */
export function MinimalStoreHeader({ shopName, storeUrl }: { shopName?: string; storeUrl: string }) {
  return (
    <div className="border-b border-gray-100 bg-white py-4 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to={storeUrl} className="text-sm font-bold text-gray-900">{shopName || 'Boutique'}</Link>
        <Link to={storeUrl} className="text-xs text-gray-400 hover:text-gray-700">← Retour à la boutique</Link>
      </div>
    </div>
  );
}

export function MinimalStoreFooter({ shopName }: { shopName?: string }) {
  return (
    <div className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
      © {new Date().getFullYear()} {shopName || 'Boutique'}
    </div>
  );
}
