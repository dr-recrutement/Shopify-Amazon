import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isLocalAuthMode } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

/**
 * Real "forgot password" flow — previously there was no way anywhere in
 * the app for a user who forgot their password to recover their
 * account; LoginPage had no link, and nothing called
 * supabase.auth.resetPasswordForEmail. This is that missing piece.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLocalAuthMode()) {
      // Local demo mode has no real backend account to send a reset
      // email to — say so honestly rather than showing a fake "email
      // sent" confirmation that will never arrive.
      setError("Le mode démo n'a pas de compte réel associé à un email — la réinitialisation de mot de passe n'est pas disponible dans ce mode.");
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (err) { setError(err.message); return; }
      setSent(true);
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || 'Une erreur est survenue.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/"><Logo size="lg" /></Link>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={22} className="text-green-600" />
              </div>
              <h1 className="font-serif-display text-xl font-bold text-gray-900">Vérifiez votre boîte mail</h1>
              <p className="mt-2 text-sm text-gray-500">
                Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient d'être envoyé.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-serif-display text-2xl font-bold text-gray-900">Mot de passe oublié ?</h1>
              <p className="mt-1 text-sm text-gray-500">Entrez votre email, nous vous enverrons un lien de réinitialisation.</p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-brand-600 text-white font-semibold rounded-full hover:bg-brand-700 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50">
                  {loading ? 'Envoi…' : 'Envoyer le lien'}
                </button>
              </form>
            </>
          )}
          <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-brand-600">
            <ArrowLeft size={14} /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
