// Cloudflare Pages Function — POST /api/discounts/apply
// Increments a discount's real used_count. Deliberately separate from
// /api/discounts/validate: validation happens every time a shopper
// types a code (checking it shouldn't count as using it), this only
// runs once an order is actually placed with that code — otherwise a
// usage-limited code could be exhausted by people just checking if it
// works, without ever buying anything.

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface Body {
  discountId?: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: Body;
  try { body = await request.json(); } catch { return json({ ok: false }, 400); }
  if (!body.discountId) return json({ ok: false }, 400);

  try {
    const currentRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/discounts?select=used_count&id=eq.${body.discountId}`,
      { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } }
    );
    const rows: Array<{ used_count: number }> = currentRes.ok ? await currentRes.json() : [];
    const current = rows[0]?.used_count ?? 0;

    await fetch(`${env.SUPABASE_URL}/rest/v1/discounts?id=eq.${body.discountId}`, {
      method: 'PATCH',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ used_count: current + 1 }),
    });
    return json({ ok: true });
  } catch {
    return json({ ok: false });
  }
};
