import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, setLocalAuthMode } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemoFallback, setShowDemoFallback] = useState(false);

  const handleDemoMode = async () => {
    setError('');
    setLoading(true);
    setLocalAuthMode(true);
    const demoEmail = email || 'vendeur@demo.liafrikos.com';
    const { error: err } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: 'demopassword'
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    nav('/app');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (err) {
        setError(err.message);
        if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
          setShowDemoFallback(true);
        }
        return;
      }
      nav('/app');
    } catch (e: any) {
      setLoading(false);
      const msg = e?.message || '';
      setError(msg || 'Une erreur est survenue lors de la connexion.');
      if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        setShowDemoFallback(true);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Brand panel — real product visual, not a stock photo pretending to
          be a customer. Desktop only; keeps mobile focused on the form. */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-gray-900 items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative text-white max-w-sm">
          <Logo size="lg" white />
          <h2 className="mt-8 text-3xl font-bold leading-tight">Votre boutique, en ligne, partout dans le monde.</h2>
          <p className="mt-4 text-brand-100 text-sm leading-relaxed">Mobile Money natif, IA intégrée, 0% commission. Rejoignez les vendeurs qui vendent déjà avec Os.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <Link to="/"><Logo size="lg" /></Link>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h1 className="font-serif-display text-2xl font-bold text-gray-900">Connexion</h1>
            <p className="mt-1 text-sm text-gray-500">Accédez à votre boutique</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {error && (
                <div className="flex flex-col gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                  {showDemoFallback && (
                    <div className="mt-1 pt-2 border-t border-red-100">
                      <p className="text-xs text-red-600 mb-2">
                        Le serveur est inaccessible (problème d'environnement ou réseau).
                      </p>
                      <button
                        type="button"
                        onClick={handleDemoMode}
                        className="w-full py-1.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Sparkles size={12} /> Activer le Mode Démo & Se Connecter
                      </button>
                    </div>
                  )}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50">
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
              Pas encore de compte ? <Link to="/register" className="text-brand-600 font-medium hover:underline">Créer ma boutique</Link>
            </p>
          </div>
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-brand-600">← Retour à l'accueil</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
