import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const ALLOWED = new Set([
  'announcement', 'header', 'hero', 'productGrid', 'imageText', 'multicolumn',
  'testimonials', 'blogList', 'gallery', 'cta', 'newsletter', 'footer',
  'collectionList', 'trustbar', 'menu', 'pricing',
]);

function isImage(v) {
  return typeof v === 'string' && /^https?:\/\/.+\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(v);
}
function isColor(v) {
  return typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
}

// Build a JSON schema mirroring the section's current content so the LLM
// returns exactly the same shape with improved text values.
function buildSchema(v) {
  if (Array.isArray(v)) {
    return { type: 'array', items: v.length ? buildSchema(v[0]) : { type: 'string' } };
  }
  if (v && typeof v === 'object') {
    const props = {};
    for (const k of Object.keys(v)) props[k] = buildSchema(v[k]);
    return { type: 'object', properties: props, additionalProperties: false };
  }
  if (typeof v === 'number') return { type: 'number' };
  if (typeof v === 'boolean') return { type: 'boolean' };
  return { type: 'string' };
}

// Deep-merge generated content into the original, preserving images, colors
// and numeric values exactly (the LLM is instructed to keep them, but we enforce it).
function merge(orig, gen) {
  if (orig === undefined || orig === null) return orig;
  if (Array.isArray(orig)) {
    return orig.map((item, i) => (Array.isArray(gen) && i < gen.length ? merge(item, gen[i]) : item));
  }
  if (typeof orig === 'object') {
    const out = { ...orig };
    if (gen && typeof gen === 'object' && !Array.isArray(gen)) {
      for (const k of Object.keys(orig)) {
        if (k in gen) out[k] = merge(orig[k], gen[k]);
      }
    }
    return out;
  }
  if (isImage(orig) || isColor(orig)) return orig;
  if (gen === undefined || gen === null) return orig;
  if (typeof gen === 'string' && gen.trim() === '') return orig;
  return gen;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const sectionType = String(body.sectionType || '');
    if (!ALLOWED.has(sectionType)) {
      return Response.json({ error: 'Type de section non supporté' }, { status: 400 });
    }
    const business = String(body.business || 'une boutique en ligne premium').slice(0, 600);
    const currentProps = body.currentProps && typeof body.currentProps === 'object' ? body.currentProps : {};

    const prompt =
      `Tu es un copywriter premium spécialisé en e-commerce et branding pour les marchands africains. ` +
      `Améliore le contenu de la section "${sectionType}" d'un site. ` +
      `Contexte business du marchand : ${business}.\n\n` +
      `Contenu actuel (JSON) :\n${JSON.stringify(currentProps)}\n\n` +
      `Renvoie UNIQUEMENT un objet JSON valide avec EXACTEMENT les mêmes clés et la même structure. ` +
      `Réécris les textes (titres, sous-titres, descriptions, libellés de boutons, noms de produits, citations, noms d'auteurs) ` +
      `pour les rendre premium, percutants, professionnels et adaptés au marché africain, en français. ` +
      `NE change PAS les URLs d'images, les couleurs hex, les valeurs numériques, les émojis ni la longueur des tableaux. ` +
      `Réponds uniquement avec le JSON, sans texte autour ni markdown.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: buildSchema(currentProps),
    });

    const generated = result && typeof result === 'object' ? result : {};
    const merged = merge(currentProps, generated);
    return Response.json({ props: merged });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}