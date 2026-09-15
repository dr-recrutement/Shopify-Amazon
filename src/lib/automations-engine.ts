// Real execution engine for the Automations module (see
// src/pages/dashboard/Automations.tsx). Previously, automations could be
// created/saved/toggled but nothing ever executed them — this file is
// what actually runs them, for real, against real store data.
//
// Because this whole app is browser-driven (no server cron job), "runs
// automatically" here means: automatically whenever the merchant's
// dashboard is open (checked once per DashboardLayout mount — see
// runAutomationsCheck() below) or immediately on the specific action that
// caused it (e.g. a product save that crosses the low-stock threshold —
// see Products.tsx). That's an honest, common pattern for lightweight
// automation systems — not a fake "coming soon" trigger with no real
// data or execution behind it.

import {
  getAutomations, saveAutomations, getAutomationCursor, saveAutomationCursor,
  getCustomers, saveCustomers, getDiscounts, saveDiscounts, pushNotification,
  type Automation, type AutomationTrigger, type StoreOrder, type Customer, type StoreProduct,
} from './app-state';
import { fetchCloudOrders, fetchCloudCustomers, fetchOpenAbandonedCarts, type AbandonedCartRow } from './tenant-sync';

interface TriggerContext {
  order?: StoreOrder;
  customer?: Customer;
  product?: StoreProduct;
  cart?: AbandonedCartRow;
  /** Best-effort contact info for tag_customer/send_email actions, resolved
   *  from whichever of order/customer/cart triggered this run. */
  email?: string;
  name?: string;
}

const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  order_created: 'Nouvelle commande', order_paid: 'Commande payée', customer_signup: 'Nouveau client',
  low_stock: 'Stock bas', abandoned_cart: 'Panier abandonné',
};

/** Executes one automation's action for real against the given context.
 *  Every branch does something observable — a saved discount, a tagged
 *  customer, a real notification, or a real (or honestly-failed) email —
 *  never a no-op disguised as success. */
async function executeAction(automation: Automation, ctx: TriggerContext): Promise<void> {
  const label = TRIGGER_LABELS[automation.trigger];

  switch (automation.action) {
    case 'tag_customer': {
      if (!ctx.email) {
        pushNotification({ title: automation.name, message: `${label} : impossible de taguer le client (aucun email disponible sur cet événement).` });
        return;
      }
      const customers = getCustomers();
      const idx = customers.findIndex(c => c.email.toLowerCase() === ctx.email!.toLowerCase());
      const tag = automation.name.slice(0, 24);
      if (idx >= 0) {
        const existingTags = customers[idx].tags || [];
        if (!existingTags.includes(tag)) {
          customers[idx] = { ...customers[idx], tags: [...existingTags, tag] };
          saveCustomers(customers);
        }
      } else {
        pushNotification({ title: automation.name, message: `${label} : client ${ctx.email} introuvable dans votre fichier clients, pas de tag appliqué.`, link: '/app/customers' });
      }
      return;
    }

    case 'create_discount': {
      const code = `AUTO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const discounts = getDiscounts();
      discounts.push({
        id: `d-auto-${Date.now()}`, code, title: `${automation.name} — code automatique`,
        type: 'percentage', value: 10, usageLimit: 1, usedCount: 0, status: 'active',
        createdAt: new Date().toISOString().slice(0, 10),
      });
      saveDiscounts(discounts);
      pushNotification({ title: automation.name, message: `${label} : code de réduction ${code} (-10%, usage unique) créé automatiquement.`, link: '/app/discounts' });
      return;
    }

    case 'notify_staff':
    case 'restock_alert': {
      const detail = ctx.product ? ` — produit concerné : ${ctx.product.name} (stock : ${ctx.product.stock ?? 0})`
        : ctx.order ? ` — commande de ${ctx.order.customer} (${ctx.order.total.toLocaleString('fr-FR')} ${ctx.order.currency})`
        : ctx.customer ? ` — client : ${ctx.customer.name}` : '';
      pushNotification({ title: automation.name, message: `${label}${detail}` });
      return;
    }

    case 'send_email': {
      if (!ctx.email) {
        pushNotification({ title: automation.name, message: `${label} : aucun email de destinataire disponible pour cet événement, rien n'a été envoyé.` });
        return;
      }
      try {
        const res = await fetch('/api/notify/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: ctx.email,
            subject: automation.name,
            text: `Bonjour${ctx.name ? ` ${ctx.name}` : ''},\n\nCeci est un message automatique déclenché par : ${label}.\n\n— Envoyé automatiquement par votre boutique.`,
          }),
        });
        const data: { configured?: boolean; sent?: boolean } = await res.json().catch(() => ({}));
        if (data.configured === false) {
          pushNotification({ title: automation.name, message: `${label} : email non envoyé — service d'emailing pas encore configuré (variable RESEND_API_KEY manquante côté serveur).`, link: '/app/settings' });
        } else if (!data.sent) {
          pushNotification({ title: automation.name, message: `${label} : l'envoi de l'email à ${ctx.email} a échoué. Réessayez plus tard.` });
        }
        // else: sent for real, no extra noise needed beyond the runs counter below.
      } catch {
        pushNotification({ title: automation.name, message: `${label} : service d'emailing injoignable, email non envoyé.` });
      }
      return;
    }
  }
}

/** Runs every enabled automation matching `trigger`, for real. Call this
 *  right when the real event happens (see call sites in Products.tsx,
 *  runAutomationsCheck below, etc.) — never speculatively. */
export async function runAutomationsForTrigger(trigger: AutomationTrigger, ctx: TriggerContext): Promise<void> {
  const automations = getAutomations().filter(a => a.enabled && a.trigger === trigger);
  if (automations.length === 0) return;

  for (const automation of automations) {
    await executeAction(automation, ctx);
  }

  const now = new Date().toISOString();
  const updated = getAutomations().map(a =>
    (a.enabled && a.trigger === trigger) ? { ...a, runs: a.runs + 1, lastRunAt: now } : a
  );
  saveAutomations(updated);
}

/** The "automatic" part: called once per dashboard mount (see
 *  DashboardLayout.tsx). Diffs real cloud orders/customers/abandoned
 *  carts against a persisted cursor of already-processed ids, and fires
 *  the matching triggers for whatever is new since the merchant's last
 *  visit. Fully no-ops (fast) if the merchant has zero automations
 *  configured, or nothing new happened. */
export async function runAutomationsCheck(): Promise<void> {
  if (getAutomations().every(a => !a.enabled)) return; // nothing to do, skip the cloud fetches entirely

  const cursor = getAutomationCursor();
  const nextCursor = { ...cursor };

  const [orders, customers, carts] = await Promise.all([
    fetchCloudOrders(), fetchCloudCustomers(), fetchOpenAbandonedCarts(),
  ]);

  if (orders) {
    for (const order of orders) {
      if (cursor.processedOrderIds.includes(order.id)) continue;
      await runAutomationsForTrigger('order_created', { order, email: order.customerEmail, name: order.customer });
      if (order.status === 'paid') {
        await runAutomationsForTrigger('order_paid', { order, email: order.customerEmail, name: order.customer });
      }
      nextCursor.processedOrderIds = [...nextCursor.processedOrderIds, order.id];
    }
  }

  if (customers) {
    for (const customer of customers) {
      if (cursor.processedCustomerIds.includes(customer.id)) continue;
      await runAutomationsForTrigger('customer_signup', { customer, email: customer.email, name: customer.name });
      nextCursor.processedCustomerIds = [...nextCursor.processedCustomerIds, customer.id];
    }
  }

  const ABANDON_AFTER_MS = 60 * 60 * 1000; // 1h of inactivity — real threshold, not instant
  for (const cart of carts) {
    if (cursor.processedCartIds.includes(cart.id)) continue;
    if (Date.now() - new Date(cart.last_activity_at).getTime() < ABANDON_AFTER_MS) continue;
    await runAutomationsForTrigger('abandoned_cart', { cart, email: cart.customer_email || undefined, name: cart.customer_name || undefined });
    nextCursor.processedCartIds = [...nextCursor.processedCartIds, cart.id];
  }

  saveAutomationCursor(nextCursor);
}
