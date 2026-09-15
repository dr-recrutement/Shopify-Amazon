import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSeo } from '../lib/seo';
import { ArrowLeft } from 'lucide-react';

type PlatformPost = {
  id: string;
  slug: string;
  category: 'blog' | 'academy';
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  author_name: string | null;
  published_at: string | null;
};

/** Public detail page for /blog/:slug and /academy/:slug. Content is
 *  stored as plain text/simple markdown-ish paragraphs (no rich renderer
 *  wired up yet) — rendered as paragraphs split on blank lines. */
export default function BlogPostPage({ category }: { category: 'blog' | 'academy' }) {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<PlatformPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setNotFound(false);
      const { data } = await supabase
        .from('platform_posts')
        .select('id,slug,category,title,excerpt,content,cover_image,author_name,published_at')
        .eq('category', category)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      if (!data) setNotFound(true);
      setPost((data as PlatformPost) || null);
      setLoading(false);
    })();
  }, [category, slug]);

  useSeo({
    title: post?.title || (category === 'academy' ? 'Académie' : 'Blog'),
    description: post?.excerpt || '',
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <Link to={`/${category}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-8">
          <ArrowLeft size={14} /> Retour {category === 'academy' ? "à l'Académie" : 'au Blog'}
        </Link>

        {!loading && notFound && (
          <p className="text-gray-500">Cet article n'existe pas ou n'est pas encore publié.</p>
        )}

        {post && (
          <article>
            {post.cover_image && <img src={post.cover_image} alt={post.title} className="w-full h-64 object-cover rounded-2xl mb-8" />}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">{post.title}</h1>
            <p className="text-xs text-gray-400 mt-3">
              {post.author_name && <>{post.author_name} · </>}
              {post.published_at && new Date(post.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <div className="prose prose-gray max-w-none mt-8 text-gray-700 leading-relaxed space-y-4">
              {post.content.split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)}
            </div>
          </article>
        )}
      </div>
      <Footer />
    </div>
  );
}
