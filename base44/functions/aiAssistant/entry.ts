import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const TASKS = new Set([
  'product_description', 'seo', 'ad_copy', 'email_campaign',
  'social_post', 'business_name', 'product_ideas', 'abandoned_email',
]);

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

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
    });

    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}