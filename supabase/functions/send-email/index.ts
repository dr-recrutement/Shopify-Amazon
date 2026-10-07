import { createClient } from 'jsr:@supabase/supabase-js@2';

// Real transactional/marketing email sending via Resend.
//
// Modes:
// - Authenticated merchant campaigns (Marketing.jsx): tenant_id + to + subject + html;
//   caller must own the tenant. When the platform's shared Resend key is used
//   (merchant has no key of their own) sending is capped per store per day so the
//   shared key cannot be used as a spam relay.
// - order_confirmation (guest checkout, no auth): recipient/content derived
//   server-side from the real order rows, sent at most ONCE per order
//   (claim_order_confirmation) - cannot be replayed to spam a customer.
// - automation (pg_cron via pg_net): authenticated with command_center_trigger_secret.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const PLATFORM_KEY_DAILY_LIMIT = 100;
const MAX_RECIPIENTS_PER_CALL = 500;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

function errMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return e instanceof Error ? e.message : String(e);
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function decryptOne(keyHex: string, stored: string): Promise<string> {
  const [ivHex, ctHex] = stored.split(':');
  const toBytes = (hex: string) => new Uint8Array((hex.match(/.{1,2}/g) || []).map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey('raw', toBytes(keyHex), 'AES-GCM', false, ['decrypt']);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toBytes(ivHex) }, key, toBytes(ctHex));
  return new TextDecoder().decode(plainBuf);
}

async function getSecretOptional(admin: ReturnType<typeof createClient>, key: string): Promise<string | null> {
  const { data } = await admin.from('platform_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value || null;
}

async function resolveApiKey(admin: ReturnType<typeof createClient>, tenantId: string): Promise<{ apiKey: string | null; sentAs: 'merchant' | 'platform'; fromAddress: string }> {
  const { data: providerRow } = await admin.from('tenant_email_providers').select('api_key_encrypted, from_email').eq('tenant_id', tenantId).eq('provider', 'resend').maybeSingle();
  let apiKey: string | null = null;
  let sentAs: 'merchant' | 'platform' = 'platform';
  let fromAddress = 'onboarding@resend.dev';

  if (providerRow?.api_key_encrypted) {
    const encRow = await getSecretOptional(admin, 'gateway_encryption_key');
    if (encRow) {
      try {
        apiKey = await decryptOne(encRow, providerRow.api_key_encrypted);
        sentAs = 'merchant';
        if (providerRow.from_email) fromAddress = providerRow.from_email;
      } catch (e) {
        console.error('Failed to decrypt merchant Resend key:', errMessage(e));
      }
    }
  }
  if (!apiKey) apiKey = Deno.env.get('RESEND_API_KEY') || await getSecretOptional(admin, 'platform_resend_api_key');
  return { apiKey, sentAs, fromAddress };
}

async function sendViaResend(apiKey: string, from: string, to: string[], subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Echec de l’envoi (Resend)');
  return body;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  let payload: { mode?: string; tenant_id?: string; order_id?: string; to?: string | string[]; subject?: string; html?: string; from_name?: string; campaign_id?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  try {
    if (payload.mode === 'order_confirmation') {
      const { tenant_id, order_id } = payload;
      if (!tenant_id || !order_id) return json({ error: 'tenant_id and order_id are required' }, 400);

      const { data: order } = await admin.from('orders').select('id, tenant_id, order_number, customer_email, customer_name, total_cents, shipping_cost_cents, discount_amount_cents, discount_code, tax_cents, tax_rate, tax_included, currency').eq('id', order_id).eq('tenant_id', tenant_id).maybeSingle();
      if (!order) return json({ error: 'Order not found' }, 404);
      if (!order.customer_email) return json({ error: 'Order has no customer email' }, 400);

      const { data: claimed } = await admin.rpc('claim_order_confirmation', { p_order_id: order_id });
      if (!claimed) return json({ sent: false, duplicate: true });
      const unclaim = async () => { await admin.from('orders').update({ confirmation_sent_at: null }).eq('id', order_id); };

      try {
        const { data: tenant } = await admin.from('tenants').select('id, name, slug, owner_id, settings').eq('id', tenant_id).maybeSingle();
        if (!tenant) { await unclaim(); return json({ error: 'Store not found' }, 404); }

        const { data: items } = await admin.from('order_items').select('product_name, quantity, price_cents').eq('order_id', order_id);
        const cur = escapeHtml(order.currency || '');
        const money = (c: number) => `${((c || 0) / 100).toFixed(2)} ${cur}`;
        const itemsHtml = (items || []).map((i: { product_name: string; quantity: number; price_cents: number }) =>
          `<tr><td style="padding:6px 0">${escapeHtml(i.product_name)} x${i.quantity}</td><td style="padding:6px 0;text-align:right">${money(i.price_cents * i.quantity)}</td></tr>`
        ).join('');
        const extraRow = (label: string, value: string) => `<tr><td style="padding:6px 0;color:#6D7175">${label}</td><td style="padding:6px 0;text-align:right;color:#6D7175">${value}</td></tr>`;
        const extras = [
          (order.discount_amount_cents || 0) > 0 ? extraRow(`Remise${order.discount_code ? ' (' + escapeHtml(order.discount_code) + ')' : ''}`, '- ' + money(order.discount_amount_cents)) : '',
          (order.shipping_cost_cents || 0) > 0 ? extraRow('Livraison', money(order.shipping_cost_cents)) : '',
          (order.tax_cents || 0) > 0 ? extraRow(`${order.tax_included ? 'Dont taxes' : 'Taxes'} (${order.tax_rate}%)`, money(order.tax_cents)) : '',
        ].join('');
        const orderRef = escapeHtml(String(order.order_number || order.id).slice(0, 8).toUpperCase());
        const totalStr = money(order.total_cents || 0);
        const itemsTable = `<table style="width:100%;border-collapse:collapse;margin:16px 0">${itemsHtml}${extras}</table>`;
        const trackUrl = `https://sellia.liafrik.com/store/${tenant.slug}/order/${order.id}`;
        const html = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Merci pour votre commande !</h2>
        <p>Bonjour ${escapeHtml(order.customer_name || '')},</p>
        <p>Votre commande <strong>#${orderRef}</strong> chez <strong>${escapeHtml(tenant.name)}</strong> a bien été reçue.</p>
        ${itemsTable}
        <p style="font-weight:bold">Total : ${totalStr}</p>
        <p><a href="${trackUrl}" style="display:inline-block;background:#202223;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Suivre ma commande</a></p>
        <p><a href="https://sellia.liafrik.com/store/${tenant.slug}">Retourner à la boutique</a></p>
      </div>`;

        const { apiKey, fromAddress } = await resolveApiKey(admin, tenant_id);
        if (!apiKey) { await unclaim(); return json({ error: 'Email sending not configured' }, 502); }

        const body = await sendViaResend(apiKey, `${tenant.name.replace(/[\r\n<>]/g, '')} <${fromAddress}>`, [order.customer_email], `Confirmation de commande - ${tenant.name}`, html);
        await admin.from('email_log').insert({ tenant_id, to_email: order.customer_email, subject: `Confirmation de commande - ${tenant.name}`, status: 'sent', provider_id: body.id || null });

        const wantsOrderNotif = tenant.settings?.notifications?.order !== false;
        if (wantsOrderNotif && tenant.owner_id) {
          try {
            const { data: ownerUser } = await admin.auth.admin.getUserById(tenant.owner_id);
            const ownerEmail = ownerUser?.user?.email;
            if (ownerEmail) {
              const merchantHtml = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2>Nouvelle commande #${orderRef}</h2>
              <p>${escapeHtml(order.customer_name || 'Un client')} (${escapeHtml(order.customer_email)}) vient de passer commande sur <strong>${escapeHtml(tenant.name)}</strong>.</p>
              ${itemsTable}
              <p style="font-weight:bold">Total : ${totalStr}</p>
              <p><a href="https://sellia.liafrik.com/orders">Voir la commande</a></p>
              <p style="color:#6D7175;font-size:11px;margin-top:16px">Désactivable dans Paramètres → Notifications.</p>
            </div>`;
              await sendViaResend(apiKey, `Sellia <${fromAddress}>`, [ownerEmail], `Nouvelle commande #${orderRef} - ${tenant.name}`, merchantHtml);
              await admin.from('email_log').insert({ tenant_id, to_email: ownerEmail, subject: `Nouvelle commande #${orderRef}`, status: 'sent' });
            }
          } catch (e) {
            console.error('Merchant order notification failed:', errMessage(e));
          }
        }

        return json({ sent: true, id: body.id });
      } catch (e) {
        await unclaim();
        throw e;
      }
    }

    if (payload.mode === 'automation') {
      const provided = (req.headers.get('Authorization') || '').replace('Bearer ', '');
      const { data: secretRow } = await admin.from('platform_secrets').select('value').eq('key', 'command_center_trigger_secret').maybeSingle();
      if (!secretRow?.value || provided !== secretRow.value) return json({ error: 'Unauthorized' }, 401);

      const { tenant_id, to, subject, html, from_name } = payload;
      if (!tenant_id || !to || !subject || !html) return json({ error: 'tenant_id, to, subject and html are required' }, 400);
      const recipients = Array.isArray(to) ? to : [to];
      const { apiKey, fromAddress } = await resolveApiKey(admin, tenant_id);
      if (!apiKey) return json({ error: 'Email sending not configured for this tenant' }, 502);
      const body = await sendViaResend(apiKey, `${(from_name || 'Sellia').replace(/[\r\n<>]/g, '')} <${fromAddress}>`, recipients, subject, html);
      await admin.from('email_log').insert({ tenant_id, to_email: recipients.join(', '), subject, status: 'sent', provider_id: body.id || null });
      return json({ sent: true, id: body.id });
    }

    // Authenticated merchant-campaign mode.
    const authHeader = req.headers.get('Authorization') || '';
    const asCaller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await asCaller.auth.getUser();
    if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);

    const { tenant_id, to, subject, html, from_name } = payload;
    if (!tenant_id || !to || !subject || !html) return json({ error: 'tenant_id, to, subject and html are required' }, 400);

    const { data: tenant } = await admin.from('tenants').select('id, name, owner_id').eq('id', tenant_id).maybeSingle();
    if (!tenant || tenant.owner_id !== userData.user.id) return json({ error: 'Not authorized for this store' }, 403);

    const recipients = Array.isArray(to) ? to : [to];
    if (recipients.length > MAX_RECIPIENTS_PER_CALL) return json({ error: `Maximum ${MAX_RECIPIENTS_PER_CALL} destinataires par envoi.` }, 400);
    const senderName = (from_name || tenant.name || 'Sellia').replace(/[\r\n<>]/g, '');

    const { apiKey, sentAs, fromAddress } = await resolveApiKey(admin, tenant_id);
    if (!apiKey) {
      return json({ error: "L'envoi d'e-mail n'est pas encore configuré. Ajoutez RESEND_API_KEY dans Edge Functions → Secrets, ou connectez votre propre compte Resend dans Paramètres." }, 502);
    }
    if (sentAs === 'platform') {
      const { data: ok } = await admin.rpc('consume_email_quota', { p_tenant_id: tenant_id, p_n: recipients.length, p_limit: PLATFORM_KEY_DAILY_LIMIT });
      if (!ok) return json({ error: `Limite quotidienne atteinte (${PLATFORM_KEY_DAILY_LIMIT} e-mails/jour avec l'envoi Sellia). Connectez votre propre compte Resend dans Paramètres pour envoyer sans limite.` }, 429);
    }

    const body = await sendViaResend(apiKey, `${senderName} <${fromAddress}>`, recipients, subject, html);
    await admin.from('email_log').insert({ tenant_id, to_email: recipients.join(', '), subject, campaign_id: payload.campaign_id || null, status: 'sent', provider_id: body.id || null });
    return json({ sent: true, id: body.id, sent_as: sentAs });
  } catch (e) {
    return json({ error: errMessage(e) }, 500);
  }
});
