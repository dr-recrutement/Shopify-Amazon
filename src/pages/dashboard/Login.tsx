import { useState, FormEvent } from 'react';
import { useAuth } from '../../lib/hooks';
import { Button, Input } from './ui';
import { Shield } from 'lucide-react';

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
    const { error } = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (error) setError(error.message || 'Une erreur est survenue');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Shield size={28} className="text-brand-500" />
          <span className="text-2xl font-bold text-gray-900 tracking-tight">LiAfrikOS</span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{mode === 'signin' ? 'Connexion' : 'Créer un compte'}</h1>
          <p className="text-sm text-gray-500 mb-5">{mode === 'signin' ? 'Accédez à votre boutique' : 'Lancez votre boutique en ligne'}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="vous@exemple.com" />
            <Input label="Mot de passe" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'Veuillez patienter…' : mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}
            </Button>
          </form>
          <div className="mt-5 text-center">
            <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              {mode === 'signin' ? "Pas encore de compte? S'inscrire" : 'Déjà un compte? Se connecter'}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité</p>
      </div>
    </div>
  );
}
