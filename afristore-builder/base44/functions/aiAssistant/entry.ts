import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const TASKS = new Set([
  'product_description', 'seo', 'ad_copy', 'email_campaign',
  'social_post', 'business_name', 'product_ideas', 'abandoned_email',
]);

const AI_TABLE = 'sellia_ai_keys';

async function readAIKeys(base44: any): Promise<Record<string, string>> {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
  const projRes = await fetch('https://api.supabase.com/v1/projects', { headers: { Authorization: `Bearer ${accessToken}` } });
  const projects = await projRes.json();
  const ref = projects[0]?.ref;
  if (!ref) return {};
  const keysRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const keys = await keysRes.json();
  const serviceKey = (Array.isArray(keys) ? keys.find((k: any) => k.name === 'service_role') : null)?.api_key;
  if (!serviceKey) return {};
  const restBase = `https://${ref}.supabase.co/rest/v1`;
  const restH: Record<string, string> = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const res = await fetch(`${restBase}/${AI_TABLE}?is_active=eq.true&select=provider,api_key`, { headers: restH });
  const rows = await res.json();
  const map: Record<string, string> = {};
  for (const r of rows || []) if (r.api_key) map[r.provider] = r.api_key;
  return map;
}

async function callGemini(key: string, prompt: string, schema: any) {
  const body: any = { contents: [{ parts: [{ text: prompt }] }] };
  if (schema) body.generationConfig = { responseMimeType: 'application/json', responseSchema: schema };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return schema && text ? JSON.parse(text) : text;
}

async function callClaude(key: string, prompt: string, schema: any) {
  const sys = schema ? `Réponds uniquement avec un JSON valide respectant ce schéma: ${JSON.stringify(schema)}` : '';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 1500, ...(sys ? { system: sys } : {}), messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text;
  return schema && text ? JSON.parse(text) : text;
}

async function callOpenAI(key: string, prompt: string, schema: any) {
  const content = schema ? `${prompt}\n\nRéponds uniquement avec un objet JSON valide.` : prompt;
  const body: any = { model: 'gpt-4o-mini', messages: [{ role: 'user', content }] };
  if (schema) body.response_format = { type: 'json_object' };
  const res = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  return schema && text ? JSON.parse(text) : text;
}

async function callAI(base44: any, prompt: string, schema: any) {
  let keys: Record<string, string> = {};
  try { keys = await readAIKeys(base44); } catch {}
  if (keys.gemini) { try { return await callGemini(keys.gemini, prompt, schema); } catch {} }
  if (keys.claude) { try { return await callClaude(keys.claude, prompt, schema); } catch {} }
  if (keys.openai) { try { return await callOpenAI(keys.openai, prompt, schema); } catch {} }
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
  return result;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const task = String(body.task || '');
    if (!TASKS.has(task)) {
      return Response.json({ error: 'Tâche non supportée' }, { status: 400 });
    }

    const input = String(body.input || '').slice(0, 1200);
    const context = String(body.context || '').slice(0, 600);
    const lang = body.lang === 'en' ? 'en anglais' : 'en français, adapté au marché africain';

    let prompt = '';
    let schema = null;

    switch (task) {
      case 'product_description':
        schema = {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            short_description: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
          },
          additionalProperties: false,
        };
        prompt = `Tu es un copywriter e-commerce premium. Génère une fiche produit attrayante ${lang}.\nProduit: ${input}\nContexte boutique: ${context}\nRenvoie un JSON avec title, description (2-3 paragraphes HTML), short_description (1 phrase), tags (5 mots-clés).`;
        break;
      case 'seo':
        schema = {
          type: 'object',
          properties: {
            seo_title: { type: 'string' },
            seo_description: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
          },
          additionalProperties: false,
        };
        prompt = `Tu es un expert SEO e-commerce. Optimise le référencement ${lang}.\nPage/produit: ${input}\nRenvoie un JSON avec seo_title (max 60 caractères), seo_description (max 160 caractères), keywords (8 mots-clés).`;
        break;
      case 'ad_copy':
        schema = {
          type: 'object',
          properties: {
            headline: { type: 'string' },
            body: { type: 'string' },
            cta: { type: 'string' },
          },
          additionalProperties: false,
        };
        prompt = `Tu es un expert en publicité Facebook/Instagram. Crée une annonce percutante ${lang}.\nProduit/offre: ${input}\nContexte: ${context}\nRenvoie un JSON avec headline (accroche), body (texte de l'annonce), cta (appel à l'action).`;
        break;
      case 'email_campaign':
        schema = {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            body: { type: 'string' },
          },
          additionalProperties: false,
        };
        prompt = `Tu es un expert en email marketing. Rédige une campagne e-mail ${lang}.\nSujet/offre: ${input}\nRenvoie un JSON avec subject (ligne d'objet accrocheuse) et body (HTML du corps, professionnel et chaleureux).`;
        break;
      case 'social_post':
        schema = {
          type: 'object',
          properties: {
            caption: { type: 'string' },
            hashtags: { type: 'array', items: { type: 'string' } },
          },
          additionalProperties: false,
        };
        prompt = `Tu es un community manager. Crée un post réseaux sociaux ${lang}.\nSujet: ${input}\nRenvoie un JSON avec caption (texte engageant avec émojis) et hashtags (8 hashtags pertinents).`;
        break;
      case 'business_name':
        schema = {
          type: 'object',
          properties: {
            names: { type: 'array', items: { type: 'string' } },
          },
          additionalProperties: false,
        };
        prompt = `Tu es un expert en branding. Propose 10 noms de marque premium et mémorables ${lang}.\nDescription de l'activité: ${input}\nRenvoie un JSON avec names (tableau de 10 noms, modernes et uniques).`;
        break;
      case 'product_ideas':
        schema = {
          type: 'object',
          properties: {
            ideas: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, reason: { type: 'string' } }, additionalProperties: false } },
          },
          additionalProperties: false,
        };
        prompt = `Tu es un consultant e-commerce. Suggère 8 idées de produits à vendre ${lang}.\nNiche/marché: ${input}\nRenvoie un JSON avec ideas (tableau de {name, reason} — nom du produit + pourquoi il marcherait).`;
        break;
      case 'abandoned_email':
        schema = {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            body: { type: 'string' },
          },
          additionalProperties: false,
        };
        prompt = `Tu es un expert en récupération de paniers abandonnés. Rédige un e-mail de relance ${lang}.\nBoutique: ${input}\nRenvoie un JSON avec subject (objet accrocheur) et body (HTML, ton amical et incitatif, avec un CTA pour finaliser la commande).`;
        break;
    }

    const result = await callAI(base44, prompt, schema);

    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}