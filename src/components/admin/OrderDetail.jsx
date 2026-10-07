import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/world/currencies';
import { Loader2, MapPin, FileText, Package } from 'lucide-react';
import { printOrderDocument } from '@/lib/invoice';

const ORDER_STATUSES = ['pending', 'paid', 'processing', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'];

const LABELS = {
  pending: 'En attente', paid: 'Payée', processing: 'En traitement', fulfilled: 'Préparée',
  shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée', refunded: 'Remboursée',
};

const inputCls = 'w-full px-3 py-2 border border-[#E1E1E1] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#008060]/30';

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm border-b border-[#F0F0F0] last:border-0">
      <span className="text-[#6D7175]">{label}</span>
      <span className="font-medium text-[#202223] text-right">{value || '—'}</span>
    </div>
  );
}

// order.items here is order_items rows joined in by Orders.jsx
// (product_name/quantity/price_cents), not a Base44-style embedded array.
export default function OrderDetail({ open, onOpenChange, order, store, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [statusState, setStatus] = useState('pending');
  const status = statusState;
  const [tracking, setTracking] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    if (!order) return;
    setStatus(order.status || 'pending');
    setTracking(order.tracking_number || '');
  }, [order]);

  if (!order) return null;
  const cur = order.currency || store?.currency || 'USD';

  const save = async (statusOverride) => {
    const status = typeof statusOverride === 'string' ? statusOverride : statusState;
    setSaving(true);
    try {
      const wasActive = !['cancelled', 'refunded'].includes(order.status);
      const nowInactive = ['cancelled', 'refunded'].includes(status);
      const { error } = await supabase
        .from('orders')
        .update({ status, tracking_number: tracking || null })
        .eq('id', order.id);
      if (error) throw error;

      // Stock was reserved atomically at checkout (create-order) for
      // every order, manual payment methods included - cancelling or
      // refunding one here has to release it back, or that stock stays
      // permanently unavailable even though nothing was ever actually
      // sold. The automatic 45-minute release only covers orders left
      // pending and abandoned, not an explicit manual cancellation like
      // this one.
      if (wasActive && nowInactive) {
        for (const item of order.items || []) {
          await supabase.rpc('release_stock', { p_product_id: item.product_id, p_variant_id: item.variant_id || null, p_quantity: item.quantity });
        }
        // Same for the discount code's usage count - it was incremented
        // at order creation, so a cancelled/refunded order gives it back.
        if (order.discount_code) {
          await supabase.rpc('release_discount_usage', { p_order_id: order.id });
        }
      }

      onSaved();
      onOpenChange(false);
    } catch (e) {
      alert(e.message || "Échec de l'enregistrement de la commande");
    } finally { setSaving(false); }
  };

  const REFUNDABLE = ['stripe', 'flutterwave', 'paystack', 'paypal'];
  const refundedCents = order.refunded_cents || 0;
  const remainingCents = (order.total_cents || 0) - refundedCents;
  const canRefund = REFUNDABLE.includes(order.payment_gateway) && order.payment_reference
    && !['pending', 'cancelled', 'refunded'].includes(order.status) && remainingCents > 0;

  const refund = async () => {
    const cents = refundAmount ? Math.round(parseFloat(refundAmount.replace(',', '.')) * 100) : remainingCents;
    if (!Number.isFinite(cents) || cents <= 0 || cents > remainingCents) { alert('Montant invalide'); return; }
    if (!confirm(`Rembourser ${formatMoney(cents / 100, cur)} au client via ${order.payment_gateway} ? Cette action est irréversible.`)) return;
    setRefunding(true);
    try {
      const { data, error } = await supabase.functions.invoke('refund-order', { body: { order_id: order.id, amount_cents: cents } });
      if (error) throw new Error((await error.context?.json?.())?.error || error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.full) await save('refunded');
      else { onSaved(); onOpenChange(false); }
    } catch (e) {
      alert(e.message || 'Échec du remboursement');
    } finally { setRefunding(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commande {order.order_number || '#' + order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-[#6D7175] mb-1">Statut</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#6D7175] mb-1">N° de suivi</label>
              <Input value={tracking} onChange={(e) => setTracking(e.target.value)} className={inputCls} placeholder="Optionnel" />
            </div>
          </div>

          {canRefund && (
            <div className="rounded-lg border border-[#E1E1E1] p-3 space-y-2">
              <p className="text-xs font-semibold text-[#202223]">Remboursement via {order.payment_gateway}</p>
              <p className="text-[11px] text-[#6D7175]">Reste remboursable : {formatMoney(remainingCents / 100, cur)}{refundedCents > 0 && ` (déjà remboursé : ${formatMoney(refundedCents / 100, cur)})`}. Laissez vide pour un remboursement total (la commande passe alors en « Remboursée » et le stock est remis en vente).</p>
              <div className="flex gap-2">
                <Input value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className={inputCls} placeholder={`Montant (${cur}) — total par défaut`} />
                <Button type="button" onClick={refund} disabled={refunding} variant="outline">{refunding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rembourser'}</Button>
              </div>
            </div>
          )}
          {!canRefund && refundedCents > 0 && (
            <div className="rounded-lg border border-[#E1E1E1] bg-[#F6F6F7] px-3 py-2 text-xs text-[#202223]">Remboursé au client : {formatMoney(refundedCents / 100, cur)}{order.refund_reference ? ` (réf. ${order.refund_reference})` : ''}.</div>
          )}
          {status === 'refunded' && order.payment_reference && !REFUNDABLE.includes(order.payment_gateway) && refundedCents === 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Ce moyen de paiement ({order.payment_gateway || 'prestataire'}) n'est pas remboursable automatiquement : marquer la commande « Remboursée » met à jour Sellia et remet le stock en vente, mais <strong>ne renvoie pas l'argent au client</strong>. Effectuez le remboursement depuis le tableau de bord du prestataire (référence : {order.payment_reference}).
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-[#6D7175] mb-1.5">Articles</p>
            <div className="rounded-lg border border-[#E1E1E1] divide-y divide-[#F0F0F0]">
              {(order.items || []).map((it) => (
                <div key={it.id} className="flex items-center gap-3 p-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#202223] truncate">{it.product_name}</p>
                    <p className="text-[11px] text-[#6D7175]">{formatMoney((it.price_cents || 0) / 100, cur)} × {it.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#202223]">{formatMoney(((it.price_cents || 0) * it.quantity) / 100, cur)}</span>
                </div>
              ))}
              {(!order.items || !order.items.length) && <p className="p-3 text-xs text-[#6D7175]">Aucun article.</p>}
            </div>
          </div>

          <div className="rounded-lg border border-[#E1E1E1] px-3 py-1">
            <Row label="Client" value={order.customer_name || order.customer_email} />
            <Row label="Téléphone" value={order.customer_phone} />
            {order.discount_amount_cents > 0 && <Row label={`Remise${order.discount_code ? ' (' + order.discount_code + ')' : ''}`} value={'- ' + formatMoney(order.discount_amount_cents / 100, cur)} />}
            {order.shipping_cost_cents > 0 && <Row label="Livraison" value={formatMoney(order.shipping_cost_cents / 100, cur)} />}
            {order.tax_cents > 0 && <Row label={`${order.tax_included ? 'Dont taxes' : 'Taxes'} (${order.tax_rate}%)`} value={formatMoney(order.tax_cents / 100, cur)} />}
            <div className="flex justify-between py-2">
              <span className="font-bold text-[#202223]">Total</span>
              <span className="font-bold text-[#008060]">{formatMoney((order.total_cents || 0) / 100, cur)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => printOrderDocument(order, store, 'invoice')} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold border border-[#E1E1E1] rounded-md py-2 hover:bg-black/5"><FileText className="w-3.5 h-3.5" /> Facture (PDF / imprimer)</button>
            <button type="button" onClick={() => printOrderDocument(order, store, 'packing')} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold border border-[#E1E1E1] rounded-md py-2 hover:bg-black/5"><Package className="w-3.5 h-3.5" /> Bon de livraison</button>
          </div>

          {order.shipping_address && (
            <div className="rounded-lg border border-[#E1E1E1] p-3">
              <p className="text-xs font-semibold text-[#6D7175] mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Livraison</p>
              <p className="text-sm text-[#202223]">{order.shipping_address}</p>
              {order.shipping_city && <p className="text-xs text-[#6D7175]">{order.shipping_city}</p>}
            </div>
          )}
          {order.customer_note && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-800 mb-1">Note du client</p>
              <p className="text-sm text-amber-900 whitespace-pre-wrap">{order.customer_note}</p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          <Button onClick={save} disabled={saving} className="bg-[#008060] hover:bg-[#00694d]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
