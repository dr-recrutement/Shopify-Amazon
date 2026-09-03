// Cloudflare Pages Function — GET /api/instagram-feed
// Server-side proxy for the Instagram Graph API: the long-lived access
// token must never be shipped to the browser, so this endpoint holds it
// (Cloudflare Pages env var) and returns only the public fields the feed
// widget needs. Returns { configured: false } — not an error, not fake
// posts — when no token is set, so the client can show an honest
// "Suivez-nous" fallback instead of empty/broken image tiles.
//
// Variables d'environnement (Cloudflare Pages → Settings → Environment variables) :
//   IG_ACCESS_TOKEN   — token longue durée généré via Meta for Developers
//                        (Instagram Graph API, permission instagram_basic)
//   IG_USER_ID        — l'ID du compte professionnel/créateur Instagram

interface Env {
  IG_ACCESS_TOKEN?: string;
  IG_USER_ID?: string;
}

interface IGMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' }, // 30 min — Instagram doesn't post fast enough to need less
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.IG_ACCESS_TOKEN || !env.IG_USER_ID) {
    return json({ configured: false, media: [] });
  }

  try {
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
    const res = await fetch(
      `https://graph.instagram.com/${env.IG_USER_ID}/media?fields=${fields}&limit=6&access_token=${env.IG_ACCESS_TOKEN}`
    );
    if (!res.ok) return json({ configured: true, media: [], error: 'instagram_api_error' }, 502);
    const data: { data: IGMedia[] } = await res.json();
    const media = (data.data || [])
      .filter(m => m.media_type !== 'VIDEO' || m.thumbnail_url) // need a still image to show
      .slice(0, 6)
      .map(m => ({
        id: m.id,
        imageUrl: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url,
        permalink: m.permalink,
        caption: (m.caption || '').slice(0, 120),
      }));
    return json({ configured: true, media });
  } catch {
    return json({ configured: true, media: [], error: 'fetch_failed' }, 502);
  }
};
