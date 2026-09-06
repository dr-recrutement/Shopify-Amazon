import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, Button } from '../pages/dashboard/ui';
import { Shield, Truck, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCartItems, saveCartItems } from '../lib/app-state';
import { resolvePublicTenant, submitPublicCheckout, type PublicTenant } from '../lib/tenant-sync';

const PAYMENT_METHODS = [
  { id: 'payunit', name: 'PayUnit', desc: 'Mobile Money + cartes' },
  { id: 'orange_money', name: 'Orange Money', desc: 'Orange Money marchand' },
  { id: 'wave', name: 'Wave', desc: 'Paiement Wave' },
  { id: 'mtn', name: 'MTN MoMo', desc: 'MTN Mobile Money' },
];

export default function CheckoutPage() {
  const { slug } = useParams<{ slug?: string }>();
  const nav = useNavigate();
  const [tenant, setTenant] = useState<PublicTenant | null>(null);
  const [items, setItems] = useState(() => getCartItems());
  const [payment, setPayment] = useState('payunit');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = slug ? await resolvePublicTenant(slug) : null;
      if (cancelled) return;
      setTenant(t);
      setItems(getCartItems(t?.id));
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const currency = items[0]?.currency || 'XOF';
  const fmt = (n: number) => `${n.toLocaleString('fr-FR')} ${currency}`;
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingCost = items.length > 0 ? 1000 : 0;

  const placeOrder = async () => {
    if (items.length === 0) return;
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError('Renseignez au moins votre nom, prénom et téléphone.');
      return;
    }
    setError(null);
    setSubmitting(true);

    if (!tenant) {
      // Local/demo checkout (no resolved tenant — same fallback StorefrontPage
      // uses for its own /store preview): no real gateway to call, so this
      // just records a local order rather than pretending to charge anyone.
      setSubmitting(false);
      saveCartItems([]);
      nav('/order-tracking?order=DEMO-' + Date.now().toString().slice(-6));
      return;
    }

    const result = await submitPublicCheckout({
      tenantId: tenant.id,
      customerName: `${firstName} ${lastName}`.trim(),
      customerEmail: email || undefined,
      paymentMethod: payment,
      currency: tenant.currency || currency,
      items: items.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || 'Une erreur est survenue. Réessayez.');
      return;
    }
    saveCartItems([], tenant.id);
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
      return;
    }
    nav(`/order-tracking?order=${result.orderNumber}`);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 pt-32 pb-16 text-center">
          <h1 className="font-serif-display text-2xl font-bold text-gray-900 mb-2">Votre panier est vide</h1>
          <p className="text-gray-500 text-sm">Ajoutez des produits avant de passer commande.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <h1 className="font-serif-display text-3xl font-bold text-gray-900 mb-6">Checkout{tenant ? ` — ${tenant.name}` : ''}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Informations de livraison</h3>
              <div className="grid grid-cols-2 gap-3">
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Prénom" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nom" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Téléphone" className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Moyen de paiement</h3>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(p => (
                  <button key={p.id} onClick={() => setPayment(p.id)} className={`w-full text-left p-3 rounded-full border-2 flex items-center justify-between ${payment === p.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`}>
                    <div><div className="font-medium text-sm">{p.name}</div><div className="text-xs text-gray-500">{p.desc}</div></div>
                    {payment === p.id && <CheckCircle2 size={18} className="text-brand-600" />}
                  </button>
                ))}
              </div>
              {payment !== 'payunit' && (
                <p className="mt-3 text-xs text-amber-600">Ce moyen de paiement enregistre votre commande, mais le règlement se fera directement avec le vendeur — aucune passerelle en ligne n'est encore branchée pour ce mode.</p>
              )}
              <p className="mt-3 text-xs text-gray-500 flex items-center gap-1"><Shield size={12} /> Paiement direct au vendeur. Sellia ne prélève aucune commission.</p>
            </Card>
          </div>
          <div>
            <Card className="p-5 sticky top-20">
              <h3 className="font-semibold text-gray-900 mb-4">Récapitulatif</h3>
              <div className="space-y-2 text-sm">
                {items.map(i => (
                  <div key={i.id} className="flex justify-between"><span className="text-gray-500">{i.name} x{i.qty}</span><span>{fmt(i.price * i.qty)}</span></div>
                ))}
                <div className="flex justify-between"><span className="text-gray-500">Livraison</span><span>{fmt(shippingCost)}</span></div>
                <div className="pt-2 border-t border-gray-100 flex justify-between"><span className="font-semibold">Total</span><span className="font-bold text-lg">{fmt(total + shippingCost)}</span></div>
              </div>
              {error && <p className="mt-3 text-xs text-red-600 font-medium">{error}</p>}
              <Button onClick={placeOrder} disabled={submitting} className="mt-4 w-full">
                {submitting ? 'Traitement…' : <>Confirmer la commande <ArrowRight size={16} /></>}
              </Button>
              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2"><Shield size={12} className="text-green-600" /> Paiement sécurisé</div>
                <div className="flex items-center gap-2"><Truck size={12} className="text-blue-600" /> Suivi en temps réel</div>
                <div className="flex items-center gap-2"><CreditCard size={12} className="text-brand-600" /> 0% commission</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
