import { useState, FormEvent } from 'react';
import { useAuth } from '../../lib/hooks';
import { Button, Input } from './ui';
import { AlertTriangle, Sparkles, CheckCircle } from 'lucide-react';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    try {
      const { error: authError } = mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password);

      if (authError) {
        setError(authError.message || 'Une erreur est survenue lors de la connexion.');
      }
    } catch (err: any) {
      setError("Erreur de réseau : Impossible d'établir une connexion avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 font-sans selection:bg-orange-500 selection:text-white animate-fade-in">
      {/* Left decorative brand panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Animated fluid blur elements for a premium layout */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

        <div className="flex items-center gap-3 relative z-10">
          <img src="/assets/images/publicicon-512.png" alt="Os logo" className="h-10 w-10 object-contain bg-white rounded-xl p-1.5 shadow-sm" />
          <span className="text-3xl font-black tracking-tight">Os</span>
        </div>

        <div className="my-auto space-y-6 relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase">
            <Sparkles size={12} className="text-amber-300 animate-pulse" /> La Révolution E-commerce d'Afrique et du Monde
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Créez votre boutique d'excellence en 2 minutes.
          </h2>
          <p className="text-lg text-orange-50/90 leading-relaxed font-light">
            Une plateforme multi-tenant sur-mesure avec CMS visuel Shopify-grade, thèmes pré-configurés et noms de domaines personnalisés gratuits pour tous.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2 text-sm text-orange-100">
              <CheckCircle size={16} className="text-amber-300 shrink-0" />
              <span>0% commission, toujours</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-orange-100">
              <CheckCircle size={16} className="text-amber-300 shrink-0" />
              <span>Domaines personnalisés inclus</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-orange-100">
              <CheckCircle size={16} className="text-amber-300 shrink-0" />
              <span>Thèmes Premium Régionaux</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-orange-100">
              <CheckCircle size={16} className="text-amber-300 shrink-0" />
              <span>Support Client Interactif</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-orange-100/70 relative z-10">
          © {new Date().getFullYear()} Os Corp. Développé pour propulser l'excellence digitale.
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile branding header */}
          <div className="md:hidden flex flex-col items-center gap-2 text-center">
            <img src="/assets/images/publicicon-512.png" alt="Os logo" className="h-12 w-12 object-contain bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100" />
            <span className="text-3xl font-black text-gray-900 tracking-tight">Os</span>
            <p className="text-xs text-gray-500 font-medium">La plateforme e-commerce tout-en-un</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xl shadow-gray-100/50 p-8 space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {mode === 'signin' ? 'Heureux de vous revoir !' : 'Commencez gratuitement'}
              </h1>
              <p className="text-sm text-gray-500">
                {mode === 'signin' ? 'Accédez à votre espace marchand personnel.' : 'Profitez de 7 jours d\'essai gratuit sans carte bancaire.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Adresse e-mail"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="vous@exemple.com"
              />
              <Input
                label="Mot de passe"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
              />

              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 flex gap-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white transition-all py-3 rounded-xl font-bold" size="lg">
                {loading ? 'Veuillez patienter…' : mode === 'signin' ? 'Se connecter' : 'Créer ma boutique'}
              </Button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
                className="text-sm text-orange-600 hover:text-orange-700 font-semibold underline underline-offset-4"
              >
                {mode === 'signin' ? "Pas encore de compte ? Créer une boutique" : 'Déjà inscrit ? Connectez-vous'}
              </button>
            </div>
          </div>

          <div className="flex justify-center gap-6 text-xs text-gray-400 font-medium">
            <a href="/" className="hover:text-gray-600">Retour à l'accueil</a>
            <span>•</span>
            <a href="/help" className="hover:text-gray-600">Centre d'aide</a>
            <span>•</span>
            <a href="/support" className="hover:text-gray-600">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
