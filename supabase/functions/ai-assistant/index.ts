import { createClient } from 'jsr:@supabase/supabase-js@2';

// Real AI content generation. Priority: the merchant's own configured key
// (Gemini -> Claude -> ChatGPT), then Sellia's shared platform key (Gemini)
// as a fallback - clearly labeled, and limited to plans that include the AI
// assistant (pro, enterprise) with a per-store daily quota so the shared key
// cannot be drained by anyone with a store.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const PLATFORM_AI_PLANS = ['pro', 'enterprise'];
const PLATFORM_AI_DAILY_LIMIT = 50;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

async function decryptOne(keyHex: string, stored: string): Promise<string> {
  const [ivHex, ctHex] = stored.split(':');
  const toBytes = (hex: string) => new Uint8Array((hex.match(/.{1,2}/g) || []).map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey('raw', toBytes(keyHex), 'AES-GCM', false, ['decrypt']);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toBytes(ivHex) }, key, toBytes(ctHex));
  return new TextDecoder().decode(plainBuf);
}

const TASK_PROMPTS: Record<string, string> = {
  product_description: "Ecris une fiche produit e-commerce complete en francais pour: {input}\n\nDonne: un titre accrocheur, une description de 3-4 phrases, un resume d'une ligne, et 5 tags separes par des virgules. Formate clairement avec des labels.",
  seo: "Genere une optimisation SEO en francais pour cette page e-commerce: {input}\n\nDonne: un titre SEO (60 caracteres max), une meta-description (155 caracteres max), et 8 mots-cles pertinents.",
  ad_copy: "Ecris une annonce publicitaire Facebook/Instagram en francais pour: {input}\n\nDonne: une accroche courte et percutante, un corps de texte de 2-3 phrases, et un appel a l'action clair.",
  email_campaign: "Ecris un e-mail marketing en francais (objet + corps en HTML simple) pour: {input}",
  social_post: "Ecris un post reseaux sociaux en francais pour: {input}\n\nDonne une legende engageante et 5 hashtags pertinents.",
  business_name: "Propose 10 idees de noms de marque en francais pour: {input}",
  product_ideas: "Propose 8 idees de produits a vendre en ligne pour: {input}",
  abandoned_email: "Ecris un e-mail de recuperation de panier abandonne en francais, chaleureux et incitatif, pour: {input}",
};

async function callClaude(apiKey: string, prompt: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error?.message || 'Claude API error');
  return body.content?.map((c: { text?: string }) => c.text || '').join('') || '';
}

async function callOpenAI(apiKey: string, prompt: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error?.message || 'OpenAI API error');
  return body.choices?.[0]?.message?.content || '';
}

async function callGemini(apiKey: string, prompt: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error?.message || 'Gemini API error');
  return body.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
}

async function getSecretOptional(admin: ReturnType<typeof createClient>, key: string): Promise<string | null> {
  const { data } = await admin.from('platform_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value || null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);
  const asCaller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });

  const { data: userData, error: userError } = await asCaller.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);

  let payload: { action?: string; tenant_id?: string; task?: string; input?: string; context?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (payload.action === 'status') {
    const { tenant_id } = payload;
    if (!tenant_id) return json({ error: 'tenant_id is required' }, 400);
    const { data: tenant } = await asCaller.from('tenants').select('id, plan').eq('id', tenant_id).maybeSingle();
    if (!tenant) return json({ error: "You don't have access to this store" }, 403);
    const { data } = await asCaller.from('tenant_ai_providers').select('provider').eq('tenant_id', tenant_id);
    const status = { gemini: false, claude: false, openai: false };
    (data || []).forEach((r: { provider: string }) => { status[r.provider as keyof typeof status] = true; });
    const platformKey = await getSecretOptional(admin, 'platform_gemini_api_key');
    return json({ status, platform_fallback_available: !!platformKey && PLATFORM_AI_PLANS.includes(tenant.plan) });
  }

  const { tenant_id, task, input, context } = payload;
  if (!tenant_id || !task || !input) return json({ error: 'tenant_id, task and input are required' }, 400);
  if (String(input).length > 4000 || String(context || '').length > 4000) return json({ error: 'Texte trop long' }, 400);

  const { data: tenant, error: tenantError } = await asCaller.from('tenants').select('id, plan').eq('id', tenant_id).maybeSingle();
  if (tenantError || !tenant) return json({ error: "You don't have access to this store" }, 403);

  const promptTemplate = TASK_PROMPTS[task];
  if (!promptTemplate) return json({ error: `Unknown task: ${task}` }, 400);
  const prompt = promptTemplate.replace('{input}', input) + (context ? `\n\nContexte boutique: ${context}` : '');

  try {
    const { data: providers } = await admin.from('tenant_ai_providers').select('provider, api_key_encrypted').eq('tenant_id', tenant_id);
    const order = ['gemini', 'claude', 'openai'];
    const byProvider = Object.fromEntries((providers || []).map((p: { provider: string; api_key_encrypted: string }) => [p.provider, p.api_key_encrypted]));
    const { data: secretRow, error: secretError } = await admin.from('platform_secrets').select('value').eq('key', 'gateway_encryption_key').single();
    if (secretError || !secretRow) throw new Error('Encryption key unavailable');

    for (const provider of order) {
      if (!byProvider[provider]) continue;
      const apiKey = await decryptOne(secretRow.value, byProvider[provider]);
      try {
        const result = provider === 'gemini' ? await callGemini(apiKey, prompt)
          : provider === 'claude' ? await callClaude(apiKey, prompt)
          : await callOpenAI(apiKey, prompt);
        return json({ result, provider });
      } catch (e) {
        console.error(`${provider} (merchant key) failed:`, e instanceof Error ? e.message : e);
        continue;
      }
    }

    // Shared platform key: only for plans that include the AI assistant, with a daily per-store quota.
    const platformKey = await getSecretOptional(admin, 'platform_gemini_api_key');
    if (platformKey && PLATFORM_AI_PLANS.includes(tenant.plan)) {
      const { data: within } = await admin.rpc('consume_ai_quota', { p_tenant_id: tenant_id, p_limit: PLATFORM_AI_DAILY_LIMIT });
      if (!within) return json({ error: `Quota quotidien atteint (${PLATFORM_AI_DAILY_LIMIT} générations/jour avec la clé Sellia). Ajoutez votre propre clé dans Fournisseurs IA pour continuer.` }, 429);
      try {
        const result = await callGemini(platformKey, prompt);
        return json({ result, provider: 'sellia' });
      } catch (e) {
        console.error('platform Gemini fallback failed:', e instanceof Error ? e.message : e);
      }
    } else if (platformKey) {
      return json({ error: "L'assistant IA fourni par Sellia est inclus dans les plans Pro et Enterprise. Ajoutez votre propre clé dans Fournisseurs IA, ou passez à un plan supérieur." }, 403);
    }

    return json({ error: "Impossible de générer du contenu pour l'instant. Configurez votre propre clé dans Fournisseurs IA, ou réessayez plus tard." }, 502);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
