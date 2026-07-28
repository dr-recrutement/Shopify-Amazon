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

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<OrderRow | null>(null);
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
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
        <Link to="/" className="inline-block text-sm font-medium text-brand-600 hover:underline">
          Continuer mes achats
        </Link>
      </div>
    </div>
  );
}
