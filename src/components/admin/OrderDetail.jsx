import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/world/currencies';
import { Loader2, MapPin, Clock, Check } from 'lucide-react';

const ORDER_STATUSES = ['pending', 'paid', 'processing', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded', 'partially_refunded'];
const PAY_STATUSES = ['pending', 'paid', 'partially_paid', 'refunded', 'voided'];
const FULFILL_STATUSES = ['unfulfilled', 'partial', 'fulfilled'];

const LABELS = {
  pending: 'En attente', paid: 'Payée', processing: 'En traitement', fulfilled: 'Préparée',
  shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée', refunded: 'Remboursée', partially_refunded: 'Partiellement remboursée',
  'partially_paid': 'Partiellement payée', voided: 'Annulée', unfulfilled: 'Non préparée', partial: 'Partielle',
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

function AddressBlock({ title, addr }) {
  if (!addr || !addr.address) return null;
  return (
    <div className="rounded-lg border border-[#E1E1E1] p-3">
      <p className="text-xs font-semibold text-[#6D7175] mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {title}</p>
      <p className="text-sm text-[#202223]">{addr.address}</p>
      <p className="text-xs text-[#6D7175]">{[addr.city, addr.region, addr.country].filter(Boolean).join(', ')} {addr.postal_code}</p>
      {addr.phone && <p className="text-xs text-[#6D7175] mt-0.5">{addr.phone}</p>}
    </div>
  );
}

export default function OrderDetail({ open, onOpenChange, order, store, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('pending');
  const [payStatus, setPayStatus] = useState('pending');
  const [fulfill, setFulfill] = useState('unfulfilled');

  useEffect(() => {
    if (!order) return;
    setStatus(order.status || 'pending');
    setPayStatus(order.payment_status || 'pending');
    setFulfill(order.fulfillment_status || 'unfulfilled');
  }, [order]);

  if (!order) return null;
  const cur = order.currency || store?.currency || 'USD';

  const save = async () => {
    setSaving(true);
    try {
      const updates = { status, payment_status: payStatus, fulfillment_status: fulfill };
      const changed = status !== order.status || payStatus !== order.payment_status || fulfill !== order.fulfillment_status;
      let timeline = order.timeline || [];
      if (changed) {
        timeline = [...timeline, { event: `Statut → ${LABELS[status]}`, at: new Date().toISOString() }];
        updates.timeline = timeline;
      }
      await base44.entities.Order.update(order.id, updates);
      onSaved();
      onOpenChange(false);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commande {order.order_number || '#' + order.id.slice(-6)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-[#6D7175] mb-1">Statut</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#6D7175] mb-1">Paiement</label>
              <select value={payStatus} onChange={(e) => setPayStatus(e.target.value)} className={inputCls}>
                {PAY_STATUSES.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#6D7175] mb-1">Préparation</label>
              <select value={fulfill} onChange={(e) => setFulfill(e.target.value)} className={inputCls}>
                {FULFILL_STATUSES.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#6D7175] mb-1.5">Articles</p>
            <div className="rounded-lg border border-[#E1E1E1] divide-y divide-[#F0F0F0]">
              {(order.items || []).map((it, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5">
                  <div className="w-10 h-10 rounded-md bg-[#F4F4F4] border border-[#E1E1E1] overflow-hidden shrink-0">
                    {it.image ? <img src={it.image} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#202223] truncate">{it.title}</p>
                    {it.variant_title && <p className="text-[11px] text-[#6D7175]">{it.variant_title}</p>}
                    <p className="text-[11px] text-[#6D7175]">{formatMoney(it.price, cur)} × {it.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#202223]">{formatMoney(it.total, cur)}</span>
                </div>
              ))}
              {(!order.items || !order.items.length) && <p className="p-3 text-xs text-[#6D7175]">Aucun article.</p>}
            </div>
          </div>

          <div className="rounded-lg border border-[#E1E1E1] px-3 py-1">
            <Row label="Sous-total" value={formatMoney(order.subtotal, cur)} />
            {order.discount_total > 0 && <Row label="Remise" value={'- ' + formatMoney(order.discount_total, cur)} />}
            {order.shipping_total > 0 && <Row label="Livraison" value={formatMoney(order.shipping_total, cur)} />}
            {order.tax_total > 0 && <Row label="Taxes" value={formatMoney(order.tax_total, cur)} />}
            <div className="flex justify-between py-2">
              <span className="font-bold text-[#202223]">Total</span>
              <span className="font-bold text-[#008060]">{formatMoney(order.total, cur)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <AddressBlock title="Livraison" addr={order.shipping_address} />
            <AddressBlock title="Facturation" addr={order.billing_address} />
          </div>

          <div className="rounded-lg border border-[#E1E1E1] p-3 space-y-1.5">
            <p className="text-xs font-semibold text-[#6D7175] flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Historique</p>
            {(order.timeline || []).length === 0 && <p className="text-xs text-[#6D7175]">Aucun événement.</p>}
            {(order.timeline || []).map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Check className="w-3 h-3 text-[#008060] mt-0.5 shrink-0" />
                <span className="text-[#202223]">{t.event}</span>
                {t.at && <span className="text-[#6D7175] ml-auto">{new Date(t.at).toLocaleDateString('fr-FR')}</span>}
              </div>
            ))}
          </div>

          {order.note && <p className="text-xs text-[#6D7175]"><span className="font-semibold">Note : </span>{order.note}</p>}
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