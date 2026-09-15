// Cloudflare Pages Function — POST /api/ai/generate
// Server-side proxy for the "Assistant IA" (free AI content space): the
// Gemini API key must never be shipped to the browser, so this endpoint
// holds it (Cloudflare Pages env var) and returns only generated text.
// Mirrors the graceful-fallback pattern used by /api/instagram-feed:
// returns { configured: false } — not an error, not fake content — when
// no key is set, so the client can show an honest setup message instead
// of a broken feature.
//
// Variable d'environnement (Cloudflare Pages → Settings → Environment variables) :
//   GEMINI_API_KEY — clé API Google AI Studio (https://aistudio.google.com/apikey)

interface Env {
  GEMINI_API_KEY?: string;
}

type AiAction = 'product-description' | 'improve-text' | 'seo-title' | 'marketing-tagline';

interface AiRequestBody {
  action?: AiAction;
  productName?: string;
  category?: string;
  keywords?: string;
  existingText?: string;
  tone?: string;
  language?: string;
}

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Builds the instruction sent to Gemini for each supported action. Keeps
 *  prompts in French to match the merchant-facing product (see AGENTS.md
 *  conventions) and constrains length/format so results drop straight
 *  into a product field without further editing. */
function buildPrompt(body: AiRequestBody): { prompt: string; error?: string } {
  const tone = body.tone || 'chaleureux et professionnel';
  const language = body.language || 'français';
  const name = (body.productName || '').trim();
  const category = (body.category || '').trim();
  const keywords = (body.keywords || '').trim();
  const existing = (body.existingText || '').trim();

  switch (body.action) {
    case 'product-description': {
      if (!name) return { prompt: '', error: 'Le nom du produit est requis.' };
      return {
        prompt: `Rédige une description produit e-commerce en ${language}, ton ${tone}, pour un article intitulé "${name}"${category ? ` (catégorie : ${category})` : ''}${keywords ? `. Points à mettre en avant : ${keywords}` : ''}. 2 à 4 phrases, orientée bénéfices client, sans emoji, sans titre, sans guillemets, prête à coller directement dans une fiche produit.`,
      };
    }
    case 'improve-text': {
      if (!existing) return { prompt: '', error: 'Le texte à améliorer est requis.' };
      return {
        prompt: `Réécris et améliore ce texte produit en ${language}, ton ${tone}, en corrigeant la grammaire, en le rendant plus vendeur et plus clair, sans changer les informations factuelles. Réponds uniquement avec le texte réécrit, sans titre ni guillemets.\n\nTexte original :\n"""${existing}"""`,
      };
    }
    case 'seo-title': {
      if (!name) return { prompt: '', error: 'Le nom du produit est requis.' };
      return {
        prompt: `Génère un titre SEO e-commerce en ${language} (60 caractères maximum) pour le produit "${name}"${category ? ` (catégorie : ${category})` : ''}${keywords ? `, incluant si possible : ${keywords}` : ''}. Réponds uniquement avec le titre, sans guillemets ni ponctuation finale.`,
      };
    }
    case 'marketing-tagline': {
      if (!name) return { prompt: '', error: 'Le nom du produit est requis.' };
      return {
        prompt: `Génère 3 accroches marketing courtes (une par ligne, sans numérotation) en ${language}, ton ${tone}, pour promouvoir "${name}"${category ? ` (catégorie : ${category})` : ''} sur les réseaux sociaux. Chaque accroche fait 10 mots maximum, sans emoji, sans guillemets.`,
      };
    }
    default:
      return { prompt: '', error: 'Action IA inconnue.' };
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.GEMINI_API_KEY) {
    return json({ configured: false });
  }

  let body: AiRequestBody;
  try {
    body = await request.json();
  } catch {
    return json({ configured: true, error: 'Corps de requête invalide.' }, 400);
  }

  const { prompt, error } = buildPrompt(body);
  if (error) return json({ configured: true, error }, 400);

  try {
    const res = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 400 },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return json({ configured: true, error: 'ai_api_error', detail: detail.slice(0, 300) }, 502);
    }

    const data: {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    } = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();

    if (!text) return json({ configured: true, error: 'Aucune réponse générée, réessayez.' }, 502);

    return json({ configured: true, text });
  } catch {
    return json({ configured: true, error: 'fetch_failed' }, 502);
  }
};
