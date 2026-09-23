import { useState, useEffect, useCallback, useMemo } from 'react';
import { ShoppingCart, Mail, Loader2, Clock, X, AlertCircle, RotateCcw, Copy, Check } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { formatMoney } from '@/lib/world/currencies';

// Native abandoned_carts table stores items/email/name/total directly (no
// customer_id join needed). There's no email-sending backend available here
// (no Supabase Edge Function deployed for it) - the old base44.integrations.
// Core.SendEmail call is gone, so "reminding" a customer means copying
// their email to contact them manually rather than an automated send.
export default function AbandonedCheckouts() {
  const { store, loading } = useCurrentStore();
  const [carts, setCarts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(null);

  const load = useCallback(async () => {
    if (!store?.id) return;
    const { data, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('tenant_id', store.id)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) { console.error('Failed to load abandoned carts:', error); setCarts([]); return; }
    // Real allowed values are open/recovered/ignored (not "abandoned") -
    // a cart counts as abandoned here once it's been inactive a while,
    // not by a stored status value that doesn't exist.
    const oneHourAgo = Date.now() - 3600000;
    setCarts((data || []).filter((c) => c.status === 'open' && new Date(c.last_activity_at || c.created_at).getTime() < oneHourAgo).map((c) => ({
      ...c,
      total: (c.total_cents || 0) / 100,
      created_date: c.created_at,
    })));
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const copyEmail = (cart) => {
    if (!cart.customer_email) return;
    navigator.clipboard?.writeText(cart.customer_email);
    setCopied(cart.id);
    setTimeout(() => setCopied(null), 1500);
  };

  const convert = async (cart) => {
    if (!confirm('Marquer ce panier comme converti en commande ?')) return;
    const { error } = await supabase.from('abandoned_carts').update({ status: 'recovered' }).eq('id', cart.id);
    if (error) { alert(error.message); return; }
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
                  <td className="px-4 py-3"><button onClick={() => setSelected(c)} className="text-[#202223] font-medium hover:text-[#008060]">{c.customer_name || c.customer_email || 'Invité'}</button></td>
                  <td className="px-4 py-3 text-[#6D7175]">{c.items?.length || 0} article(s)</td>
                  <td className="px-4 py-3 font-semibold text-[#202223]">{formatMoney(c.total, c.currency)}</td>
                  <td className="px-4 py-3 text-[#6D7175]">{new Date(c.created_date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {c.customer_email && (
                        <button onClick={() => copyEmail(c)} title="Copier l'e-mail pour relancer manuellement" className="flex items-center gap-1 text-xs font-semibold text-[#008060] border border-[#008060]/30 rounded-full px-3 py-1.5 hover:bg-[#008060]/5">
                          {copied === c.id ? <><Check className="w-3 h-3" /> Copié</> : <><Mail className="w-3 h-3" /> Copier l'e-mail</>}
                        </button>
                      )}
                      <button onClick={() => convert(c)} title="Marquer converti" className="w-7 h-7 rounded-md border border-[#E1E1E1] flex items-center justify-center text-[#6D7175] hover:bg-[#008060]/10 hover:text-[#008060]"><RotateCcw className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-[11px] text-[#6D7175] mt-3 flex items-center gap-1"><Copy className="w-3 h-3" /> Pas d'envoi d'e-mail automatique pour l'instant — copiez l'adresse pour relancer le client vous-même.</p>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-[#202223]">Détail du panier</h2><button onClick={() => setSelected(null)} className="text-[#6D7175]"><X className="w-5 h-5" /></button></div>
            <p className="text-xs text-[#6D7175] mb-3">{new Date(selected.created_date).toLocaleString('fr-FR')}</p>
            <div className="space-y-2">
              {(selected.items || []).map((it, i) => (
                <div key={i} className="flex items-center gap-3 pb-2 border-b border-[#E1E1E1]">
                  <div className="flex-1"><p className="text-sm font-medium text-[#202223]">{it.name || it.title}</p></div>
                  <p className="text-sm text-[#6D7175]">×{it.quantity}</p>
                  <p className="text-sm font-semibold text-[#202223]">{formatMoney((it.price_cents ? it.price_cents / 100 : it.price || 0) * it.quantity, selected.currency)}</p>
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
