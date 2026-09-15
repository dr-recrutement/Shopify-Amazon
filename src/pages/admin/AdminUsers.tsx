import { PageHeader, Card, Badge, Table, EmptyState } from '../dashboard/ui';
import { Users as UsersIcon, RefreshCw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

type AdminUserRow = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  banned: boolean;
  tenants: { id: string; name: string; plan: string; status: string }[];
};

/**
 * Real platform-wide user list for super admins. Replaces the shared
 * AdminGeneric "not built yet" stub. auth.users isn't queryable directly
 * from the client (no PostgREST exposure, and it shouldn't be — it needs
 * the service role), so this calls /api/admin/users, a new backend
 * function using the same super-admin-gated, service-role pattern as
 * functions/api/admin/extend-subscription.ts.
 */
export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Session introuvable.');
      const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${accessToken}` } });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Échec du chargement.');
      setUsers(result.users || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => u.email.toLowerCase().includes(q) || u.tenants.some(t => t.name.toLowerCase().includes(q)));
  }, [users, search]);

  return (
    <div>
      <PageHeader title="Utilisateurs" subtitle="Tous les comptes de la plateforme, avec les boutiques qu'ils possèdent." />

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par email ou boutique..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''}</span>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Actualiser
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
            Erreur de chargement : {error}
          </div>
        )}

        {!loading && filtered.length === 0 && !error ? (
          <EmptyState icon={UsersIcon} title="Aucun utilisateur" desc="Aucun compte ne correspond à cette recherche." />
        ) : (
          <Table headers={['Email', 'Boutique(s)', 'Inscrit le', 'Dernière connexion', 'Statut']}>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-gray-50 last:border-0">
                <td className="py-3 px-4 font-medium text-gray-800">{u.email}</td>
                <td className="py-3 px-4">
                  {u.tenants.length === 0 ? (
                    <span className="text-xs text-gray-400">Aucune</span>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {u.tenants.map(t => (
                        <span key={t.id} className="text-xs text-gray-600">{t.name} <span className="text-gray-400">({t.plan})</span></span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                <td className="py-3 px-4 text-xs text-gray-500">{u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString('fr-FR') : 'Jamais'}</td>
                <td className="py-3 px-4">
                  <Badge color={u.banned ? 'red' : 'green'}>{u.banned ? 'Suspendu' : 'Actif'}</Badge>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
