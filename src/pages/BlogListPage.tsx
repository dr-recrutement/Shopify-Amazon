import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSeo } from '../lib/seo';
import { FileText } from 'lucide-react';

type PlatformPost = {
  id: string;
  slug: string;
  category: 'blog' | 'academy';
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
};

/**
 * Public listing for /blog and /academy, reading real published rows
 * from platform_posts (public anon SELECT is scoped to status='published'
 * by RLS — see the platform_posts migration). Replaces the previously
 * nonexistent Blog/Académie section entirely; there was no route at all
 * before this.
 */
export default function BlogListPage({ category }: { category: 'blog' | 'academy' }) {
  const isAcademy = category === 'academy';
  useSeo({
    title: isAcademy ? 'Académie' : 'Blog',
    description: isAcademy
      ? 'Guides et tutoriels pour faire grandir votre boutique.'
      : "Actualités et conseils de l'équipe Sellia.",
  });

  const [posts, setPosts] = useState<PlatformPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('platform_posts')
        .select('id,slug,category,title,excerpt,cover_image,published_at')
        .eq('category', category)
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      setPosts((data as PlatformPost[]) || []);
      setLoading(false);
    })();
  }, [category]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">{isAcademy ? 'Académie' : 'Blog'}</h1>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto">
            {isAcademy ? 'Guides et tutoriels pour faire grandir votre boutique.' : "Actualités et conseils de l'équipe Sellia."}
          </p>
        </div>

        {!loading && posts.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <FileText size={32} className="mx-auto mb-3" />
            <p>Aucun article publié pour le moment.</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <Link
              key={post.id}
              to={`/${post.category}/${post.slug}`}
              className="group border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all"
            >
              {post.cover_image ? (
                <img src={post.cover_image} alt={post.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-brand-50 to-emerald-50 flex items-center justify-center">
                  <FileText size={28} className="text-brand-300" />
                </div>
              )}
              <div className="p-5">
                <h3 className="font-bold text-gray-900 group-hover:text-brand-700 transition-colors">{post.title}</h3>
                {post.excerpt && <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{post.excerpt}</p>}
                {post.published_at && (
                  <p className="text-xs text-gray-400 mt-3">{new Date(post.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
