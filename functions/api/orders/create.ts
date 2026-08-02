// Cloudflare Pages Function — POST /api/orders/create
// Accessible sans authentification (achat invité). Body attendu :
// { tenantId, items: [{ productId, quantity }], customer: { name, email, phone, address } }
//
// Variables d'environnement nécessaires (Cloudflare Pages → Settings → Environment variables) :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Le paiement utilise la clé Flutterwave PROPRE À CHAQUE MARCHAND
// (table vendor_payment_gateways), pas une clé globale — chaque marchand
// reçoit ses paiements directement sur son propre compte Flutterwave.

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'Corps de requête invalide.' }, 400); }

  const { tenantId, items, customer, promoCode } = body || {};
  if (!tenantId || !Array.isArray(items) || items.length === 0) {
    return json({ error: 'Panier invalide.' }, 400);
  }
  if (!customer?.name || !customer?.phone) {
    return json({ error: 'Nom et téléphone du client requis.' }, 400);
  }

  const sbHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  // 1) Re-vérifie les prix réels côté serveur — ne JAMAIS faire confiance
  // aux prix envoyés par le navigateur (facilement manipulables).
  const productIds = items.map((i: any) => i.productId);
  const prodRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/products?select=id,name,price_cents,currency,tenant_id,stock&id=in.(${productIds.join(',')})&tenant_id=eq.${tenantId}&status=eq.active`,
    { headers: sbHeaders }
  );
  const realProducts: any[] = await prodRes.json();

  if (!Array.isArray(realProducts) || realProducts.length === 0) {
    return json({ error: 'Aucun produit valide trouvé pour cette boutique.' }, 400);
  }

  // 1.5) Re-vérifie les VARIANTES (prix éventuellement différent, stock) — même
  // logique anti-triche : jamais confiance au prix/variante envoyés par le client.
  const variantIds = items.map((i: any) => i.variantId).filter(Boolean);
  let realVariants: any[] = [];
  if (variantIds.length > 0) {
    const varRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/product_variants?select=id,product_id,price_cents,stock&id=in.(${variantIds.join(',')})`,
      { headers: sbHeaders }
    );
    realVariants = await varRes.json();
  }

  const orderItems = items
    .map((i: any) => {
      const p = realProducts.find(rp => rp.id === i.productId);
      if (!p) return null;
      const qty = Math.max(1, parseInt(i.quantity) || 1);
      const variant = i.variantId ? realVariants.find(v => v.id === i.variantId && v.product_id === p.id) : null;
      if (i.variantId && !variant) return null; // variante invalide/inexistante
      if (variant && variant.stock < qty) return null; // stock insuffisant
      const priceCents = variant?.price_cents ?? p.price_cents;
      return { product_id: p.id, variant_id: variant?.id || null, product_name: p.name, price_cents: priceCents, quantity: qty };
    })
    .filter(Boolean);

  if (orderItems.length === 0) {
    return json({ error: 'Aucun article valide dans le panier (vérifiez le stock disponible).' }, 400);
  }

  const currency = realProducts[0].currency;
  const subtotalCents = orderItems.reduce((s: number, i: any) => s + i.price_cents * i.quantity, 0);

  // 1.5) Re-valide le code promo CÔTÉ SERVEUR — ne jamais faire confiance à une
  // réduction calculée dans le navigateur (facilement manipulable).
  let discountCents = 0;
  let discountRow: any = null;
  if (promoCode) {
    const discRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/discount_codes?select=*&tenant_id=eq.${tenantId}&code=eq.${encodeURIComponent(String(promoCode).trim().toUpperCase())}&is_active=eq.true`,
      { headers: sbHeaders }
    );
    const discRows = await discRes.json();
    const discount = discRows?.[0];
    const now = new Date();
    const valid =
      discount &&
      (!discount.starts_at || new Date(discount.starts_at) <= now) &&
      (!discount.ends_at || new Date(discount.ends_at) >= now) &&
      (discount.max_uses == null || discount.used_count < discount.max_uses) &&
      (!discount.min_amount_cents || subtotalCents >= discount.min_amount_cents);
    if (valid) {
      discountRow = discount;
      discountCents =
        discount.discount_type === 'percentage'
          ? Math.round((subtotalCents * discount.value) / 100)
          : Math.min(Math.round(discount.value), subtotalCents);
    }
  }

  const totalCents = Math.max(0, subtotalCents - discountCents);

  // 2) Cherche la passerelle Flutterwave active DE CE MARCHAND précis.
  const gwRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/vendor_payment_gateways?select=api_secret_encrypted&tenant_id=eq.${tenantId}&gateway=eq.flutterwave&is_active=eq.true`,
    { headers: sbHeaders }
  );
  const gateways = await gwRes.json();
  const gw = gateways?.[0];
  const paymentConfigured = !!gw?.api_secret_encrypted;

  // 3) Crée la commande
  const orderRes = await fetch(`${env.SUPABASE_URL}/rest/v1/orders`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'return=representation' },
    body: JSON.stringify({
      tenant_id: tenantId,
      customer_name: customer.name,
      customer_email: customer.email || null,
      customer_phone: customer.phone,
      shipping_address: customer.address || null,
      total_cents: totalCents,
      currency,
      status: paymentConfigured ? 'awaiting_payment' : 'pending_payment_setup',
      payment_gateway: paymentConfigured ? 'flutterwave' : null,
    }),
  });

  if (!orderRes.ok) {
    const errText = await orderRes.text();
    return json({ error: 'Erreur lors de la création de la commande.', details: errText }, 500);
  }
  const [order] = await orderRes.json();

  // 4) Crée les lignes de commande
  const itemsRes = await fetch(`${env.SUPABASE_URL}/rest/v1/order_items`, {
    method: 'POST',
    headers: sbHeaders,
    body: JSON.stringify(orderItems.map((i: any) => ({ ...i, order_id: order.id }))),
  });
  if (!itemsRes.ok) {
    const errText = await itemsRes.text();
    return json({ error: "Erreur lors de l'enregistrement des articles.", details: errText }, 500);
  }

  // 4.4) Décrémente le stock — de la variante si l'article en a une, sinon du produit.
  for (const item of orderItems as any[]) {
    if (item.variant_id) {
      const variant = realVariants.find(v => v.id === item.variant_id);
      if (variant) {
        await fetch(`${env.SUPABASE_URL}/rest/v1/product_variants?id=eq.${item.variant_id}`, {
          method: 'PATCH', headers: sbHeaders,
          body: JSON.stringify({ stock: Math.max(0, variant.stock - item.quantity) }),
        });
      }
    } else {
      const product = realProducts.find(p => p.id === item.product_id);
      if (product && typeof product.stock === 'number') {
        await fetch(`${env.SUPABASE_URL}/rest/v1/products?id=eq.${item.product_id}`, {
          method: 'PATCH', headers: sbHeaders,
          body: JSON.stringify({ stock: Math.max(0, product.stock - item.quantity) }),
        });
      }
    }
  }

  // 4.5) Incrémente le compteur d'utilisation du code promo (uniquement s'il a servi).
  if (discountRow) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/discount_codes?id=eq.${discountRow.id}`, {
      method: 'PATCH',
      headers: sbHeaders,
      body: JSON.stringify({ used_count: (discountRow.used_count || 0) + 1 }),
    });
  }

  // 4.6) Envoie l'email de confirmation AVEC LA CLÉ RESEND DU MARCHAND (pas une
  // clé plateforme) — échec silencieux volontaire : un email raté ne doit jamais
  // empêcher la commande d'aboutir.
  if (customer.email) {
    try {
      const emailRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/vendor_email_settings?select=*&tenant_id=eq.${tenantId}&is_active=eq.true`,
        { headers: sbHeaders }
      );
      const emailRows = await emailRes.json();
      const emailCfg = emailRows?.[0];
      if (emailCfg?.api_key_encrypted) {
        const resendKey = atob(emailCfg.api_key_encrypted);
        const itemsHtml = orderItems
          .map((i: any) => `<tr><td style="padding:4px 0">${i.product_name} × ${i.quantity}</td><td style="text-align:right">${i.price_cents * i.quantity} ${currency}</td></tr>`)
          .join('');
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `${emailCfg.from_name} <${emailCfg.from_email}>`,
            to: customer.email,
            subject: `Confirmation de votre commande #${order.id.slice(0, 8)}`,
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:auto">
                <h2>Merci pour votre commande, ${customer.name} !</h2>
                <table style="width:100%;border-collapse:collapse">${itemsHtml}</table>
                <p style="font-weight:bold;text-align:right;margin-top:12px">Total : ${totalCents} ${currency}</p>
                <p style="color:#666;font-size:13px">Numéro de commande : ${order.id}</p>
              </div>
            `,
          }),
        });
      }
    } catch (e) {
      console.error('[orders/create] Erreur envoi email confirmation:', e);
    }
  }

  // Marque la session panier comme "convertie" si elle existait (fin du suivi abandon).
  if (customer.email) {
    fetch(
      `${env.SUPABASE_URL}/rest/v1/cart_sessions?tenant_id=eq.${tenantId}&customer_email=eq.${encodeURIComponent(customer.email)}&status=eq.active`,
      { method: 'PATCH', headers: sbHeaders, body: JSON.stringify({ status: 'converted' }) }
    ).catch(() => { /* non-bloquant */ });
  }

  if (!paymentConfigured) {
    return json({
      success: true,
      orderId: order.id,
      total: totalCents,
      currency,
      paymentUrl: null,
      notice: "Le paiement en ligne n'est pas encore configuré pour cette boutique. La commande a été enregistrée.",
    });
  }

  // 5) Initie le paiement Flutterwave (Standard — page hébergée) AVEC LA CLÉ DU MARCHAND.
  // ⚠️ redirect_url doit inclure order_id ET tenant_id en query params : Flutterwave y
  // ajoutera automatiquement transaction_id/status, et /api/payments/verify exige les 3.
  // ⚠️ Malgré son nom, `total_cents` est en réalité le montant en unité pleine
  // (ex: 25000 = 25 000 XOF), PAS des centimes — voir formatPrice() dans theme-engine.tsx
  // qui ne divise jamais par 100. Ne pas diviser ici non plus.
  const secretKey = atob(gw.api_secret_encrypted);
  const origin = new URL(request.url).origin;
  const txRef = `LA-${order.id}`;
  const fwRes = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tx_ref: txRef,
      amount: totalCents,
      currency,
      redirect_url: `${origin}/order-confirmation/${order.id}?tenant_id=${tenantId}`,
      customer: { email: customer.email || 'client@liafrik.com', phonenumber: customer.phone, name: customer.name },
      customizations: { title: 'Paiement de commande' },
    }),
  });
  const fwData: any = await fwRes.json();

  if (fwData.status !== 'success') {
    console.error('[orders/create] Erreur initiation Flutterwave:', fwData);
    return json({ success: true, orderId: order.id, total: totalCents, currency, paymentUrl: null, error: "Erreur lors de l'initiation du paiement." });
  }

  await fetch(`${env.SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}`, {
    method: 'PATCH',
    headers: sbHeaders,
    body: JSON.stringify({ payment_reference: txRef }),
  });

  return json({ success: true, orderId: order.id, total: totalCents, currency, paymentUrl: fwData.data.link });
};
