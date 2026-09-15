// Cloudflare Pages Function — POST /api/notify/send-email
// Real destination for the automations engine's 'send_email' action (see
// src/lib/automations-engine.ts). Same graceful-fallback shape as
// /api/ai/generate: returns { configured: false } — not an error, not a
// fake "sent" response — when no provider key is set, so the caller can
// be honest with the merchant instead of claiming an email went out.
//
// Variable d'environnement (Cloudflare Pages → Settings → Environment variables) :
//   RESEND_API_KEY — clé API Resend (https://resend.com/api-keys)
//   RESEND_FROM_EMAIL — adresse d'expédition vérifiée sur Resend (optionnel,
//     repli sur onboarding@resend.dev qui ne délivre qu'à l'adresse du
//     compte Resend — à remplacer par un domaine vérifié en production)

interface Env {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
}

interface SendEmailBody {
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.RESEND_API_KEY) {
    return json({ configured: false });
  }

  let body: SendEmailBody;
  try {
    body = await request.json();
  } catch {
    return json({ configured: true, error: 'Corps de requête invalide.' }, 400);
  }

  const to = (body.to || '').trim();
  const subject = (body.subject || '').trim();
  if (!to || !subject || (!body.html && !body.text)) {
    return json({ configured: true, error: 'Destinataire, objet et contenu requis.' }, 400);
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [to],
        subject,
        html: body.html || undefined,
        text: body.text || undefined,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return json({ configured: true, error: 'email_api_error', detail: detail.slice(0, 300) }, 502);
    }

    return json({ configured: true, sent: true });
  } catch {
    return json({ configured: true, error: 'fetch_failed' }, 502);
  }
};
