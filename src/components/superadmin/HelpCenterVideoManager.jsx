import { useState, useEffect, useCallback, useRef } from 'react';
import { Video, Upload, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

const BUCKET = 'product-images'; // same bucket already used platform-wide for icon-library etc.
const PREFIX = 'platform/help-center';
const SETTINGS_KEY = 'help_center_tutorial_video';

// Publicly readable via platform_settings' RLS (see
// supabase-help-center-video.sql) — this is what makes it possible for an
// anonymous visitor on /centre-aide to see the video a super admin uploads
// here, without either of them needing a shared login.
export default function HelpCenterVideoManager() {
  const { user } = useAuth();
  const [video, setVideo] = useState(null); // { url, title, updated_at }
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('platform_settings').select('*').eq('key', SETTINGS_KEY).maybeSingle();
    if (data?.value?.url) {
      setVideo(data.value);
      setTitle(data.value.title || '');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const upload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) { setError('Merci de sélectionner un fichier vidéo (MP4, WebM…).'); return; }
    if (file.size > 200 * 1024 * 1024) { setError('La vidéo dépasse 200 Mo — compressez-la avant de la téléverser.'); return; }
    setError(''); setUploading(true); setSaved(false);
    try {
      const ext = (file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
      const path = `${PREFIX}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const value = { url: pub.publicUrl, title: title.trim() || 'Découvrir Sellia', path, updated_at: new Date().toISOString() };
      const { error: upsertError } = await supabase.from('platform_settings').upsert(
        { key: SETTINGS_KEY, value, updated_by: user?.id, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
      if (upsertError) throw upsertError;

      // Best-effort cleanup of the previous file so storage doesn't
      // accumulate an orphaned video every time this is replaced.
      if (video?.path && video.path !== path) {
        await supabase.storage.from(BUCKET).remove([video.path]).catch(() => {});
      }

      await supabase.from('platform_audit_log').insert({
        admin_id: user?.id, admin_email: user?.email, action: 'help_center_video_updated',
        target_type: 'platform_settings', target_id: SETTINGS_KEY,
        new_value: { title: value.title },
      }).catch(() => {}); // audit log is best-effort, never blocks the upload

      setVideo(value);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message || 'Échec du téléversement de la vidéo.');
    } finally { setUploading(false); }
  };

  const removeVideo = async () => {
    if (!video || !confirm('Supprimer la vidéo tutoriel ? Elle disparaîtra du Centre d\u2019aide.')) return;
    setUploading(true);
    try {
      await supabase.storage.from(BUCKET).remove([video.path]).catch(() => {});
      const { error: delError } = await supabase.from('platform_settings').delete().eq('key', SETTINGS_KEY);
      if (delError) throw delError;
      await supabase.from('platform_audit_log').insert({
        admin_id: user?.id, admin_email: user?.email, action: 'help_center_video_removed', target_type: 'platform_settings', target_id: SETTINGS_KEY,
      }).catch(() => {});
      setVideo(null); setTitle('');
    } catch (e) {
      setError(e.message || 'Échec de la suppression.');
    } finally { setUploading(false); }
  };

  const renameOnly = async () => {
    if (!video) return;
    const value = { ...video, title: title.trim() || video.title };
    const { error: upErr } = await supabase.from('platform_settings').update({ value, updated_by: user?.id, updated_at: new Date().toISOString() }).eq('key', SETTINGS_KEY);
    if (upErr) { setError(upErr.message); return; }
    setVideo(value); setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-[#008060] mx-auto" /></div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1"><Video className="w-4 h-4 text-[#008060]" /><h2 className="text-sm font-bold text-[#202223]">Tutoriel vidéo — Centre d'aide</h2></div>
      <p className="text-xs text-[#6D7175] mb-4">La vidéo téléversée ici apparaît publiquement sur <code className="bg-[#F4F4F4] px-1 py-0.5 rounded">/centre-aide</code>, pour tous les visiteurs — même non connectés.</p>

      <div className="bg-white rounded-xl border border-[#E1E1E1] p-5 space-y-4">
        {video ? (
          <div>
            <video src={video.url} controls className="w-full max-w-md rounded-lg bg-black aspect-video" />
            <p className="text-[11px] text-[#6D7175] mt-2">Mise à jour le {new Date(video.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-[#E1E1E1] p-8 text-center">
            <Video className="w-8 h-8 text-[#C9C9C9] mx-auto mb-2" />
            <p className="text-sm text-[#6D7175]">Aucune vidéo tutoriel pour l'instant. Les visiteurs voient un message « bientôt disponible ».</p>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-[#6D7175]">Titre affiché</label>
          <div className="flex gap-2 mt-1">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Découvrir Sellia en 3 minutes" className="flex-1 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" />
            {video && <button onClick={renameOnly} className="text-xs font-semibold text-[#202223] border border-[#E1E1E1] rounded-lg px-3 hover:bg-black/5">Renommer</button>}
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {saved && <p className="text-xs text-[#008060] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Enregistré et visible sur le Centre d'aide.</p>}

        <div className="flex items-center gap-2">
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-[#00694d] disabled:opacity-40">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {video ? 'Remplacer la vidéo' : 'Téléverser une vidéo'}
          </button>
          {video && (
            <button onClick={removeVideo} disabled={uploading} className="flex items-center gap-1.5 text-sm font-semibold text-red-600 border border-[#E1E1E1] px-4 py-2.5 rounded-full hover:bg-red-50 disabled:opacity-40">
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          )}
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </div>
        <p className="text-[11px] text-[#6D7175]">MP4 ou WebM, 200 Mo maximum. Pour un temps de chargement rapide chez vos visiteurs, une vidéo compressée à 1080p suffit largement.</p>
      </div>
    </div>
  );
}
