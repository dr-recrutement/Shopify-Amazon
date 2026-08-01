// Cloudflare Pages Function — POST /api/cart-sessions/send-reminders
// ⚠️ Cette fonction ne s'exécute PAS toute seule sur un horaire — Cloudflare
// Pages Functions n'a pas de "cron" intégré. Il faut qu'un service externe
// appelle cette URL périodiquement (ex: cron-job.org, gratuit, appel toutes
// les heures). Voir les instructions données par Claude pour la configurer.
//
// Repère les paniers "active" depuis plus d'1h sans commande passée, envoie
// une relance par email AVEC LA CLÉ RESEND DU MARCHAND CONCERNÉ, marque le
// panier "reminded" pour ne jamais relancer deux fois.
//
// Variables d'environnement: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const sbHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const sessionsRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/cart_sessions?select=*&status=eq.active&updated_at=lt.${oneHourAgo}`,
    { headers: sbHeaders }
  );
  const sessions: any[] = await sessionsRes.json();

  let sent = 0;
  for (const session of sessions) {
    try {
      const emailRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/vendor_email_settings?select=*&tenant_id=eq.${session.tenant_id}&is_active=eq.true`,
        { headers: sbHeaders }
      );
      const emailRows = await emailRes.json();
      const emailCfg = emailRows?.[0];
      if (!emailCfg?.api_key_encrypted) continue;

      const resendKey = atob(emailCfg.api_key_encrypted);
      const itemsHtml = (session.items || [])
        .map((i: any) => `<li>${i.name} × ${i.quantity}</li>`)
        .join('');

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `${emailCfg.from_name} <${emailCfg.from_email}>`,
          to: session.customer_email,
          subject: 'Vous avez oublié quelque chose dans votre panier',
          html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2>Il vous reste des articles dans votre panier</h2>
            <ul>${itemsHtml}</ul>
            <p style="font-weight:bold">Total : ${session.total_cents} ${session.currency}</p>
          </div>`,
        }),
      });

      await fetch(`${env.SUPABASE_URL}/rest/v1/cart_sessions?id=eq.${session.id}`, {
        method: 'PATCH', headers: sbHeaders, body: JSON.stringify({ status: 'reminded' }),
      });
      sent++;
    } catch (e) {
      console.error('[cart-sessions/send-reminders] Erreur pour session', session.id, e);
    }
  }

  return json({ processed: sessions.length, sent });
};
