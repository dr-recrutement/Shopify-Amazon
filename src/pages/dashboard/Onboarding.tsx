import { useState, FormEvent } from 'react';
import { useAuth } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Button, Input } from './ui';

export default function Onboarding() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('tenants').insert({
      owner_id: user.id,
      name,
      sector,
      country,
      currency: 'XOF',
      plan: 'starter',
      status: 'trial',
      theme_id: 'universal',
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // reload to pick up the new tenant via useTenant
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-montserrat">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bienvenue</h1>
          <p className="text-sm text-gray-500 mt-1">Configurons votre boutique</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nom de la boutique" value={name} onChange={setName} placeholder="Ma Boutique" />
            <Input label="Secteur d'activité" value={sector} onChange={setSector} placeholder="Mode, Électronique…" />
            <Input label="Pays" value={country} onChange={setCountry} placeholder="Côte d'Ivoire" />
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
            <Button type="submit" disabled={loading || !name} className="w-full" size="lg">
              {loading ? 'Création…' : 'Créer ma boutique'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
