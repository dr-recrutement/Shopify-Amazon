import { createClient } from 'jsr:@supabase/supabase-js@2';

// The ONLY place an order gets created. Trusts nothing about price from
// the client - only product_id/variant_id/quantity, looked up against the
// real products table, with the real total computed here.
//
// - Server-side price + discount re-validation. A discount code the customer
//   was shown but that is no longer valid (expired, exhausted by someone else)
//   makes the request fail with 409 instead of silently charging more.
// - Atomic stock reservation (reserve_stock), released on any failure and
//   after 45 minutes for unpaid orders.
// - Real shipping cost from the merchant's shipping_zones by country code.
// - Real tax: per-country rates from tenants.settings.taxes (exclusive or
//   inclusive pricing), stored on the order (tax_cents / tax_rate / tax_included).
// - Discount usage is claimed atomically (claim_discount_use).
// - Customer stats are updated by a DB trigger only when an order becomes 'paid'.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

function errMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return e instanceof Error ? e.message : String(e);
}

interface CartItemIn { product_id: string; variant_id?: string | null; quantity: number; }
interface TaxSettings { enabled?: boolean; default_rate?: number; prices_include_tax?: boolean; tax_shipping?: boolean; rates?: { country: string; rate: number }[]; }

// Mirrors src/lib/tax.js (display on the storefront) - this copy is the authoritative one.
function computeTax(taxes: TaxSettings | undefined, country: string, subtotalCents: number, discountCents: number, shippingCents: number) {
  if (!taxes?.enabled) return { taxCents: 0, rate: 0, included: false };
  const match = (taxes.rates || []).find((r) => r.country && r.country.toLowerCase() === country.toLowerCase());
  const rate = Math.max(0, Math.min(100, Number(match ? match.rate : taxes.default_rate) || 0));
  const included = !!taxes.prices_include_tax;
  if (!rate) return { taxCents: 0, rate: 0, included };
  const base = Math.max(0, subtotalCents - discountCents) + (taxes.tax_shipping ? shippingCents : 0);
  const taxCents = included ? Math.round(base - base / (1 + rate / 100)) : Math.round(base * (rate / 100));
  return { taxCents, rate, included };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let payload: {
    tenant_id?: string; items?: CartItemIn[]; email?: string; first_name?: string; last_name?: string;
    phone?: string; country?: string; country_name?: string; city?: string; address?: string; postal_code?: string;
    discount_code?: string; payment_method_label?: string; cart_id?: string; customer_note?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { tenant_id, items, email } = payload;
  if (!tenant_id || !items?.length) return json({ error: 'tenant_id and at least one item are required' }, 400);
  if (!email || !email.includes('@')) return json({ error: 'A valid email is required' }, 400);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  const reserved: { product_id: string; variant_id: string | null; quantity: number }[] = [];
  const releaseAllReserved = async () => {
    const toRelease = reserved.splice(0, reserved.length);
    for (const r of toRelease) {
      await admin.rpc('release_stock', { p_product_id: r.product_id, p_variant_id: r.variant_id, p_quantity: r.quantity });
    }
  };

  try {
    const { data: tenant } = await admin.from('tenants').select('id, currency, suspended_at, settings').eq('id', tenant_id).maybeSingle();
    if (!tenant) return json({ error: 'Store not found' }, 404);
    if (tenant.suspended_at) return json({ error: 'This store is currently unavailable' }, 403);

    const productIds = [...new Set(items.map((i) => i.product_id))];
    const { data: products, error: prodError } = await admin.from('products').select('id, name, price_cents, stock, variants, status, tenant_id, weight:metafields->>weight, track_inventory:metafields->>track_inventory').in('id', productIds);
    if (prodError) throw prodError;
    const byId = new Map((products || []).map((p) => [p.id, p]));

    const realItems: { product_id: string; variant_id: string | null; product_name: string; quantity: number; price_cents: number }[] = [];
    let subtotalCents = 0;
    let totalWeight = 0;

    for (const it of items) {
      const product = byId.get(it.product_id);
      // A product from another store can never be bought through this store's checkout.
      if (!product || product.tenant_id !== tenant_id) { await releaseAllReserved(); return json({ error: `Un produit du panier n'existe plus.` }, 409); }
      if (product.status !== 'active') { await releaseAllReserved(); return json({ error: `"${product.name}" n'est plus disponible.` }, 409); }
      const qty = Math.max(1, Math.min(999, Math.floor(Number(it.quantity) || 1)));

      let realPriceCents = product.price_cents;
      let variantTitle: string | null = null;
      if (it.variant_id) {
        const variants = Array.isArray(product.variants) ? product.variants : [];
        const v = variants.find((x: { id?: string }) => x.id === it.variant_id);
        if (!v) { await releaseAllReserved(); return json({ error: `Une variante du panier n'existe plus.` }, 409); }
        realPriceCents = Math.round((v.price ?? product.price_cents / 100) * 100) || product.price_cents;
        variantTitle = v.title || null;
      }

      const trackInventory = product.track_inventory !== 'false';
      const { data: reservedOk, error: reserveError } = await admin.rpc('reserve_stock', {
        p_product_id: product.id, p_variant_id: it.variant_id || null, p_quantity: qty, p_track_inventory: trackInventory,
      });
      if (reserveError) throw reserveError;
      if (!reservedOk) {
        await releaseAllReserved();
        return json({ error: `Stock insuffisant pour "${product.name}".` }, 409);
      }
      reserved.push({ product_id: product.id, variant_id: it.variant_id || null, quantity: qty });

      realItems.push({
        product_id: product.id,
        variant_id: it.variant_id || null,
        product_name: variantTitle ? `${product.name} (${variantTitle})` : product.name,
        quantity: qty,
        price_cents: realPriceCents,
      });
      subtotalCents += realPriceCents * qty;
      totalWeight += (Number(product.weight) || 0) * qty;
    }

    let discountCents = 0;
    let discountRow: { id: string } | null = null;
    const discountMessage = "Ce code promo n'est plus valide (expiré, épuisé ou minimum non atteint). Retirez-le et réessayez.";
    if (payload.discount_code) {
      const { data: d } = await admin.from('discount_codes').select('*').eq('tenant_id', tenant_id).ilike('code', payload.discount_code.trim()).eq('is_active', true).maybeSingle();
      if (d) {
        const validMaxUses = !d.max_uses || d.used_count < d.max_uses;
        const validStart = !d.starts_at || new Date(d.starts_at) <= new Date();
        const validExpiry = !d.ends_at || new Date(d.ends_at) >= new Date();
        const validMin = !d.min_amount_cents || subtotalCents >= d.min_amount_cents;
        if (validMaxUses && validStart && validExpiry && validMin) {
          if (d.discount_type === 'percentage') discountCents = Math.round(subtotalCents * (d.value / 100));
          else if (d.discount_type === 'fixed_amount') discountCents = Math.round(d.value * 100);
          discountCents = Math.min(discountCents, subtotalCents);
          discountRow = { id: d.id };
        }
      }
      if (!discountRow) { await releaseAllReserved(); return json({ error: discountMessage }, 409); }
    }

    let shippingCents = 0;
    const countryCode = (payload.country || '').trim();
    if (countryCode) {
      const { data: zones } = await admin.from('shipping_zones').select('*').eq('tenant_id', tenant_id).eq('is_active', true);
      const specific = (zones || []).find((z) => !z.is_global && (z.countries || []).some((c: string) => c.toLowerCase() === countryCode.toLowerCase()));
      const globalZone = (zones || []).find((z) => z.is_global);
      const zone = specific || globalZone;
      if (zone) {
        if (zone.rate_type === 'free') shippingCents = 0;
        else if (zone.rate_type === 'weight_based') shippingCents = Math.round((zone.rate_amount_cents || 0) * Math.max(1, totalWeight));
        else shippingCents = zone.rate_amount_cents || 0;
        if (zone.free_shipping_threshold_cents && subtotalCents >= zone.free_shipping_threshold_cents) shippingCents = 0;
      }
    }

    // Claim the discount use atomically BEFORE creating the order.
    if (discountRow) {
      const { data: claimed } = await admin.rpc('claim_discount_use', { p_discount_id: discountRow.id });
      if (!claimed) { await releaseAllReserved(); return json({ error: discountMessage }, 409); }
    }

    const tax = computeTax(tenant.settings?.taxes, countryCode, subtotalCents, discountCents, shippingCents);
    const totalCents = Math.max(0, subtotalCents + shippingCents - discountCents + (tax.included ? 0 : tax.taxCents));
    const countryLabel = payload.country_name || payload.country || '';
    const shippingAddress = `${payload.address || ''}, ${payload.postal_code || ''} ${payload.city || ''}, ${countryLabel}`.trim();

    const { data: order, error: orderError } = await admin.from('orders').insert({
      tenant_id,
      customer_email: email,
      customer_name: `${payload.first_name || ''} ${payload.last_name || ''}`.trim(),
      customer_phone: payload.phone || null,
      total_cents: totalCents,
      shipping_cost_cents: shippingCents,
      discount_amount_cents: discountCents,
      tax_cents: tax.taxCents,
      tax_rate: tax.rate,
      tax_included: tax.included,
      currency: tenant.currency,
      status: 'pending',
      shipping_address: shippingAddress,
      shipping_city: payload.city || null,
      discount_code: discountRow ? payload.discount_code!.trim().toUpperCase() : null,
      payment_gateway: payload.payment_method_label || 'Manuel',
      customer_note: (payload.customer_note || '').slice(0, 1000) || null,
    }).select().single();
    if (orderError) {
      if (discountRow) await admin.rpc('release_discount_use', { p_discount_id: discountRow.id });
      throw orderError;
    }

    const orderItemsPayload = realItems.map((i) => ({ order_id: order.id, ...i }));
    const { error: itemsError } = await admin.from('order_items').insert(orderItemsPayload);
    if (itemsError) {
      await admin.from('orders').delete().eq('id', order.id);
      if (discountRow) await admin.rpc('release_discount_use', { p_discount_id: discountRow.id });
      throw itemsError;
    }

    fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ mode: 'order_confirmation', tenant_id, order_id: order.id }),
    }).catch(() => {});

    return json({
      order_id: order.id,
      total_cents: totalCents,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      discount_cents: discountCents,
      tax_cents: tax.taxCents,
      tax_included: tax.included,
      currency: tenant.currency,
      items: realItems,
    });
  } catch (e) {
    try { await releaseAllReserved(); } catch (releaseErr) { console.error('release on failure failed:', errMessage(releaseErr)); }
    return json({ error: errMessage(e) }, 500);
  }
});
