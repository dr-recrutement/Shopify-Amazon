import { Card, Button } from './dashboard/ui';
import { Shield, Truck, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { formatPrice } from '../lib/theme-engine';

export default function CheckoutPage({ tenantId }: { tenantId: string }) {
  const nav = useNavigate();
  const { items, totalCents, clearCart } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountCents: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currency = items[0]?.currency || 'XOF';

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setCheckingPromo(true);
    setPromoError(null);
    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, code: promoCode.trim(), subtotalCents: totalCents }),
      });
      const data: any = await res.json();
      if (!res.ok) {
        setPromoError(data.error || 'Code invalide.');
        setAppliedPromo(null);
        return;
      }
      setAppliedPromo({ code: data.code, discountCents: data.discountCents });
    } catch {
      setPromoError('Erreur réseau, veuillez réessayer.');
    } finally {
      setCheckingPromo(false);
    }
  };

  const finalTotalCents = Math.max(0, totalCents - (appliedPromo?.discountCents || 0));

  const placeOrder = async () => {
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError('Merci de renseigner votre nom et votre numéro de téléphone.');
      return;
    }
    if (items.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
          customer: { name, phone, email: email || undefined, address: address || undefined },
          promoCode: appliedPromo?.code || undefined,
        }),
      });
      const data: any = await res.json();
      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue lors de la commande.');
        return;
      }
      clearCart();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        nav(`/order-confirmation/${data.orderId}?tenant_id=${tenantId}`);
      }
    } catch {
      setError('Erreur réseau, veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-12 text-center">
          <p className="text-gray-500">Votre panier est vide.</p>
          <Link to="/" className="mt-3 inline-block text-orange-600 font-medium">Retour à la boutique</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <h1 className="text-3xl font-semibold text-gray-900 mb-6 tracking-tight">Finaliser ma commande</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5 space-y-3">
              <h3 className="font-semibold text-gray-900 mb-2">Vos coordonnées</h3>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom complet *" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Téléphone (Mobile Money) *" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optionnel)" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Adresse de livraison" rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Résumé</h3>
              <div className="space-y-1 text-sm mb-3">
                {items.map(i => (
                  <div key={i.productId} className="flex justify-between text-gray-600">
                    <span>{i.name} × {i.quantity}</span>
                    <span>{formatPrice(i.priceCents * i.quantity, i.currency)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100 mb-3">
                {!appliedPromo ? (
                  <div className="flex gap-2">
                    <input
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      placeholder="Code promo"
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
                    />
                    <Button variant="secondary" onClick={applyPromo} disabled={checkingPromo || !promoCode.trim()}>
                      {checkingPromo ? '...' : 'Appliquer'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-sm bg-green-50 text-green-700 px-3 py-2 rounded-lg">
                    <span>Code "{appliedPromo.code}" appliqué</span>
                    <button onClick={() => { setAppliedPromo(null); setPromoCode(''); }} className="text-xs underline">Retirer</button>
                  </div>
                )}
                {promoError && <p className="text-xs text-red-600 mt-1">{promoError}</p>}
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-1 mb-4">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Sous-total</span>
                  <span>{formatPrice(totalCents, currency)}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Réduction</span>
                    <span>−{formatPrice(appliedPromo.discountCents, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold text-lg">{formatPrice(finalTotalCents, currency)}</span>
                </div>
              </div>
              {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
              <Button onClick={placeOrder} disabled={submitting} className="w-full">
                {submitting ? 'Traitement…' : <>Payer maintenant <ArrowRight size={16} /></>}
              </Button>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                <Shield size={12} /> Paiement sécurisé via Flutterwave
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
