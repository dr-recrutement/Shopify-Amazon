import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe, Loader2, AlertCircle, ShoppingBag, Smartphone, Store,
  Instagram, Facebook, MessageCircle, ExternalLink, Check, Zap, Plus,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { formatMoney } from '@/lib/world/currencies';

const CHANNELS = [
  { id: 'online_store', name: 'Boutique en ligne', icon: Store, color: '#008060', desc: 'Votre site Sellia', active: true },
  { id: 'instagram', name: 'Instagram Shopping', icon: Instagram, color: '#E1306C', desc: 'Vendez sur Instagram', active: false },
  { id: 'facebook', name: 'Facebook Shop', icon: Facebook, color: '#1877F2', desc: 'Catalogue Facebook', active: false },
  { id: 'whatsapp', name: 'WhatsApp Business', icon: MessageCircle, color: '#25D366', desc: 'Commandes par WhatsApp', active: false },
  { id: 'mobile_app', name: 'App mobile', icon: Smartphone, color: '#8B5CF6', desc: 'App iOS & Android', active: false },
  { id: 'marketplace', name: 'Marché Sellia', icon: Globe, color: '#0EA5E9', desc: 'Place de marché panafricaine', active: false },
];

export default function Markets() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      setOrders(await base44.entities.Order.filter({ store_id: store.id }, '-created_date', 500));
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  if (storeLoading || loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Configurez votre boutique</h1>
        <Link to="/store-setup" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-3">Configurer</Link>
      </div>
    );
  }

  const revenue = orders.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Globe className="w-5 h-5 text-[#6D7175]" />
        <div>
          <h1 className="text-xl font-bold text-[#202223]">Marchés</h1>
          <p className="text-xs text-[#6D7175]">Vendez sur plusieurs canaux et atteignez plus de clients.</p>
        </div>
      </div>

      {store?.slug && (
        <div className="bg-gradient-to-r from-[#008060] to-[#0EA5E9] rounded-xl p-5 mb-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium opacity-90">Votre boutique est en ligne</p>
              <a href={`/store/${store.slug}`} target="_blank" rel="noreferrer" className="text-lg font-bold hover:underline flex items-center gap-1.5 mt-1">
                {store.slug} <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-90">Revenu total</p>
              <p className="text-2xl font-bold">{formatMoney(revenue, store.currency)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CHANNELS.map((ch) => (
          <div key={ch.id} className={`rounded-xl border p-5 transition ${ch.active ? 'bg-white border-[#008060]/30' : 'bg-white border-[#E1E1E1] opacity-75'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${ch.color}15` }}>
                <ch.icon className="w-5 h-5" style={{ color: ch.color }} />
              </div>
              {ch.active ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#008060] bg-[#008060]/10 px-2 py-1 rounded-full"><Check className="w-3 h-3" /> Actif</span>
              ) : (
                <span className="text-[10px] font-semibold text-[#6D7175] bg-[#F4F4F4] px-2 py-1 rounded-full">Bientôt</span>
              )}
            </div>
            <h3 className="text-sm font-bold text-[#202223]">{ch.name}</h3>
            <p className="text-xs text-[#6D7175] mt-0.5 mb-4">{ch.desc}</p>
            {ch.active ? (
              <Link to="/theme-editor" className="flex items-center gap-1.5 text-xs font-semibold text-[#008060] hover:underline">Gérer →</Link>
            ) : (
              <button disabled className="flex items-center gap-1.5 text-xs font-semibold text-[#6D7175] cursor-not-allowed">
                <Plus className="w-3.5 h-3.5" /> Bientôt disponible
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] p-5 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-[#008060]" />
          <h2 className="text-sm font-bold text-[#202223]">Pourquoi vendre sur plusieurs canaux ?</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-semibold text-[#202223] mb-1">🌍 Toucher plus de clients</p>
            <p className="text-[11px] text-[#6D7175]">Chaque canal ajoute une nouvelle audience et augmente vos chances de vente.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#202223] mb-1">📦 Synchronisation automatique</p>
            <p className="text-[11px] text-[#6D7175]">Stock et commandes synchronisés entre tous vos canaux de vente.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#202223] mb-1">📈 Booster votre croissance</p>
            <p className="text-[11px] text-[#6D7175]">Les marchands multi-canaux génèrent en moyenne 2x plus de revenus.</p>
          </div>
        </div>
      </div>
    </div>
  );
}