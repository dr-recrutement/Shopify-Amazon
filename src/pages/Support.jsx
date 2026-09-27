import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LifeBuoy, Search, BookOpen, Video, MessageSquare, ChevronDown, Mail, Zap, PlayCircle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

const CATEGORY_ICONS = [Zap, BookOpen, LifeBuoy, Zap, BookOpen];

export default function Support() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [openCat, setOpenCat] = useState(0);
  const [openArt, setOpenArt] = useState(null);
  const [tutorial, setTutorial] = useState(null); // { url, title } once a super admin has uploaded one
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // Public, unauthenticated-friendly read (RLS on platform_settings allows
  // anon select) - so this loads the same way whether a merchant is
  // logged in (Settings tab) or a visitor is on the public /centre-aide.
  useEffect(() => {
    supabase.from('platform_settings').select('value').eq('key', 'help_center_tutorial_video').maybeSingle()
      .then(({ data }) => { if (data?.value?.url) setTutorial(data.value); })
      .catch(() => {});
  }, []);

  const categories = t('pages.help.categories', { returnObjects: true }).map((c, i) => ({ ...c, icon: CATEGORY_ICONS[i] }));
  const filtered = categories.map((c) => ({ ...c, articles: c.articles.filter((a) => !query || a.t.toLowerCase().includes(query.toLowerCase()) || a.body.toLowerCase().includes(query.toLowerCase())) })).filter((c) => c.articles.length > 0);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6"><LifeBuoy className="w-5 h-5 text-[#6D7175]" /><h1 className="text-xl font-bold text-[#202223]">{t('pages.help.h1')}</h1></div>

      <div className="flex items-center gap-2 bg-white border border-[#E1E1E1] rounded-lg px-4 py-3 mb-6">
        <Search className="w-5 h-5 text-[#6D7175]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('pages.help.search_placeholder')} className="outline-none text-sm w-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <a href="mailto:support@liafrik.com" className="bg-white rounded-xl border border-[#E1E1E1] p-4 hover:border-[#008060] transition"><Mail className="w-5 h-5 text-[#008060] mb-2" /><p className="text-sm font-bold text-[#202223]">{t('pages.help.contact_title')}</p><p className="text-xs text-[#6D7175]">{t('pages.help.contact_sub')}</p></a>
        {tutorial ? (
          <button onClick={() => setTutorialOpen(true)} className="text-left bg-white rounded-xl border border-[#E1E1E1] p-4 hover:border-[#008060] transition">
            <Video className="w-5 h-5 text-[#008060] mb-2" /><p className="text-sm font-bold text-[#202223]">{t('pages.help.video_title')}</p><p className="text-xs text-[#6D7175]">{tutorial.title || t('pages.help.video_default_sub')}</p>
          </button>
        ) : (
          <div className="bg-white rounded-xl border border-[#E1E1E1] p-4 opacity-70"><Video className="w-5 h-5 text-[#6D7175] mb-2" /><p className="text-sm font-bold text-[#202223]">{t('pages.help.video_title')}</p><p className="text-xs text-[#6D7175]">{t('pages.help.video_soon')}</p></div>
        )}
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><MessageSquare className="w-5 h-5 text-[#008060] mb-2" /><p className="text-sm font-bold text-[#202223]">{t('pages.help.community_title')}</p><p className="text-xs text-[#6D7175]">{t('pages.help.community_sub')}</p></div>
      </div>

      {tutorialOpen && tutorial && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setTutorialOpen(false)}>
          <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-white text-sm font-semibold mb-2 flex items-center gap-2"><PlayCircle className="w-4 h-4" /> {tutorial.title}</p>
            <video src={tutorial.url} controls autoPlay className="w-full rounded-xl bg-black aspect-video" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((cat, ci) => (
          <div key={cat.label} className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
            <button onClick={() => setOpenCat(openCat === ci ? null : ci)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#F4F4F4]">
              <div className="flex items-center gap-2.5"><cat.icon className="w-4 h-4 text-[#008060]" /><span className="text-sm font-bold text-[#202223]">{cat.label}</span><span className="text-xs text-[#6D7175]">({cat.articles.length})</span></div>
              <ChevronDown className={`w-4 h-4 text-[#6D7175] transition-transform ${openCat === ci ? 'rotate-180' : ''}`} />
            </button>
            {openCat === ci && (
              <div className="border-t border-[#E1E1E1] divide-y divide-[#E1E1E1]">
                {cat.articles.map((a, i) => (
                  <div key={i}>
                    <button onClick={() => setOpenArt(openArt === ci + '-' + i ? null : ci + '-' + i)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F4F4] text-left">
                      <span className="text-sm font-medium text-[#202223]">{a.t}</span>
                      <ChevronDown className={`w-4 h-4 text-[#6D7175] transition-transform ${openArt === ci + '-' + i ? 'rotate-180' : ''}`} />
                    </button>
                    {openArt === ci + '-' + i && <div className="px-4 pb-4 text-sm text-[#6D7175] leading-relaxed">{a.body}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
