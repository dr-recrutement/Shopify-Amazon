import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Where the password-recovery email link lands. Supabase's JS client
 * detects the recovery token in the URL fragment automatically
 * (detectSessionInUrl, on by default) and fires a PASSWORD_RECOVERY auth
 * event once it has established a session from it — this page waits for
 * that before allowing a new password to be set, and shows a clear
 * error state instead of a broken form if the link is invalid/expired.
 */
export default function ResetPasswordPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    // Also check directly in case the event already fired before this
    // listener was attached (React StrictMode / fast navigation).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => { listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (ready) return;
    const timeout = setTimeout(() => setInvalidLink(true), 4000);
    return () => clearTimeout(timeout);
  }, [ready]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => nav('/app'), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/"><Logo size="lg" /></Link>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          {done ? (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={22} className="text-green-600" />
              </div>
              <h1 className="font-serif-display text-xl font-bold text-gray-900">Mot de passe mis à jour ✓</h1>
              <p className="mt-2 text-sm text-gray-500">Redirection vers votre tableau de bord…</p>
            </div>
          ) : invalidLink ? (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle size={22} className="text-red-600" />
              </div>
              <h1 className="font-serif-display text-xl font-bold text-gray-900">Lien invalide ou expiré</h1>
              <p className="mt-2 text-sm text-gray-500">Redemandez un lien de réinitialisation.</p>
              <Link to="/forgot-password" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">Demander un nouveau lien</Link>
            </div>
          ) : !ready ? (
            <p className="text-center text-sm text-gray-400 py-8">Vérification du lien…</p>
          ) : (
            <>
              <h1 className="font-serif-display text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
              <p className="mt-1 text-sm text-gray-500">Choisissez un nouveau mot de passe pour votre compte.</p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" required minLength={6} value={confirm} onChange={e => setConfirm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-brand-600 text-white font-semibold rounded-full hover:bg-brand-700 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50">
                  {loading ? 'Enregistrement…' : 'Réinitialiser le mot de passe'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
