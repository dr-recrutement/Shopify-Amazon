import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, Button } from '../pages/dashboard/ui';
import { Shield, Truck, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearCart } from '../lib/app-state';

export default function CheckoutPage() {
  const nav = useNavigate();
  const [payment, setPayment] = useState('flutterwave');
  const [shipping, setShipping] = useState('standard');
  const fmt = (n: number) => n.toLocaleString('fr-FR');
  const total = 66000;
  const shippingCost = 1000;

  const placeOrder = () => {
    clearCart();
    nav('/order-tracking?order=LA-2024-1001');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <h1 className="font-serif-display text-3xl font-bold text-gray-900 mb-6">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Informations de livraison</h3>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Prénom" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input placeholder="Nom" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input placeholder="Email" className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input placeholder="Téléphone" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input placeholder="Pays" defaultValue="🇨🇮 Côte d'Ivoire" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input placeholder="Ville" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input placeholder="Landmark / Quartier" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Mode de livraison</h3>
              <div className="space-y-2">
                {[{ id: 'standard', name: 'Standard', desc: '2-3 jours', price: 1000 }, { id: 'express', name: 'Express', desc: '24h', price: 2500 }, { id: 'pickup', name: 'Point de retrait', desc: 'Gratuit', price: 0 }].map(s => (
                  <button key={s.id} onClick={() => setShipping(s.id)} className={`w-full text-left p-3 rounded-lg border-2 flex items-center justify-between ${shipping === s.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                    <div><div className="font-medium text-sm">{s.name}</div><div className="text-xs text-gray-500">{s.desc}</div></div>
                    <span className="font-medium text-sm">{s.price === 0 ? 'Gratuit' : `${fmt(s.price)} XOF`}</span>
                  </button>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Moyen de paiement</h3>
              <div className="space-y-2">
                {[
                  { id: 'flutterwave', name: 'Flutterwave', desc: 'Mobile Money + cartes' },
                  { id: 'orange', name: 'Orange Money', desc: 'Orange Money marchand' },
                  { id: 'paystack', name: 'Paystack', desc: 'Cartes + Mobile Money' },
                  { id: 'mtn', name: 'MTN MoMo', desc: 'MTN Mobile Money' },
                ].map(p => (
                  <button key={p.id} onClick={() => setPayment(p.id)} className={`w-full text-left p-3 rounded-lg border-2 flex items-center justify-between ${payment === p.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                    <div><div className="font-medium text-sm">{p.name}</div><div className="text-xs text-gray-500">{p.desc}</div></div>
                    {payment === p.id && <CheckCircle2 size={18} className="text-orange-600" />}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500 flex items-center gap-1"><Shield size={12} /> Paiement direct au vendeur. LiAfrikOS ne prélève aucune commission.</p>
            </Card>
          </div>
          <div>
            <Card className="p-5 sticky top-20">
              <h3 className="font-semibold text-gray-900 mb-4">Récapitulatif</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Robe wax M</span><span>15 000 XOF</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Sac cuir x2</span><span>50 000 XOF</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Livraison</span><span>{fmt(shippingCost)} XOF</span></div>
                <div className="pt-2 border-t border-gray-100 flex justify-between"><span className="font-semibold">Total</span><span className="font-bold text-lg">{fmt(total + shippingCost)} XOF</span></div>
              </div>
              <Button onClick={placeOrder} className="mt-4 w-full">Confirmer la commande <ArrowRight size={16} /></Button>
              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2"><Shield size={12} className="text-green-600" /> Paiement sécurisé</div>
                <div className="flex items-center gap-2"><Truck size={12} className="text-blue-600" /> Suivi en temps réel</div>
                <div className="flex items-center gap-2"><CreditCard size={12} className="text-orange-600" /> 0% commission</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
