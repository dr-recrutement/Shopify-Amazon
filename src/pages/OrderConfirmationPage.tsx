import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/theme-engine';

interface OrderRow {
  id: string;
  customer_name: string;
  total_cents: number;
  currency: string;
  status: string;
}

interface PurchasedItem {
  product_id: string | null;
  product_name: string;
}

function ReviewForm({ orderId, item, customerName }: { orderId: string; item: PurchasedItem; customerName: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!item.product_id) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, productId: item.product_id, rating, comment, customerName }),
      });
      const data: any = await res.json();
      if (!res.ok) { setError(data.error || 'Erreur lors de l\'envoi.'); return; }
      setSubmitted(true);
    } catch {
      setError('Erreur réseau, veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!item.product_id) return null;

  if (submitted) {
    return (
      <div className="p-3 bg-green-50 rounded-lg text-xs text-green-700">
        Merci pour votre avis sur "{item.product_name}" !
      </div>
    );
  }

  return (
    <div className="p-3 border border-gray-100 rounded-lg text-left">
      <p className="text-xs font-medium text-gray-900 mb-2">{item.product_name}</p>
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => setRating(n)} className="text-lg leading-none">
            {n <= rating ? '★' : '☆'}
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Votre avis (facultatif)"
        rows={2}
        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-400 mb-2"
      />
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting}
        className="text-xs font-medium text-white bg-brand-500 px-3 py-1.5 rounded-lg disabled:opacity-50"
      >
        {submitting ? 'Envoi…' : "Envoyer l'avis"}
      </button>
    </div>
  );
}

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<PurchasedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    (async () => {
      if (!orderId) { setLoading(false); return; }

      const transactionId = searchParams.get('transaction_id');
      const tenantIdParam = searchParams.get('tenant_id');
      if (transactionId && tenantIdParam) {
        setVerifying(true);
        try {
          await fetch(`/api/payments/verify?order_id=${orderId}&transaction_id=${transactionId}&tenant_id=${tenantIdParam}`);
        } catch (e) {
          console.error('[OrderConfirmation] Erreur vérification paiement:', e);
        }
        setVerifying(false);
      }

      const { data, error } = await supabase
        .from('orders')
        .select('id,customer_name,total_cents,currency,status')
        .eq('id', orderId)
        .maybeSingle();
      if (error) console.error('[OrderConfirmation] Erreur chargement commande:', error);
      setOrder(data as OrderRow | null);

      const { data: itemRows, error: itemErr } = await supabase
        .from('order_items')
        .select('product_id,product_name')
        .eq('order_id', orderId);
      if (itemErr) console.error('[OrderConfirmation] Erreur chargement articles:', itemErr);
      setItems((itemRows as PurchasedItem[]) || []);

      setLoading(false);
    })();
  }, [orderId]);

  if (loading || verifying) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Vérification de votre commande…</div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-gray-500">
        <p>Commande introuvable.</p>
        <Link to="/" className="text-brand-600 underline text-sm">Retour à la boutique</Link>
      </div>
    );
  }

  const isPaid = order.status === 'paid' || order.status === 'confirmed';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-3">{isPaid ? '✅' : '🕒'}</div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {isPaid ? 'Commande confirmée !' : 'Commande enregistrée'}
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          {isPaid
            ? `Merci ${order.customer_name}, votre paiement a bien été reçu.`
            : "Votre commande est en attente de confirmation du paiement."}
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Numéro de commande</p>
          <p className="text-sm font-mono text-gray-700">{order.id}</p>
          <p className="text-2xl font-bold text-gray-900 mt-3">{formatPrice(order.total_cents, order.currency)}</p>
        </div>

        {isPaid && items.length > 0 && (
          <div className="text-left mb-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">Donnez votre avis</p>
            {items.map((item, i) => (
              <ReviewForm key={i} orderId={order.id} item={item} customerName={order.customer_name} />
            ))}
          </div>
        )}

        <Link to="/" className="inline-block text-sm font-medium text-brand-600 hover:underline">
          Continuer mes achats
        </Link>
      </div>
    </div>
  );
}
