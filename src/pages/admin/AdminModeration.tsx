import { PageHeader, Card, Badge, Button, Table } from '../dashboard/ui';
import { Ban, RotateCcw, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';

type TenantRow = { id: string; name: string; slug: string | null; status: string; plan: string; created_at: string };

/** Real suspend/reactivate confirmation — calls
 *  /api/admin/toggle-tenant-status (verifies super admin server-side,
 *  writes with the service role, logs to audit_logs). Previously nothing
 *  in the app could perform this action at all: Boutiques only ever
 *  displayed the status badge, and Modération was an AdminGeneric
 *  "not built yet" stub. */
function ConfirmModal({ tenant, action, onClose, onDone }: { tenant: TenantRow; action: 'suspend' | 'reactivate'; onClose: () => void; onDone: (tenantId: string, status: string) => void }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const res = await fetch('/api/admin/toggle-tenant-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ tenantId: tenant.id, action, reason: reason || undefined }),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.error || 'Erreur.'); setSaving(false); return; }
      onDone(tenant.id, result.status);
      showToast(action === 'suspend' ? `${tenant.name} suspendue ✓` : `${tenant.name} réactivée ✓`, 'success');
      onClose();
    } catch {
      setError('Connexion au serveur impossible.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${action === 'suspend' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {action === 'suspend' ? <Ban size={16} /> : <RotateCcw size={16} />}
          </div>
          <h3 className="font-semibold text-gray-900">{action === 'suspend' ? 'Suspendre' : 'Réactiver'} {tenant.name}</h3>
        </div>
        {action === 'suspend' && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">La boutique deviendra inaccessible à ses clients et son propriétaire jusqu'à réactivation.</p>
        )}
        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-600 mb-1">Motif (optionnel, journalisé)</label>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: signalement produit contrefait, litige client…" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        {error && <p className="mt-3 text-xs text-red-600 font-medium">{error}</p>}
        <div className="mt-6 flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" onClick={submit} disabled={saving} className={action === 'suspend' ? 'bg-red-600 hover:bg-red-700' : ''}>
            {saving ? 'Enregistrement…' : action === 'suspend' ? 'Confirmer la suspension' : 'Confirmer la réactivation'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminModeration() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ tenant: TenantRow; action: 'suspend' | 'reactivate' } | null>(null);
  const [filter, setFilter] = useState<'all' | 'suspended'>('all');

  useEffect(() => {
    supabase.from('tenants').select('id,name,slug,status,plan,created_at').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setTenants(data as TenantRow[]); setLoading(false); });
  }, []);

  const applyStatusChange = (tenantId: string, status: string) => {
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status } : t));
  };

  const suspendedCount = tenants.filter(t => t.status === 'suspended').length;
  const visible = filter === 'suspended' ? tenants.filter(t => t.status === 'suspended') : tenants;

  return (
    <div>
      <PageHeader title="Modération" subtitle="Suspendez ou réactivez une boutique — action réelle, immédiate et journalisée." />

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">Boutiques</p><p className="text-2xl font-bold">{loading ? '…' : tenants.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-gray-500 uppercase">Suspendues</p><p className="text-2xl font-bold text-red-600">{loading ? '…' : suspendedCount}</p></Card>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === 'all' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Toutes</button>
        <button onClick={() => setFilter('suspended')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === 'suspended' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Suspendues uniquement</button>
      </div>

      <Card>
        {loading ? (
          <p className="p-6 text-sm text-gray-400 text-center">Chargement…</p>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center">
            <AlertTriangle size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">{filter === 'suspended' ? 'Aucune boutique suspendue.' : 'Aucune boutique.'}</p>
          </div>
        ) : (
          <Table headers={['Boutique', 'Plan', 'Statut', 'Créée le', '']}>
            {visible.map(t => (
              <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{t.name}</td>
                <td className="py-3 px-4"><Badge color="gray">{t.plan}</Badge></td>
                <td className="py-3 px-4"><Badge color={t.status === 'active' ? 'green' : t.status === 'trial' ? 'blue' : t.status === 'suspended' ? 'red' : 'gray'}>{t.status}</Badge></td>
                <td className="py-3 px-4 text-gray-500 text-xs">{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                <td className="py-3 px-4 text-right">
                  {t.status === 'suspended' ? (
                    <button onClick={() => setModal({ tenant: t, action: 'reactivate' })} className="text-green-600 hover:text-green-700 text-xs font-semibold flex items-center gap-1 ml-auto">
                      <RotateCcw size={13} /> Réactiver
                    </button>
                  ) : (
                    <button onClick={() => setModal({ tenant: t, action: 'suspend' })} className="text-red-600 hover:text-red-700 text-xs font-semibold flex items-center gap-1 ml-auto">
                      <Ban size={13} /> Suspendre
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {modal && (
        <ConfirmModal
          tenant={modal.tenant}
          action={modal.action}
          onClose={() => setModal(null)}
          onDone={applyStatusChange}
        />
      )}
    </div>
  );
}
