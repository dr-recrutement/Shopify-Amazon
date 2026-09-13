import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, CheckCircle2, Truck, Home, Search, MessageCircle } from 'lucide-react';
import { Card, Button } from './dashboard/ui';
import { resolvePublicTenant, fetchCloudSettingsFor } from '../lib/tenant-sync';

const STATUS_STEPS = [
  { key: 'pending', label: 'Commande reçue', icon: Package },
  { key: 'paid', label: 'Paiement confirmé', icon: CheckCircle2 },
  { key: 'shipped', label: 'Expédiée', icon: Truck },
  { key: 'delivered', label: 'Livrée', icon: Home },
];
const STATUS_ORDER = ['pending', 'paid', 'shipped', 'delivered'];

interface TrackedOrder {
  shopName: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  items: Array<{ name: string; qty: number; price: number }>;
  date: string;
}

/** No Sellia navbar/footer here on purpose: a shopper tracking an order
 *  from a merchant's storefront should never land on OUR platform's own
 *  branding/marketing nav — this stays a neutral, minimal page that only
 *  ever shows the MERCHANT's own name and contact channel. */
export default function OrderTrackingPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [sellerContact, setSellerContact] = useState<{ provider?: string; value?: string } | null>(null);

  const storeUrl = slug ? `/s/${slug}` : '/store';

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) {
      setError("Le suivi de commande se fait depuis le site de la boutique concernée.");
      return;
    }
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopSlug: slug, orderNumber: orderNumber.trim(), email: email.trim() }),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.error || 'Erreur lors de la recherche.'); setLoading(false); return; }
      setOrder(result);
      const tenant = await resolvePublicTenant(slug);
      if (tenant) {
        const settings = await fetchCloudSettingsFor(tenant.id);
        if (settings) setSellerContact({ provider: settings.chatProvider, value: settings.chatValue });
      }
    } catch {
      setError('Erreur réseau. Réessayez.');
    }
    setLoading(false);
  };

  const currentIdx = order ? STATUS_ORDER.indexOf(order.status) : -1;
  const whatsappHref = sellerContact?.provider === 'whatsapp' && sellerContact.value
    ? `https://wa.me/${sellerContact.value.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour, je vous contacte au sujet de ma commande ${order?.orderNumber || ''}`)}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="border-b border-gray-100 bg-white py-4">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between">
          <Link to={storeUrl} className="text-sm font-bold text-gray-900">{order?.shopName || 'Suivi de commande'}</Link>
          <Link to={storeUrl} className="text-xs text-gray-400 hover:text-gray-700">← Retour à la boutique</Link>
        </div>
      </div>

      <div className="flex-1 max-w-lg w-full mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Suivre ma commande</h1>
        <p className="text-sm text-gray-500 text-center mb-8">Entrez votre numéro de commande et l'email utilisé lors de l'achat.</p>

        <Card className="p-5">
          <form onSubmit={handleTrack} className="space-y-3">
            <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="Numéro de commande (ex. LA-123456)" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email utilisé lors de la commande" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Recherche…' : <><Search size={16} /> Suivre ma commande</>}
            </Button>
          </form>
        </Card>

        {order && (
          <Card className="p-5 mt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-gray-400">Commande</p>
                <p className="font-bold text-gray-900">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Total</p>
                <p className="font-bold text-gray-900">{order.total.toLocaleString('fr-FR')} {order.currency}</p>
              </div>
            </div>

            {order.status === 'cancelled' ? (
              <p className="text-sm text-red-600 font-medium text-center py-4">Cette commande a été annulée.</p>
            ) : (
              <div className="space-y-4">
                {STATUS_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const done = currentIdx >= 0 && i <= currentIdx;
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-300'}`}>
                        <Icon size={16} />
                      </div>
                      <span className={`text-sm ${done ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100 space-y-1.5">
              {order.items.map((it, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-600">
                  <span>{it.name} x{it.qty}</span>
                  <span>{(it.price * it.qty).toLocaleString('fr-FR')} {order.currency}</span>
                </div>
              ))}
            </div>

            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-[#25D366] text-white rounded-full text-sm font-bold">
                <MessageCircle size={16} /> Contacter le vendeur
              </a>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
