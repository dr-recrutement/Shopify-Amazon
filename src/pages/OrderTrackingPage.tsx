import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, Button } from '../pages/dashboard/ui';
import { Search, Package, Clock, Truck, CheckCircle2, MapPin, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function OrderTrackingPage() {
  const location = useLocation();
  const [order, setOrder] = useState('');
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderParam = params.get('order');
    if (orderParam) {
      setOrder(orderParam);
      setTracked(true);
    }
  }, [location.search]);
  const steps = [
    { label: 'Reçue', icon: CheckCircle2, done: true },
    { label: 'Préparation', icon: Clock, done: true },
    { label: 'Expédiée', icon: Package, done: true },
    { label: 'En livraison', icon: Truck, done: false },
    { label: 'Livrée', icon: MapPin, done: false },
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <h1 className="font-serif-display text-3xl font-bold text-gray-900 mb-6">Suivi de commande</h1>
        <Card className="p-5 mb-6">
          <p className="text-sm text-gray-500 mb-3">Entrez votre numéro de suivi pour suivre votre commande.</p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={order} onChange={e => setOrder(e.target.value)} placeholder="Ex. LA-2024-1001" className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <Button onClick={() => setTracked(true)}>Suivre</Button>
          </div>
        </Card>
        {tracked && (
          <>
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">Commande</p>
                  <p className="font-semibold text-gray-900">{order || 'LA-2024-1001'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Estimation</p>
                  <p className="font-semibold text-gray-900">21 Juil 2026</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                {steps.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="flex flex-col items-center flex-1 relative">
                      {i < steps.length - 1 && <div className={`absolute top-5 left-1/2 w-full h-0.5 ${s.done ? 'bg-green-500' : 'bg-gray-200'}`} />}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${s.done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <Icon size={18} />
                      </div>
                      <span className={`mt-2 text-xs ${s.done ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Détails</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Robe wax M</span><span>15 000 XOF</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Sac cuir x2</span><span>50 000 XOF</span></div>
                <div className="flex justify-between pt-2 border-t border-gray-100"><span className="font-semibold">Total</span><span className="font-bold">66 000 XOF</span></div>
              </div>
              <Button variant="secondary" size="sm" className="mt-4 flex items-center gap-2"><MessageCircle size={14} /> Contacter le vendeur</Button>
            </Card>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
