// Curated, safe Google Fonts set for the theme editor's typography
// dropdown. `css` is exactly what gets stored in theme.fonts.{heading,body}
// (matches the format already used across src/lib/themes.js, so existing
// theme data needs no migration), `google` is the family name used to build
// the Google Fonts stylesheet URL, and `weights` are the variants actually
// requested (covers "plusieurs variantes" - light/regular/bold etc.).
export const FONT_OPTIONS = [
  { css: 'Inter, system-ui, sans-serif', google: 'Inter', label: 'Inter', category: 'Sans-serif', weights: [400, 500, 600, 700] },
  { css: '"Poppins", system-ui, sans-serif', google: 'Poppins', label: 'Poppins', category: 'Sans-serif', weights: [300, 400, 500, 600, 700] },
  { css: '"Manrope", system-ui, sans-serif', google: 'Manrope', label: 'Manrope', category: 'Sans-serif', weights: [400, 500, 600, 700, 800] },
  { css: '"Work Sans", system-ui, sans-serif', google: 'Work Sans', label: 'Work Sans', category: 'Sans-serif', weights: [400, 500, 600, 700] },
  { css: '"Outfit", system-ui, sans-serif', google: 'Outfit', label: 'Outfit', category: 'Sans-serif', weights: [400, 500, 600, 700] },
  { css: '"Space Grotesk", system-ui, sans-serif', google: 'Space Grotesk', label: 'Space Grotesk', category: 'Sans-serif', weights: [400, 500, 600, 700] },
  { css: '"DM Sans", system-ui, sans-serif', google: 'DM Sans', label: 'DM Sans', category: 'Sans-serif', weights: [400, 500, 700] },
  { css: '"Plus Jakarta Sans", system-ui, sans-serif', google: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', category: 'Sans-serif', weights: [400, 500, 600, 700] },
  { css: '"Playfair Display", Georgia, serif', google: 'Playfair Display', label: 'Playfair Display', category: 'Serif', weights: [400, 500, 600, 700] },
  { css: '"Lora", Georgia, serif', google: 'Lora', label: 'Lora', category: 'Serif', weights: [400, 500, 600, 700] },
  { css: '"Cormorant Garamond", Georgia, serif', google: 'Cormorant Garamond', label: 'Cormorant Garamond', category: 'Serif', weights: [400, 500, 600, 700] },
  { css: '"Fraunces", Georgia, serif', google: 'Fraunces', label: 'Fraunces', category: 'Serif', weights: [400, 500, 600, 700] },
  { css: '"Bricolage Grotesque", system-ui, sans-serif', google: 'Bricolage Grotesque', label: 'Bricolage Grotesque', category: 'Display', weights: [400, 500, 700] },
  { css: '"Fraunces", "Playfair Display", serif', google: 'Fraunces', label: 'Fraunces (Display)', category: 'Display', weights: [400, 600, 900] },
  { css: '"JetBrains Mono", monospace', google: 'JetBrains Mono', label: 'JetBrains Mono', category: 'Monospace', weights: [400, 500, 700] },
];

export function getFontOption(css) {
  return FONT_OPTIONS.find((f) => f.css === css) || null;
}

// Injects (or updates) a single <link> tag pulling every font currently in
// use, deduped - safe to call on every render, only touches the DOM when
// the font set actually changes. Works in the editor, the gallery preview,
// and the published storefront alike (fonts.googleapis.com is an allowed
// stylesheet host there).
let lastKey = '';
export function ensureGoogleFonts(fontCssList) {
  if (typeof document === 'undefined') return;
  const opts = fontCssList.map(getFontOption).filter(Boolean);
  if (opts.length === 0) return;
  const key = opts.map((o) => o.google).sort().join('|');
  if (key === lastKey) return;
  lastKey = key;
  const families = [...new Map(opts.map((o) => [o.google, o])).values()]
    .map((o) => `family=${encodeURIComponent(o.google)}:wght@${o.weights.join(';')}`)
    .join('&');
  const href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  let link = document.getElementById('sellia-google-fonts');
  if (!link) {
    link = document.createElement('link');
    link.id = 'sellia-google-fonts';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  link.href = href;
}
