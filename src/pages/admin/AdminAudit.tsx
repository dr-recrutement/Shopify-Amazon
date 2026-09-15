import { PageHeader, Card, Badge, EmptyState } from '../dashboard/ui';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type AuditLogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  subscription_extended: 'Abonnement prolongé',
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] || action;
}

function actionColor(action: string): string {
  if (action.includes('extended') || action.includes('created') || action.includes('activated')) return 'green';
  if (action.includes('deleted') || action.includes('suspended') || action.includes('revoked')) return 'red';
  return 'gray';
}

/**
 * Real audit trail for super admins, reading the audit_logs table directly
 * (RLS already scopes SELECT to active super_admins — see
 * 20260822130000_critical_rls_isolation_fixes.sql). This used to be the
 * shared AdminGeneric "not built yet" stub; the table and its RLS policy
 * already existed and functions/api/admin/extend-subscription.ts already
 * writes real rows to it, this page just needed to read them.
 *
 * Only one action type is currently logged (subscription_extended) — other
 * admin actions (domain force-verify, tenant suspension, etc.) don't write
 * to audit_logs yet, so this table will only show what's actually been
 * logged, not a complete picture of every admin action taken.
 */
export default function AdminAudit() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actorEmails, setActorEmails] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('audit_logs')
      .select('id,actor_id,action,target_type,target_id,metadata,created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setLogs((data as AuditLogRow[]) || []);
    // The actor's email isn't stored as a column, but extend-subscription.ts
    // already writes it into metadata.actorEmail for its own action type —
    // use that where present instead of a separate admin-only users lookup.
    const emails: Record<string, string> = {};
    for (const row of (data as AuditLogRow[]) || []) {
      const email = row.metadata?.actorEmail as string | undefined;
      if (row.actor_id && email) emails[row.actor_id] = email;
    }
    setActorEmails(emails);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader
        title="Audit & Logs"
        subtitle="Traçabilité des actions administrateur — chaque ligne est une action réelle enregistrée dans audit_logs."
      />
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <span className="text-xs text-gray-500">{logs.length} entrée{logs.length !== 1 ? 's' : ''} (200 max affichées)</span>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
            Erreur de chargement : {error}
          </div>
        )}

        {!loading && logs.length === 0 && !error ? (
          <EmptyState
            icon={ClipboardList}
            title="Aucune action enregistrée"
            desc="Les actions administrateur (prolongation d'abonnement, etc.) apparaîtront ici dès qu'elles seront effectuées."
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map(log => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge color={actionColor(log.action)}>{actionLabel(log.action)}</Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {log.actor_id && (actorEmails[log.actor_id] || log.actor_id)}
                    {log.target_type && <> → {log.target_type} <span className="font-mono">{log.target_id}</span></>}
                  </p>
                  {log.metadata && (
                    <pre className="text-[10px] text-gray-400 mt-1.5 bg-gray-50 rounded-lg p-2 overflow-x-auto max-w-xl">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
