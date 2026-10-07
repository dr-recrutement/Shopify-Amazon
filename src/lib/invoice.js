import { formatMoney } from '@/lib/world/currencies';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Printable invoice / packing slip (opens the browser print dialog - "Save as
// PDF" gives the merchant a real PDF). Everything comes from the stored order,
// never recomputed, so it always matches what the customer was charged.
export function printOrderDocument(order, store, type = 'invoice') {
  const cur = order.currency || store?.currency || 'USD';
  const money = (cents) => formatMoney((cents || 0) / 100, cur);
  const number = order.order_number || '#' + String(order.id).slice(0, 8).toUpperCase();
  const items = order.items || [];
  const subtotal = items.reduce((s, i) => s + (i.price_cents || 0) * (i.quantity || 0), 0);
  const isInvoice = type === 'invoice';
  const date = new Date(order.created_at || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const rows = items.map((i) => `<tr><td>${esc(i.product_name)}</td><td class="r">${esc(i.quantity)}</td>${isInvoice ? `<td class="r">${money(i.price_cents)}</td><td class="r">${money((i.price_cents || 0) * (i.quantity || 0))}</td>` : '<td class="r">☐</td>'}</tr>`).join('');
  const totals = isInvoice ? `
    <table class="tot">
      <tr><td>Sous-total</td><td class="r">${money(subtotal)}</td></tr>
      ${order.discount_amount_cents > 0 ? `<tr><td>Remise${order.discount_code ? ` (${esc(order.discount_code)})` : ''}</td><td class="r">- ${money(order.discount_amount_cents)}</td></tr>` : ''}
      <tr><td>Livraison</td><td class="r">${order.shipping_cost_cents > 0 ? money(order.shipping_cost_cents) : 'Gratuite'}</td></tr>
      ${order.tax_cents > 0 ? `<tr><td>${order.tax_included ? 'Dont ' : ''}${esc(store?.settings?.taxes?.name || 'Taxes')} (${esc(order.tax_rate)}%)</td><td class="r">${money(order.tax_cents)}</td></tr>` : ''}
      <tr class="grand"><td>Total</td><td class="r">${money(order.total_cents)}</td></tr>
      <tr><td>Statut du paiement</td><td class="r">${['pending'].includes(order.status) ? 'En attente' : ['cancelled'].includes(order.status) ? 'Annulée' : ['refunded'].includes(order.status) ? 'Remboursée' : 'Payée'}${order.payment_gateway ? ' — ' + esc(order.payment_gateway) : ''}</td></tr>
    </table>` : '';
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${isInvoice ? 'Facture' : 'Bon de livraison'} ${esc(number)}</title>
<style>
 body{font:14px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;color:#202223;margin:40px;max-width:780px}
 h1{font-size:22px;margin:0} .muted{color:#6D7175} .head{display:flex;justify-content:space-between;gap:24px;margin-bottom:28px}
 table{width:100%;border-collapse:collapse} th{text-align:left;font-size:12px;color:#6D7175;border-bottom:2px solid #202223;padding:8px 6px}
 td{padding:8px 6px;border-bottom:1px solid #E1E1E1} .r{text-align:right} .tot{width:320px;margin:18px 0 0 auto} .tot td{border:0;padding:3px 6px}
 .grand td{font-weight:700;font-size:16px;border-top:2px solid #202223;padding-top:8px} .box{border:1px solid #E1E1E1;border-radius:8px;padding:12px;margin-bottom:20px}
 @media print{body{margin:16px}}
</style></head><body>
<div class="head"><div><h1>${esc(store?.name || 'Boutique')}</h1><div class="muted">${esc(store?.settings?.email || '')}${store?.phone ? ' · ' + esc(store.phone) : ''}</div></div>
<div style="text-align:right"><h1>${isInvoice ? 'FACTURE' : 'BON DE LIVRAISON'}</h1><div>${esc(number)}</div><div class="muted">${date}</div></div></div>
<div style="display:flex;gap:16px"><div class="box" style="flex:1"><b>Client</b><br>${esc(order.customer_name || '')}<br>${esc(order.customer_email || '')}${order.customer_phone ? '<br>' + esc(order.customer_phone) : ''}</div>
<div class="box" style="flex:1"><b>Livraison</b><br>${esc(order.shipping_address || order.shipping_city || '—')}${order.tracking_number ? '<br><span class="muted">Suivi : ' + esc(order.tracking_number) + '</span>' : ''}</div></div>
<table><thead><tr><th>Article</th><th class="r">Qté</th>${isInvoice ? '<th class="r">Prix unitaire</th><th class="r">Montant</th>' : '<th class="r">Préparé</th>'}</tr></thead><tbody>${rows}</tbody></table>
${totals}
${order.customer_note ? `<div class="box" style="margin-top:20px"><b>Note du client</b><br>${esc(order.customer_note)}</div>` : ''}
<script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
</body></html>`;
  const w = window.open('', '_blank');
  if (!w) { alert('Autorisez les fenêtres pop-up pour imprimer le document.'); return; }
  w.document.open(); w.document.write(html); w.document.close();
}
