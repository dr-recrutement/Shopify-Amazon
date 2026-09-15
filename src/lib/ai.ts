// Client helper for the "Assistant IA" free content space — thin wrapper
// around POST /api/ai/generate (see functions/api/ai/generate.ts). Kept
// framework-agnostic so it can be called both from the AI Studio page and
// from inline "Améliorer avec l'IA" buttons elsewhere (e.g. Products).

export type AiAction = 'product-description' | 'improve-text' | 'seo-title' | 'marketing-tagline';

export interface AiGenerateRequest {
  action: AiAction;
  productName?: string;
  category?: string;
  keywords?: string;
  existingText?: string;
  tone?: string;
  language?: string;
}

export type AiGenerateResult =
  | { ok: true; text: string }
  | { ok: false; notConfigured: true }
  | { ok: false; notConfigured: false; error: string };

export async function generateAIContent(req: AiGenerateRequest): Promise<AiGenerateResult> {
  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    const data: { configured?: boolean; text?: string; error?: string } = await res.json().catch(() => ({}));

    if (data.configured === false) return { ok: false, notConfigured: true };
    if (!res.ok || data.error || !data.text) {
      return { ok: false, notConfigured: false, error: data.error || 'Une erreur est survenue. Réessayez.' };
    }
    return { ok: true, text: data.text };
  } catch {
    return { ok: false, notConfigured: false, error: 'Connexion au service IA impossible. Vérifiez votre réseau.' };
  }
}
