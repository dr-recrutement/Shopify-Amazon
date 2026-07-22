import { useEffect, useState } from 'react';
import { useAuth, useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { planAllowsCustomDomain } from '../../lib/plans';

interface DomainRow {
  id: string;
  domain: string;
  status: 'pending' | 'verifying' | 'active' | 'failed';
  last_error: string | null;
}

export default function DomainSettings() {
  const { tenant } = useTenant();
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dnsInstructions, setDnsInstructions] = useState<{ target: string } | null>(null);

  const allowed = planAllowsCustomDomain(tenant?.plan);

  const loadDomains = async () => {
    if (!tenant) return;
    const { data } = await supabase.from('domains').select('id,domain,status,last_error').eq('tenant_id', tenant.id);
    setDomains(data || []);
    setLoading(false);
  };

  useEffect(() => { loadDomains(); }, [tenant?.id]);

  const handleConnect = async () => {
    setError(null);
    const domain = newDomain.trim().toLowerCase();
    if (!domain) return;

    setConnecting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const res = await fetch('/api/domains/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue.');
        return;
      }
      setDnsInstructions({ target: data.dns.target });
      setNewDomain('');
      await loadDomains();
    } catch {
      setError('Erreur réseau, veuillez réessayer.');
    } finally {
      setConnecting(false);
    }
  };

  const checkStatus = async (domain: string) => {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    await fetch(`/api/domains/status?domain=${encodeURIComponent(domain)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadDomains();
  };

  if (loading) return <div className="p-6 text-sm text-gray-400">Chargement…</div>;

  if (!allowed) {
    return (
      <div className="p-6 max-w-lg">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Domaine personnalisé</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          Cette fonctionnalité est disponible à partir du forfait <strong>Pro</strong>. Passez à un forfait supérieur pour attacher votre propre domaine (ex: maboutique.com).
        </div>
      </div>
    );
  }

  const statusLabel: Record<DomainRow['status'], string> = {
    pending: 'En attente',
    verifying: 'Vérification DNS en cours…',
    active: 'Actif ✅',
    failed: 'Échec',
  };

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Domaine personnalisé</h2>
        <p className="text-sm text-gray-500">Connectez un domaine que vous avez déjà acheté ailleurs (ex: chez Namecheap, GoDaddy, OVH…).</p>
      </div>

      {domains.map(d => (
        <div key={d.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm text-gray-900">{d.domain}</span>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{statusLabel[d.status]}</span>
          </div>
          {d.status !== 'active' && (
            <button onClick={() => checkStatus(d.domain)} className="mt-2 text-xs text-brand-600 hover:underline">
              Vérifier le statut
            </button>
          )}
          {d.last_error && <p className="mt-2 text-xs text-red-600">{d.last_error}</p>}
        </div>
      ))}

      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <label className="block text-xs font-medium text-gray-700">Ajouter un domaine</label>
        <input
          type="text"
          value={newDomain}
          onChange={e => setNewDomain(e.target.value)}
          placeholder="maboutique.com"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          onClick={handleConnect}
          disabled={connecting || !newDomain.trim()}
          className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium disabled:opacity-50"
        >
          {connecting ? 'Connexion…' : 'Connecter ce domaine'}
        </button>

        {dnsInstructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
            <p className="font-semibold">Configurez chez votre registrar :</p>
            <p>Type: <strong>CNAME</strong></p>
            <p>Nom: <strong>{newDomain || 'votre domaine'}</strong></p>
            <p>Valeur/Cible: <strong>{dnsInstructions.target}</strong></p>
            <p className="pt-1">La vérification peut prendre de quelques minutes à 24h selon votre registrar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
