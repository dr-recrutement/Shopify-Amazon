import { useState, useEffect, useCallback } from 'react';
import {
  Server, KeyRound, Webhook, ShieldCheck, ScrollText, Plus,
  Loader2, Copy, Check, Trash2, RefreshCcw, AlertCircle,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

// LIAFRIK Command Center integration - Super Admin only. Never linked
// from public nav, customer dashboards or merchant settings - only
// reachable from within the Super Admin section, itself gated by
// checkIsSuperAdmin() at the layout level (AdminLayout.jsx).
const TABS = [
  { id: 'connection', label: 'Connexion', icon: ShieldCheck },
  { id: 'keys', label: 'Clés API', icon: KeyRound },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'capabilities', label: 'Capacités', icon: Server },
  { id: 'logs', label: 'Journal', icon: ScrollText },
];

const ALL_SCOPES = ['read:tenants', 'write:tenants', 'read:analytics'];

export default function CommandCenterManager() {
  const [tab, setTab] = useState('connection');

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Server className="w-5 h-5 text-[#008060]" />
        <h1 className="text-xl font-bold text-[#202223]">LIAFRIK Command Center</h1>
      </div>
      <p className="text-xs text-[#6D7175] mb-6">Intégration API server-to-server pour le contrôle centralisé de la plateforme. Réservé aux Super Admins.</p>

      <div className="flex items-center gap-1 mb-5 bg-[#F4F4F4] rounded-lg p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${tab === t.id ? 'bg-white text-[#008060] shadow-sm' : 'text-[#6D7175] hover:text-[#202223]'}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'connection' && <ConnectionTab />}
      {tab === 'keys' && <KeysTab />}
      {tab === 'webhooks' && <WebhooksTab />}
      {tab === 'capabilities' && <CapabilitiesTab />}
      {tab === 'logs' && <LogsTab />}
    </div>
  );
}

function ConnectionTab() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const testHealth = async () => {
    setTesting(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('command-center/v1/health', { method: 'GET' });
      if (error) throw error;
      setResult({ ok: data?.status === 'healthy', body: data });
    } catch (e) {
      setResult({ ok: false, body: { error: e.message || 'Échec de la connexion' } });
    } finally { setTesting(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E1E1E1] p-5">
      <h2 className="text-sm font-bold text-[#202223] mb-1">Test de connexion</h2>
      <p className="text-xs text-[#6D7175] mb-4">Envoie une vraie requête authentifiée contre l'intégration déployée (endpoint /v1/health, aucune clé requise pour ce contrôle).</p>
      <button onClick={testHealth} disabled={testing} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] disabled:opacity-50">
        {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />} Tester la connexion
      </button>
      {result && (
        <div className={`mt-4 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap ${result.ok ? 'bg-[#008060]/5 text-[#008060] border border-[#008060]/20' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <p className="font-bold mb-1">{result.ok ? '✓ CONNECTÉ' : '✗ ÉCHEC'}</p>
          {JSON.stringify(result.body, null, 2)}
        </div>
      )}
      <div className="mt-5 pt-4 border-t border-[#E1E1E1]">
        <p className="text-xs font-bold text-[#202223] mb-2">Points de terminaison réels</p>
        <ul className="text-xs text-[#6D7175] font-mono space-y-1">
          <li>GET  /functions/v1/command-center/v1/health <span className="text-[#6D7175]">(public, aucune clé)</span></li>
          <li>GET  /functions/v1/command-center/v1/capabilities <span className="text-[#6D7175]">(clé API requise)</span></li>
          <li>GET  /functions/v1/command-center/v1/tenants <span className="text-[#6D7175]">(scope read:tenants)</span></li>
          <li>POST /functions/v1/command-center/v1/tenants/:id/suspend <span className="text-[#6D7175]">(scope write:tenants)</span></li>
          <li>POST /functions/v1/command-center/v1/tenants/:id/reactivate <span className="text-[#6D7175]">(scope write:tenants)</span></li>
          <li>GET  /functions/v1/command-center/v1/analytics <span className="text-[#6D7175]">(scope read:analytics)</span></li>
        </ul>
      </div>
    </div>
  );
}

function KeysTab() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: '', environment: 'production', scopes: [], expires_in_days: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('command_center_api_keys').select('*').order('created_at', { ascending: false });
    setKeys(data || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const createKey = async () => {
    if (!form.name.trim() || form.scopes.length === 0) return;
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('command-center-admin', {
        body: { action: 'create_key', name: form.name.trim(), environment: form.environment, scopes: form.scopes, expires_in_days: form.expires_in_days ? Number(form.expires_in_days) : undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setNewKeyResult(data);
      setForm({ name: '', environment: 'production', scopes: [], expires_in_days: '' });
      await load();
    } catch (e) {
      alert(e.message || "Échec de la création de la clé");
    } finally { setCreating(false); }
  };

  const revoke = async (id) => {
    if (!confirm('Révoquer cette clé ? Toute requête utilisant cette clé échouera immédiatement.')) return;
    const { error } = await supabase.functions.invoke('command-center-admin', { body: { action: 'revoke_key', key_id: id } });
    if (error) { alert(error.message); return; }
    await load();
  };

  const toggleScope = (s) => setForm((f) => ({ ...f, scopes: f.scopes.includes(s) ? f.scopes.filter((x) => x !== s) : [...f.scopes, s] }));

  return (
    <div className="space-y-4">
      {newKeyResult && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-800 mb-1">⚠ Clé affichée une seule fois — copiez-la maintenant</p>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-amber-200">
            <code className="text-xs font-mono flex-1 break-all">{newKeyResult.raw_key}</code>
            <button onClick={() => { navigator.clipboard.writeText(newKeyResult.raw_key); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="shrink-0 text-amber-700 hover:text-amber-900">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={() => setNewKeyResult(null)} className="text-xs font-semibold text-amber-800 mt-2 hover:underline">J'ai copié la clé, fermer</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E1E1E1] p-5">
        <h2 className="text-sm font-bold text-[#202223] mb-3">Nouvelle clé API</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom (ex : LIAFRIK Command Center — Production)" className="px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" />
          <select value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })} className="px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm bg-white">
            <option value="production">Production</option>
            <option value="staging">Staging</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {ALL_SCOPES.map((s) => (
            <label key={s} className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-md border cursor-pointer ${form.scopes.includes(s) ? 'border-[#008060] bg-[#008060]/5 text-[#008060]' : 'border-[#E1E1E1] text-[#6D7175]'}`}>
              <input type="checkbox" checked={form.scopes.includes(s)} onChange={() => toggleScope(s)} className="accent-[#008060]" /> {s}
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="number" value={form.expires_in_days} onChange={(e) => setForm({ ...form, expires_in_days: e.target.value })} placeholder="Expire dans (jours, optionnel)" className="w-48 px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" />
          <button onClick={createKey} disabled={creating || !form.name.trim() || form.scopes.length === 0} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] disabled:opacity-40">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Créer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
        {loading ? <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#008060]" /></div> : keys.length === 0 ? (
          <p className="text-sm text-[#6D7175] text-center py-8">Aucune clé créée pour le moment.</p>
        ) : (
          <div className="divide-y divide-[#E1E1E1]">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-semibold text-[#202223]">{k.name}</p>
                  <p className="text-[11px] text-[#6D7175] font-mono">{k.key_prefix}••••••••••••••••••••</p>
                  <p className="text-[11px] text-[#6D7175] mt-0.5">{k.environment} · {(k.scopes || []).join(', ')} · Créée {new Date(k.created_at).toLocaleDateString('fr-FR')}{k.last_used_at ? ` · Dernière utilisation ${new Date(k.last_used_at).toLocaleDateString('fr-FR')}` : ' · Jamais utilisée'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${k.status === 'active' ? 'bg-[#008060]/10 text-[#008060]' : 'bg-red-50 text-red-600'}`}>{k.status === 'active' ? 'Actif' : 'Révoqué'}</span>
                  {k.status === 'active' && <button onClick={() => revoke(k.id)} className="text-[#6D7175] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WebhooksTab() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', url: '', events: [] });
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState(null);
  const [testing, setTesting] = useState(null);
  const [testResults, setTestResults] = useState({});

  const EVENTS = ['tenant.suspended', 'tenant.reactivated', 'order.created', 'connection.test'];

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('command_center_webhooks').select('*').order('created_at', { ascending: false });
    setWebhooks(data || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('command-center-admin', { body: { action: 'create_webhook', name: form.name.trim(), url: form.url.trim(), events: form.events } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setNewSecret(data.raw_signing_secret);
      setForm({ name: '', url: '', events: [] });
      await load();
    } catch (e) {
      alert(e.message || "Échec de la création du webhook");
    } finally { setCreating(false); }
  };

  const testWebhook = async (id) => {
    setTesting(id);
    try {
      const { data, error } = await supabase.functions.invoke('command-center-admin', { body: { action: 'test_webhook', webhook_id: id } });
      if (error) throw error;
      setTestResults((r) => ({ ...r, [id]: data }));
    } catch (e) {
      setTestResults((r) => ({ ...r, [id]: { delivered: false, response_body: e.message } }));
    } finally { setTesting(null); }
  };

  const toggleEvent = (ev) => setForm((f) => ({ ...f, events: f.events.includes(ev) ? f.events.filter((x) => x !== ev) : [...f.events, ev] }));

  return (
    <div className="space-y-4">
      {newSecret && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-800 mb-1">⚠ Secret de signature affiché une seule fois</p>
          <code className="text-xs font-mono break-all block bg-white rounded-lg px-3 py-2 border border-amber-200">{newSecret}</code>
          <button onClick={() => setNewSecret(null)} className="text-xs font-semibold text-amber-800 mt-2 hover:underline">J'ai copié le secret, fermer</button>
        </div>
      )}
      <div className="bg-white rounded-xl border border-[#E1E1E1] p-5">
        <h2 className="text-sm font-bold text-[#202223] mb-3">Nouveau webhook</h2>
        <div className="space-y-3 mb-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom" className="w-full px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" />
          <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://votre-command-center.com/webhooks/sellia" className="w-full px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm" />
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {EVENTS.map((ev) => (
            <label key={ev} className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-md border cursor-pointer ${form.events.includes(ev) ? 'border-[#008060] bg-[#008060]/5 text-[#008060]' : 'border-[#E1E1E1] text-[#6D7175]'}`}>
              <input type="checkbox" checked={form.events.includes(ev)} onChange={() => toggleEvent(ev)} className="accent-[#008060]" /> {ev}
            </label>
          ))}
        </div>
        <button onClick={create} disabled={creating || !form.name.trim() || !form.url.trim()} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] disabled:opacity-40">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Créer
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
        {loading ? <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#008060]" /></div> : webhooks.length === 0 ? (
          <p className="text-sm text-[#6D7175] text-center py-8">Aucun webhook créé.</p>
        ) : (
          <div className="divide-y divide-[#E1E1E1]">
            {webhooks.map((w) => (
              <div key={w.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#202223]">{w.name}</p>
                    <p className="text-[11px] text-[#6D7175] font-mono">{w.url}</p>
                    <p className="text-[11px] text-[#6D7175] mt-0.5">{(w.events || []).join(', ') || 'Aucun événement sélectionné'}</p>
                  </div>
                  <button onClick={() => testWebhook(w.id)} disabled={testing === w.id} className="flex items-center gap-1.5 text-xs font-semibold text-[#008060] border border-[#008060]/30 px-3 py-1.5 rounded-full hover:bg-[#008060]/5 disabled:opacity-50 shrink-0">
                    {testing === w.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />} Tester
                  </button>
                </div>
                {testResults[w.id] && (
                  <div className={`mt-2 text-[11px] font-mono p-2 rounded ${testResults[w.id].delivered ? 'bg-[#008060]/5 text-[#008060]' : 'bg-red-50 text-red-600'}`}>
                    {testResults[w.id].delivered ? `✓ Livré (HTTP ${testResults[w.id].response_status})` : `✗ Échec : ${testResults[w.id].response_body}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-[11px] text-[#6D7175]">Livraison automatique pour les vrais événements (suspension, réactivation) branchée pour tenant.suspended/reactivated. order.created n'est pas encore déclenché automatiquement — le test manuel ci-dessus envoie un vrai appel signé pour vérifier votre point de terminaison.</p>
    </div>
  );
}

function CapabilitiesTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.functions.invoke('command-center/v1/health', { method: 'GET' })
      .then(() => {
        // Capabilities requires an API key (by design - it describes
        // what's available to that specific key's scopes). Shown here is
        // the full, real declared surface for reference, fetched via the
        // health endpoint's structure plus a static mirror of what's
        // actually implemented server-side (kept in sync manually since
        // this view has no key of its own to authenticate with).
        setData({
          application: { id: 'sellia-platform', name: 'Sellia', version: '1.0.0', environment: 'production' },
          api_version: 'v1',
          capabilities: [
            { module: 'tenants', actions: ['read', 'list', 'suspend', 'reactivate'] },
            { module: 'analytics', actions: ['read'] },
          ],
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#008060]" /></div>;
  return (
    <div className="bg-white rounded-xl border border-[#E1E1E1] p-5">
      <h2 className="text-sm font-bold text-[#202223] mb-1">Capacités réelles de l'application</h2>
      <p className="text-xs text-[#6D7175] mb-4">Ce que l'intégration expose réellement — rien de plus. Toute clé API interroge <code className="font-mono">/v1/capabilities</code> pour découvrir dynamiquement ceci.</p>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      {data && (
        <div className="space-y-3">
          {data.capabilities.map((c) => (
            <div key={c.module} className="rounded-lg border border-[#E1E1E1] p-3">
              <p className="text-sm font-bold text-[#202223]">{c.module}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {c.actions.map((a) => <span key={a} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F4F4F4] text-[#6D7175]">{a}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('command_center_audit_log').select('*').order('created_at', { ascending: false }).limit(100);
    setLogs(data || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
      <div className="p-4 border-b border-[#E1E1E1] flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#202223]">Journal d'audit</h2>
        <button onClick={load} className="text-[#6D7175] hover:text-[#008060]"><RefreshCcw className="w-4 h-4" /></button>
      </div>
      {loading ? <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#008060]" /></div> : logs.length === 0 ? (
        <p className="text-sm text-[#6D7175] text-center py-8">Aucune requête enregistrée pour le moment.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#FAFAFA] text-[10px] font-semibold text-[#6D7175] uppercase">
              <tr><th className="text-left px-3 py-2">Horodatage</th><th className="text-left px-3 py-2">Point de terminaison</th><th className="text-left px-3 py-2">Résultat</th><th className="text-left px-3 py-2">Statut</th></tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-[#E1E1E1]">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(l.created_at).toLocaleString('fr-FR')}</td>
                  <td className="px-3 py-2 font-mono">{l.method} {l.endpoint}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 font-semibold ${l.result === 'success' ? 'text-[#008060]' : l.result === 'denied' ? 'text-amber-600' : 'text-red-600'}`}>
                      {l.result === 'success' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />} {l.result}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono">{l.http_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
