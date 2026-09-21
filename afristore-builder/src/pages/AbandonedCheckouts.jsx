import { useState, useEffect, useCallback, useMemo } from 'react';
import { ShoppingCart, Mail, Loader2, Clock, X, Send, AlertCircle, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { formatMoney } from '@/lib/world/currencies';

export default function AbandonedCheckouts() {
  const { store, loading } = useCurrentStore();
  const [carts, setCarts] = useState([]);
  const [sending, setSending] = useState(null);
  const [selected, setSelected] = useState(null);
  const [sent, setSent] = useState({});

  const load = useCallback(async () => {
    if (!store?.id) return;
    const all = await base44.entities.Cart.filter({ store_id: store.id }, '-created_date', 200);
    setCarts(all.filter((c) => c.status === 'abandoned' || (!c.status && c.items?.length)));
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const remind = async (cart) => {
    setSending(cart.id);
    try {
      if (cart.customer_id) {
        const customer = await base44.entities.Customer.get(cart.customer_id);
        if (customer.email) await base44.integrations.Core.SendEmail({ to: customer.email, subject: `Votre panier vous attend sur ${store.name}`, body: `Bonjour ${customer.first_name || ''},\n\nVotre panier de ${formatMoney(cart.total, cart.currency)} vous attend toujours. Revenez finaliser votre commande !\n\nL'équipe ${store.name}` });
      }
      setSent((s) => ({ ...s, [cart.id]: true }));
    } finally { setSending(null); }
  };

  const convert = async (cart) => {
    if (!confirm('Marquer ce panier comme converti en commande ?')) return;
    await base44.entities.Cart.update(cart.id, { status: 'converted' });
    await load();
  };

  const stats = useMemo(() => ({
    total: carts.length,
    value: carts.reduce((s, c) => s + (c.total || 0), 0),
    avg: carts.length ? carts.reduce((s, c) => s + (c.total || 0), 0) / carts.length : 0,
  }), [carts]);

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6"><ShoppingCart className="w-5 h-5 text-[#6D7175]" /><h1 className="text-xl font-bold text-[#202223]">Récupération panier</h1></div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><ShoppingCart className="w-5 h-5 text-amber-500 mb-2" /><p className="text-xl font-bold text-[#202223]">{stats.total}</p><p className="text-xs text-[#6D7175]">Paniers abandonnés</p></div>
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><Clock className="w-5 h-5 text-[#008060] mb-2" /><p className="text-xl font-bold text-[#202223]">{formatMoney(stats.value, store?.currency)}</p><p className="text-xs text-[#6D7175]">Valeur perdue</p></div>
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><AlertCircle className="w-5 h-5 text-red-500 mb-2" /><p className="text-xl font-bold text-[#202223]">{formatMoney(stats.avg, store?.currency)}</p><p className="text-xs text-[#6D7175]">Panier moyen</p></div>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
        {carts.length === 0 ? (
          <div className="p-10 text-center"><ShoppingCart className="w-10 h-10 text-[#C9C9C9] mx-auto mb-3" /><p className="text-sm text-[#6D7175]">Aucun panier abandonné. Tout est sous contrôle !</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F4F4F4] text-left text-xs text-[#6D7175]"><tr><th className="px-4 py-3 font-semibold">Client</th><th className="px-4 py-3 font-semibold">Articles</th><th className="px-4 py-3 font-semibold">Montant</th><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold text-right">Actions</th></tr></thead>
            <tbody>
              {carts.map((c) => (
                <tr key={c.id} className="border-t border-[#E1E1E1] hover:bg-[#F4F4F4]">
                  <td className="px-4 py-3"><button onClick={() => setSelected(c)} className="text-[#202223] font-medium hover:text-[#008060]">{c.customer_id ? 'Client enregistré' : 'Invité'}</button></td>
                  <td className="px-4 py-3 text-[#6D7175]">{c.items?.length || 0} article(s)</td>
                  <td className="px-4 py-3 font-semibold text-[#202223]">{formatMoney(c.total, c.currency)}</td>
                  <td className="px-4 py-3 text-[#6D7175]">{new Date(c.created_date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => remind(c)} disabled={sending === c.id || sent[c.id]} className="flex items-center gap-1 text-xs font-semibold text-[#008060] border border-[#008060]/30 rounded-full px-3 py-1.5 hover:bg-[#008060]/5 disabled:opacity-40">{sent[c.id] ? <><Send className="w-3 h-3" /> Envoyé</> : sending === c.id ? <><Loader2 className="w-3 h-3 animate-spin" /> …</> : <><Mail className="w-3 h-3" /> Relancer</>}</button>
                      <button onClick={() => convert(c)} title="Marquer converti" className="w-7 h-7 rounded-md border border-[#E1E1E1] flex items-center justify-center text-[#6D7175] hover:bg-[#008060]/10 hover:text-[#008060]"><RotateCcw className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-[#202223]">Détail du panier</h2><button onClick={() => setSelected(null)} className="text-[#6D7175]"><X className="w-5 h-5" /></button></div>
            <p className="text-xs text-[#6D7175] mb-3">{new Date(selected.created_date).toLocaleString('fr-FR')}</p>
            <div className="space-y-2">
              {(selected.items || []).map((it, i) => (
                <div key={i} className="flex items-center gap-3 pb-2 border-b border-[#E1E1E1]">
                  {it.image && <img src={it.image} alt="" className="w-10 h-10 rounded object-cover" />}
                  <div className="flex-1"><p className="text-sm font-medium text-[#202223]">{it.title}</p>{it.variant_title && <p className="text-xs text-[#6D7175]">{it.variant_title}</p>}</div>
                  <p className="text-sm text-[#6D7175]">×{it.quantity}</p>
                  <p className="text-sm font-semibold text-[#202223]">{formatMoney(it.line_total || (it.price * it.quantity), selected.currency)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 pt-3 border-t border-[#E1E1E1]"><span className="text-sm font-bold text-[#202223]">Total</span><span className="text-sm font-bold text-[#202223]">{formatMoney(selected.total, selected.currency)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}