import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

function orderLines(payload: any): string {
  if (!payload?.items?.length) return '';
  const lines = payload.items.map((i: any) => `- ${i.title || i.name || 'Article'} × ${i.qty || i.quantity || 1} — ${i.price ?? ''}`).join('\n');
  return [lines, payload.total ? `Total: ${payload.total} ${payload.currency || ''}` : '', payload.order_number ? `Commande ${payload.order_number}` : ''].filter(Boolean).join('\n');
}

async function runOne(sr: any, a: any, payload: any, store_id: string) {
  const cfg: any = a.config || {};
  const email = payload?.email;
  try {
    if (a.action === 'send_email') {
      if (!email) return { action: 'send_email', skipped: 'no email' };
      const body = [cfg.email_template || '', orderLines(payload)].filter(Boolean).join('\n\n');
      await sr.integrations.Core.SendEmail({ to: email, subject: cfg.email_subject || a.name, body });
      return { action: 'send_email', to: email };
    }
    if (a.action === 'notify') {
      const store = await sr.entities.Store.get(store_id);
      const to = store?.email;
      if (!to) return { action: 'notify', skipped: 'no store email' };
      await sr.integrations.Core.SendEmail({ to, subject: 'Notification Sellia — ' + a.name, body: [a.name, JSON.stringify(payload, null, 2)].join('\n\n') });
      return { action: 'notify', to };
    }
    if (a.action === 'add_tag') {
      if (!payload?.customer_id) return { action: 'add_tag', skipped: 'no customer' };
      const c = await sr.entities.Customer.get(payload.customer_id);
      const tags = Array.from(new Set([...(c.tags || []), cfg.tag].filter(Boolean)));
      await sr.entities.Customer.update(payload.customer_id, { tags });
      return { action: 'add_tag', tag: cfg.tag };
    }
    if (a.action === 'create_discount') {
      const code = 'AUTO' + Math.random().toString(36).slice(2, 7).toUpperCase();
      await sr.entities.Discount.create({ store_id, code, type: 'percentage', value: cfg.discount_value || 10, status: 'active', applies_to: 'all', used_count: 0 });
      return { action: 'create_discount', code };
    }
    if (a.action === 'update_status') {
      if (!payload?.order_id) return { action: 'update_status', skipped: 'no order' };
      await sr.entities.Order.update(payload.order_id, { status: cfg.status || 'processing' });
      return { action: 'update_status' };
    }
    return { skipped: 'action inconnue' };
  } catch (e: any) {
    return { error: e.message };
  }
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body: any = await req.json().catch(() => ({}));
    const sr = base44.asServiceRole;
    const action = body.action || 'event';

    if (action === 'event') {
      const { store_id, event, payload } = body;
      if (!store_id || !event) return Response.json({ error: 'store_id & event requis' }, { status: 400 });
      const autos = await sr.entities.Automation.filter({ store_id, enabled: true });
      const matching = (autos || []).filter((a: any) => a.trigger === event);
      const results: any[] = [];
      for (const a of matching) {
        results.push(await runOne(sr, a, payload || {}, store_id));
        try { await sr.entities.Automation.update(a.id, { runs_count: (a.runs_count || 0) + 1 }); } catch { /* ignore */ }
      }
      return Response.json({ ok: true, ran: results.length, results });
    }

    if (action === 'sweep') {
      const { store_id } = body;
      if (!store_id) return Response.json({ error: 'store_id requis' }, { status: 400 });
      const carts = await sr.entities.Cart.filter({ store_id, status: 'active' });
      const cutoff = Date.now() - 2 * 60 * 60 * 1000;
      const abandoned = (carts || []).filter((c: any) => new Date(c.updated_date).getTime() < cutoff);
      const autos = await sr.entities.Automation.filter({ store_id, enabled: true, trigger: 'cart_abandoned' });
      let swept = 0;
      for (const c of abandoned) {
        for (const a of autos) {
          await runOne(sr, a, { cart_id: c.id, email: c.customer_email, items: c.items, total: c.total, currency: c.currency }, store_id);
        }
        try { await sr.entities.Cart.update(c.id, { status: 'abandoned' }); } catch { /* ignore */ }
        swept++;
      }
      return Response.json({ ok: true, swept });
    }

    return Response.json({ error: 'action inconnue' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}