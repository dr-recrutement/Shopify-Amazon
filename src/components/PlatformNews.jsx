import { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

const DISMISS_KEY = 'sellia_dismissed_platform_post';

// Reads platform_posts (Super Admin → Communications) - RLS already lets
// any authenticated merchant read published rows. Shows only the single
// latest one, dismissible per-browser (not a real read-receipt system,
// just avoids nagging on every dashboard visit).
export default function PlatformNews() {
  const [post, setPost] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    supabase.from('platform_posts').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        if (data && localStorage.getItem(DISMISS_KEY) !== data.id) setPost(data);
      });
  }, []);

  if (!post || dismissed) return null;

  return (
    <div className="flex items-start gap-3 bg-[#008060]/5 border border-[#008060]/20 rounded-xl px-4 py-3 mb-6">
      <Megaphone className="w-4 h-4 text-[#008060] shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#202223]">{post.title}</p>
        {post.excerpt && <p className="text-xs text-[#6D7175] mt-0.5">{post.excerpt}</p>}
      </div>
      <button
        onClick={() => { localStorage.setItem(DISMISS_KEY, post.id); setDismissed(true); }}
        className="text-[#6D7175] hover:text-[#202223] shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
