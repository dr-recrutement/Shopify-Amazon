import { useEffect, useState } from 'react';
import { Instagram } from 'lucide-react';

const IG_PROFILE_URL = 'https://www.instagram.com/liafrik_tech?igsi=eXBjdTc5NG42Zml4&utm_source=qr';

interface IGPost {
  id: string;
  imageUrl: string;
  permalink: string;
  caption: string;
}

/** Shows the platform's real recent Instagram posts when the server has a
 *  configured access token (see functions/api/instagram-feed.ts). When it
 *  isn't configured — the current state — this renders a plain "follow us"
 *  card instead of placeholder tiles, since fabricated post images would
 *  misrepresent the account. */
export function InstagramFeed() {
  const [state, setState] = useState<{ loading: boolean; configured: boolean; posts: IGPost[] }>({
    loading: true,
    configured: false,
    posts: [],
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/instagram-feed')
      .then(res => res.json())
      .then((data: { configured: boolean; media: IGPost[] }) => {
        if (cancelled) return;
        setState({ loading: false, configured: !!data.configured, posts: data.media || [] });
      })
      .catch(() => { if (!cancelled) setState({ loading: false, configured: false, posts: [] }); });
    return () => { cancelled = true; };
  }, []);

  if (state.loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square rounded-lg bg-gray-800" />)}
      </div>
    );
  }

  if (!state.configured || state.posts.length === 0) {
    return (
      <a
        href={IG_PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl border border-gray-800 bg-gray-800/40 px-6 py-5 text-sm font-semibold text-gray-300 hover:text-white hover:border-gray-700 transition-colors"
      >
        <Instagram size={18} /> Suivez @liafrik_tech sur Instagram
      </a>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {state.posts.map(post => (
        <a
          key={post.id}
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          title={post.caption || 'Voir sur Instagram'}
          className="group relative aspect-square overflow-hidden rounded-lg"
        >
          <img src={post.imageUrl} alt={post.caption || 'Publication Instagram'} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <Instagram size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </a>
      ))}
    </div>
  );
}
