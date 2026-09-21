import { useState, useEffect, useCallback } from 'react';
import {
  Globe, Link2, Loader2, Check, ExternalLink, ShoppingCart, AlertCircle,
  KeyRound, ShieldCheck, RefreshCw, Trash2, ArrowLeft, Cloud,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';

const SELLIA_APP = 'sellia.app';
const APP_TARGET = 'afristore-builder-pro.base44.app';

const TABS = [
  { id: 'sub', label: 'Sous-domaine', icon: Globe },
  { id: 'custom', label: 'Domaine perso', icon: Link2 },
  { id: 'buy', label: 'Acheter', icon: ShoppingCart },
  { id: 'settings', label: 'Cloudflare', icon: KeyRound },
];

function Card({ title, icon: Ic, children }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Ic className="w-4 h-4 text-brand" /></span>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatusPill({ ok, label }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
      {ok ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />} {label}
    </span>
  );
}

function SubdomainTab({ store }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const sub = store?.slug ? `${store.slug}.${SELLIA_APP}` : null;

  const activate = async () => {
    if (!store?.slug) return;
    setBusy(true); setError(null);
    try {
      const res = await base44.functions.invoke('cloudflareDomains', { action: 'createSubdomain', slug: store.slug, target: APP_TARGET });
      if (res.data?.error) throw new Error(res.data.error);
      setDone(true);
    } catch (e) { setError(e.message || 'Erreur'); }
    finally { setBusy(false); }
  };

  return (
    <Card title="Sous-domaine Sellia (inclus)" icon={Globe}>
      <p className="text-xs text-muted-foreground mb-4">Votre boutique est immédiatement accessible sur un sous-domaine gratuit. Activation du DNS via Cloudflare.</p>
      {sub ? (
        <div className="flex items-center justify-between bg-surface rounded-xl px-4 py-3.5 border border-border">
          <div className="min-w-0">
            <p className="text-sm font-mono text-foreground truncate">{sub}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{done ? 'Enregistrement DNS créé — actif sous quelques minutes' : 'Sous-domaine attribué'}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {done && <StatusPill ok label="DNS créé" />}
            <a href={`https://${sub}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">Visiter <ExternalLink className="w-3.5 h-3.5" /></a>
          </div>
        </div>
      ) : <p className="text-sm text-muted-foreground">Configurez votre boutique pour obtenir un sous-domaine.</p>}
      <button onClick={activate} disabled={busy || !sub || done} className="mt-4 inline-flex items-center gap-1.5 bg-brand text-brand-foreground text-sm font-semibold px-4 py-2 rounded-full hover:bg-brand/90 disabled:opacity-40">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />} {done ? 'Activé' : busy ? 'Activation…' : 'Activer le DNS'}
      </button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </Card>
  );
}

function CustomDomainTab({ store }) {
  const [domain, setDomain] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  const connect = async () => {
    const d = domain.trim().toLowerCase();
    if (!d || !store?.id) return;
    setBusy(true); setError(null);
    try {
      const res = await base44.functions.invoke('cloudflareDomains', { action: 'createCustomHostname', hostname: d });
      if (res.data?.error) throw new Error(res.data.error);
      setInfo(res.data.hostname);
      await base44.entities.Store.update(store.id, { domain: d });
      setDomain('');
    } catch (e) { setError(e.message || 'Erreur'); }
    finally { setBusy(false); }
  };

  const refresh = async () => {
    if (!info?.id) return;
    const res = await base44.functions.invoke('cloudflareDomains', { action: 'getCustomHostname', id: info.id });
    if (res.data?.hostname) setInfo(res.data.hostname);
  };

  const disconnect = async () => {
    if (!info?.id || !confirm('Déconnecter ce domaine ?')) return;
    await base44.functions.invoke('cloudflareDomains', { action: 'deleteCustomHostname', id: info.id });
    if (store?.id) await base44.entities.Store.update(store.id, { domain: '' });
    setInfo(null);
  };

  const statusOk = info?.status === 'active';
  const sslOk = info?.ssl?.status === 'active' || info?.ssl?.status === 'pending_validation';
  const ownership = info?.ownership_verification;
  const sslRec = info?.ssl?.validation_records?.[0];

  return (
    <Card title="Connecter un domaine existant" icon={Link2}>
      <p className="text-xs text-muted-foreground mb-4">Vous possédez déjà un domaine (GoDaddy, Namecheap, etc.). Connectez-le gratuitement : nous provisionnons le SSL et vous n'avez qu'un CNAME à créer chez votre registrar.</p>
      {info || store?.domain ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-surface rounded-xl px-4 py-3.5 border border-border">
            <div className="min-w-0">
              <p className="text-sm font-mono text-foreground truncate">{info?.hostname || store?.domain}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Statut : {info?.status || 'connecté'}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusPill ok={statusOk} label={statusOk ? 'Actif' : 'Vérification'} />
              <button onClick={refresh} className="p-1.5 rounded-md hover:bg-background text-muted-foreground"><RefreshCw className="w-3.5 h-3.5" /></button>
              <button onClick={disconnect} className="inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"><Trash2 className="w-3.5 h-3.5" /> Déconnecter</button>
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-border p-4 bg-muted/30 space-y-3">
            <p className="text-xs font-bold text-foreground">Étapes chez votre registrar</p>
            {ownership && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1">1. Vérification de propriété — enregistrement TXT</p>
                <div className="font-mono text-[11px] bg-white rounded-md border border-border px-2.5 py-2 break-all">
                  <span className="text-muted-foreground">Nom : </span>{ownership.name}<br />
                  <span className="text-muted-foreground">Valeur : </span>{ownership.value}
                </div>
              </div>
            )}
            {sslRec && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1">2. Activation du SSL — enregistrement CNAME</p>
                <div className="font-mono text-[11px] bg-white rounded-md border border-border px-2.5 py-2 break-all">
                  <span className="text-muted-foreground">Nom/hôte : </span>{sslRec.cname_target || 'www'}<br />
                  <span className="text-muted-foreground">Cible : </span>{sslRec.cname_expected || `${info?.hostname}`}
                </div>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> SSL universel Cloudflare provisionné automatiquement après vérification.</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mondomaine.com" className="flex-1 px-3.5 py-2.5 border border-border rounded-lg text-sm" />
          <button onClick={connect} disabled={busy || !domain} className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-brand/90 disabled:opacity-40">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} Connecter
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </Card>
  );
}

function BuyTab({ store }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState({ first_name: '', last_name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', country: 'SN' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const buy = async () => {
    const d = name.trim().toLowerCase();
    if (!d) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const res = await base44.functions.invoke('cloudflareDomains', { action: 'registerDomain', name: d, contact });
      setResult(res.data);
      if (res.data?.ok && store?.id) await base44.entities.Store.update(store.id, { domain: d });
    } catch (e) { setError(e.message || 'Erreur'); }
    finally { setBusy(false); }
  };

  return (
    <Card title="Acheter un domaine via Sellia × Cloudflare" icon={ShoppingCart}>
      <p className="text-xs text-muted-foreground mb-4">Achetez un domaine directement depuis Sellia. L'enregistrement s'effectue via Cloudflare Registrar avec vos API connectées.</p>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="mon-domaine.com" className="flex-1 px-3.5 py-2.5 border border-border rounded-lg text-sm font-mono" />
          <button onClick={buy} disabled={busy || !name} className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-brand/90 disabled:opacity-40">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />} {busy ? 'Achat…' : 'Acheter'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input value={contact.first_name} onChange={(e) => setContact({ ...contact, first_name: e.target.value })} placeholder="Prénom du titulaire" className="px-3 py-2 border border-border rounded-lg text-sm" />
          <input value={contact.last_name} onChange={(e) => setContact({ ...contact, last_name: e.target.value })} placeholder="Nom du titulaire" className="px-3 py-2 border border-border rounded-lg text-sm" />
          <input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="Email" className="px-3 py-2 border border-border rounded-lg text-sm" />
          <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="Téléphone (+...)" className="px-3 py-2 border border-border rounded-lg text-sm" />
          <input value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} placeholder="Adresse" className="sm:col-span-2 px-3 py-2 border border-border rounded-lg text-sm" />
          <input value={contact.city} onChange={(e) => setContact({ ...contact, city: e.target.value })} placeholder="Ville" className="px-3 py-2 border border-border rounded-lg text-sm" />
          <input value={contact.zip} onChange={(e) => setContact({ ...contact, zip: e.target.value })} placeholder="Code postal" className="px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
      </div>
      {result && (
        <div className={`mt-4 rounded-xl p-3.5 text-sm ${result.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {result.ok ? (<><Check className="w-4 h-4 inline mr-1.5" /> Domaine en cours d'enregistrement. Vous recevrez une confirmation par email.</>) : (<><AlertCircle className="w-4 h-4 inline mr-1.5" /> {(result.errors?.[0]?.message) || `Erreur Cloudflare (HTTP ${result.raw_status})`}</>)}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </Card>
  );
}

function SettingsTab({ onSaved }) {
  const [keys, setKeys] = useState({ cf_api_token: '', cf_account_id: '', cf_zone_id: '' });
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('cloudflareDomains', { action: 'status' });
      setStatus(res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke('cloudflareDomains', { action: 'saveKeys', ...keys });
      setSaved(true); setTimeout(() => setSaved(false), 1500);
      load();
      onSaved?.();
    } catch (e) { alert('Erreur : ' + (e.message || '')); }
    finally { setSaving(false); }
  };

  const inputCls = 'w-full px-3.5 py-2.5 border border-border rounded-lg text-sm font-mono';

  return (
    <Card title="Paramètres Cloudflare" icon={KeyRound}>
      <p className="text-xs text-muted-foreground mb-4">Renseignez vos identifiants Cloudflare pour activer l'achat, la connexion et le DNS. Ils sont stockés de façon sécurisée côté serveur, jamais exposés au client.</p>
      {!loading && status && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <StatusPill ok={status.configured?.api_token} label="API Token" />
          <StatusPill ok={status.configured?.account_id} label="Account ID" />
          <StatusPill ok={status.configured?.zone_id} label="Zone ID" />
          {status.configured?.api_token && <StatusPill ok={status.token_valid} label={status.token_valid ? 'Token valide' : 'Token invalide'} />}
        </div>
      )}
      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">API Token</label>
          <input type="password" value={keys.cf_api_token} onChange={(e) => setKeys({ ...keys, cf_api_token: e.target.value })} placeholder="Cloudflare API Token" className={inputCls} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Account ID</label>
            <input value={keys.cf_account_id} onChange={(e) => setKeys({ ...keys, cf_account_id: e.target.value })} placeholder="Account ID" className={inputCls} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Zone ID (sellia.app)</label>
            <input value={keys.cf_zone_id} onChange={(e) => setKeys({ ...keys, cf_zone_id: e.target.value })} placeholder="Zone ID" className={inputCls} />
          </div>
        </div>
      </div>
      <button onClick={save} disabled={saving} className="mt-4 inline-flex items-center gap-1.5 bg-brand text-brand-foreground text-sm font-semibold px-4 py-2 rounded-full hover:bg-brand/90 disabled:opacity-40">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />} {saving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer les clés'}
      </button>
      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">Créez un token sur Cloudflare → My Profile → API Tokens avec les permissions : Zone → Zone, DNS, SSL & Certificates ; Account → Registrar. Récupérez l'Account ID et la Zone ID de votre domaine SaaS (sellia.app) dans le dashboard Cloudflare.</p>
    </Card>
  );
}

export default function Domains() {
  const { store, loading } = useCurrentStore();
  const [tab, setTab] = useState('sub');
  const [status, setStatus] = useState(null);

  useEffect(() => {
    base44.functions.invoke('cloudflareDomains', { action: 'status' }).then((res) => setStatus(res.data)).catch(() => {});
  }, [tab]);

  const configured = !!(status?.configured?.api_token && status?.configured?.zone_id && status?.configured?.account_id);

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center"><Globe className="w-5 h-5 text-brand" /></span>
        <div>
          <h1 className="text-xl font-bold text-foreground">Domaines & DNS</h1>
          <p className="text-xs text-muted-foreground">Gérez le sous-domaine, connectez un domaine ou achetez-en un — propulsé par Cloudflare.</p>
        </div>
      </div>

      {!configured && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800">
            <p className="font-semibold">Cloudflare n'est pas encore configuré.</p>
            <p>Rendez-vous dans l'onglet <button onClick={() => setTab('settings')} className="font-bold underline">Cloudflare</button> pour renseigner vos clés API.</p>
          </div>
        </div>
      )}

      <div className="flex gap-1.5 mb-5 bg-surface p-1.5 rounded-xl border border-border overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 min-w-max flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg transition ${tab === t.id ? 'bg-white text-brand shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'sub' && <SubdomainTab store={store} />}
      {tab === 'custom' && <CustomDomainTab store={store} />}
      {tab === 'buy' && <BuyTab store={store} />}
      {tab === 'settings' && <SettingsTab onSaved={() => base44.functions.invoke('cloudflareDomains', { action: 'status' }).then((r) => setStatus(r.data))} />}
    </div>
  );
}