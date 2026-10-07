import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { COUNTRIES } from '@/lib/world/countries';
import { CURRENCIES } from '@/lib/world/currencies';
import { getFeatureValue } from '@/lib/plans';
import PlatformPaymentPicker from '@/components/PlatformPaymentPicker';

// Real message from the function's own JSON error body - same pattern
// used everywhere an edge function is called this session.
async function functionErrorMessage(error) {
  try {
    const body = await error.context?.json?.();
    if (body?.error) return body.error;
  } catch { /* fall through to the generic message below */ }
  return error.message || 'Erreur inconnue';
}

const fld = 'w-full px-3 py-2 border border-[#E1E1E1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008060]/30';
const lbl = 'text-xs font-semibold text-[#6D7175] mb-1 block';
const card = 'bg-white rounded-xl border border-[#E1E1E1] p-5';
const ttl = 'text-sm font-bold text-[#202223] mb-3';

// Generic helper for the settings sections below that don't have their own
// dedicated tenants columns - reads/writes tenants.settings (a jsonb bag),
// real persistence instead of local-only useState that reset on reload.
function useSettingsBag() {
  const { store, reload } = useCurrentStore();
  const [saved, setSaved] = useState(false);
  const patch = async (patchObj) => {
    if (!store?.id) return;
    const next = { ...(store.settings || {}), ...patchObj };
    const { error } = await supabase.from('tenants').update({ settings: next }).eq('id', store.id);
    if (error) { alert(error.message); return; }
    await reload();
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };
  return { store, settings: store?.settings || {}, patch, saved };
}

function SavedBadge({ show }) {
  if (!show) return null;
  return <span className="text-[11px] font-semibold text-[#008060] ml-2">Enregistré ✓</span>;
}

export function SettingsGeneral() {
  const { store, reload } = useCurrentStore();
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (store) setF({ name: store.name || '', description: store.settings?.description || '', email: store.settings?.email || '', phone: store.phone || '', currency: store.currency || 'USD', country: store.country || 'US' }); }, [store]);
  const save = async () => {
    if (!store?.id || !f) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('tenants').update({
        name: f.name, phone: f.phone, currency: f.currency, country: f.country,
        settings: { ...(store.settings || {}), description: f.description, email: f.email },
      }).eq('id', store.id);
      if (error) throw error;
      await reload();
    } catch (e) { alert(e.message || "Échec de l'enregistrement"); } finally { setSaving(false); }
  };
  if (!store || !f) return null;
  return <div className={card}><h2 className={ttl}>Général</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div><label className={lbl}>Nom de la boutique</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={fld} /></div>
    <div><label className={lbl}>E-mail de contact</label><input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={fld} /></div>
    <div><label className={lbl}>Téléphone</label><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={fld} /></div>
    <div><label className={lbl}>Pays</label><select value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} className={fld}>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
    <div><label className={lbl}>Devise</label><select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} className={fld}>{[...CURRENCIES].sort((a, b) => a.code.localeCompare(b.code)).map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>)}</select></div>
    <div><label className={lbl}>Description</label><input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={fld} /></div>
  </div><button onClick={save} disabled={saving} className="mt-4 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] disabled:opacity-40">{saving ? 'Enregistrement…' : 'Enregistrer'}</button></div>;
}

export function SettingsPlan() {
  const { store, reload } = useCurrentStore();
  const [busy, setBusy] = useState(null);
  const [payingFor, setPayingFor] = useState(null);
  const plans = [['starter', 'Starter', 7], ['growth', 'Growth', 19], ['pro', 'Pro', 39], ['enterprise', 'Enterprise', 129]];
  // A stale "trial" status with an already-passed trial_ends_at is not
  // actually still trialing - checking only the status string (not
  // whether time has actually run out) meant clicking a plan for an
  // expired trial silently re-saved the same expired date and did
  // nothing visible, no error, no payment prompt either.
  const inTrial = store?.plan_status === 'trial' && store?.trial_ends_at && new Date(store.trial_ends_at) > new Date();

  // While still on the free trial, switching plans just changes which one
  // is being trialed (no payment yet - matches "14 jours d'essai gratuit,
  // sans carte bancaire"). Once the trial is over (or already on a paid
  // plan), choosing a plan is a real charge - opens the same multi-PSP
  // picker used for domain purchases, and only applies the plan change
  // once that payment is independently confirmed.
  const choose = async (id) => {
    if (inTrial) {
      setBusy(id);
      try {
        const { error } = await supabase.rpc('change_trial_plan', { p_tenant_id: store.id, p_plan: id });
        if (error) throw error;
        await reload();
      } catch (e) { alert(e.message || "Échec du changement de plan"); } finally { setBusy(null); }
      return;
    }
    setPayingFor(id);
  };

  // Payment is verified and the plan applied server-side (platform-billing).
  const onPaid = async () => { setPayingFor(null); await reload(); alert('Abonnement activé !'); };

  if (!store) return null;
  const payingPlan = plans.find(([id]) => id === payingFor);
  return <div className={card}>
    <h2 className={ttl}>Plan</h2>
    <p className="text-xs text-[#6D7175] mb-4">{inTrial ? "Tous les plans incluent 14 jours d'essai gratuit. Sans carte bancaire." : 'Choisissez un plan pour continuer - paiement sécurisé, sans redirection.'}</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {plans.map(([id, name, price]) => { const limit = getFeatureValue(id, 'products'); return (
        <div key={id} className={`rounded-xl border-2 p-4 ${store.plan === id ? 'border-[#008060] bg-[#008060]/5' : 'border-[#E1E1E1]'}`}>
          <p className="text-sm font-bold text-[#202223]">{name}</p>
          <p className="text-2xl font-bold text-[#202223]">${price}<span className="text-xs font-normal text-[#6D7175]">/mois</span></p>
          <p className="text-[11px] text-[#6D7175] mt-1">{Number.isFinite(limit) ? `${limit} produits` : 'Produits illimités'}</p>
          <button onClick={() => choose(id)} disabled={(store.plan === id && !inTrial) || busy === id} className="w-full mt-3 text-xs font-semibold py-2 rounded-full bg-[#008060] text-white disabled:opacity-40">{busy === id ? '…' : store.plan === id && !inTrial ? 'Actuel' : inTrial ? 'Choisir' : 'Payer et activer'}</button>
          {inTrial && <button onClick={() => setPayingFor(id)} disabled={busy === id} className="w-full mt-1.5 text-[11px] font-medium text-[#008060] hover:underline disabled:opacity-40">Payer directement</button>}
        </div>
      ); })}
    </div>
    <p className="text-[11px] text-[#6D7175] mt-3">{inTrial ? "Un changement de plan pendant l'essai relance une période de 14 jours." : 'Renouvellement mensuel manuel pour le moment - vous recevrez un rappel avant expiration.'}</p>
    {payingFor && payingPlan && (
      <PlatformPaymentPicker
        amount={payingPlan[2]}
        currency="USD"
        purpose="subscription"
        plan={payingFor}
        tenantId={store.id}
        onCancel={() => setPayingFor(null)}
        onSuccess={onPaid}
      />
    )}
  </div>;
}

export function SettingsBilling() { return <div className={card}><h2 className={ttl}>Facturation</h2><p className="text-sm text-[#6D7175] mb-4">Gérez votre abonnement, vos factures et votre méthode de paiement.</p><Link to="/billing" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#008060] hover:underline">Aller à la facturation →</Link></div>; }
export function SettingsUsers() { return <div className={card}><h2 className={ttl}>Utilisateurs</h2><p className="text-sm text-[#6D7175] mb-4">Invitez des employés et gérez leurs permissions.</p><Link to="/staff-management" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#008060] hover:underline">Gérer le personnel →</Link></div>; }
export function SettingsPayments() { return <div className={card}><h2 className={ttl}>Paiements</h2><p className="text-sm text-[#6D7175] mb-4">Connectez vos prestataires de paiement (PSP) : Stripe, Flutterwave, Paystack, Payunit et bien d'autres à venir.</p><Link to="/payments" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#008060] hover:underline">Gérer les paiements →</Link></div>; }

export function SettingsCheckout() {
  const { settings, patch, saved } = useSettingsBag();
  const a = { guest: true, phone: true, notes: false, terms: true, ...(settings.checkout || {}) };
  const set = (k, v) => patch({ checkout: { ...a, [k]: v } });
  return <div className={card}><h2 className={ttl}>Commande (Checkout) <SavedBadge show={saved} /></h2><div className="space-y-3">{[['guest', 'Autoriser les commandes invités'], ['phone', 'Demander le téléphone'], ['notes', 'Champ de note client'], ['terms', 'Accepter les CGV obligatoire']].map(([k, l]) => (<label key={k} className="flex items-center justify-between"><span className="text-sm text-[#202223]">{l}</span><input type="checkbox" checked={a[k]} onChange={(e) => set(k, e.target.checked)} className="accent-[#008060] w-4 h-4" /></label>))}</div></div>;
}

export function SettingsCustomerAccounts() {
  const { settings, patch, saved } = useSettingsBag();
  const mode = settings.customer_accounts_mode || 'optional';
  return <div className={card}><h2 className={ttl}>Comptes clients <SavedBadge show={saved} /></h2><div className="space-y-3">{[['required', 'Comptes obligatoires'], ['optional', 'Comptes optionnels'], ['disabled', 'Comptes désactivés']].map(([v, l]) => (<label key={v} className="flex items-center justify-between"><span className="text-sm text-[#202223]">{l}</span><input type="radio" name="acct" checked={mode === v} onChange={() => patch({ customer_accounts_mode: v })} className="accent-[#008060] w-4 h-4" /></label>))}</div></div>;
}

export function SettingsShippingDelivery() { return <div className={card}><h2 className={ttl}>Livraison et expédition</h2><p className="text-sm text-[#6D7175] mb-4">Configurez zones, transporteurs et frais.</p><Link to="/shipping-settings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#008060] hover:underline">Configurer la livraison →</Link></div>; }

export function SettingsTaxes() {
  const { settings, patch, saved } = useSettingsBag();
  const enabled = settings.taxes_auto_collect !== false;
  return <div className={card}><h2 className={ttl}>Taxes et droits <SavedBadge show={saved} /></h2><label className="flex items-center justify-between mb-3"><span className="text-sm text-[#202223]">Collecter automatiquement les taxes</span><input type="checkbox" checked={enabled} onChange={(e) => patch({ taxes_auto_collect: e.target.checked })} className="accent-[#008060] w-4 h-4" /></label><p className="text-xs text-[#6D7175]">Ce réglage enregistre votre préférence. Le calcul de taxe réel selon le pays du client n'est pas encore appliqué au checkout.</p></div>;
}

export function SettingsLocations() {
  const { store } = useCurrentStore();
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!store?.id) return;
    const { data } = await supabase.from('store_locations').select('*').eq('tenant_id', store.id).order('position');
    setLocations(data || []);
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form?.name?.trim() || !form?.address?.trim() || !store?.id) return;
    setSaving(true);
    try {
      const payload = { tenant_id: store.id, name: form.name.trim(), address: form.address.trim(), city: form.city || null, country: form.country || null, phone: form.phone || null, hours: form.hours || null };
      const { error } = form.id
        ? await supabase.from('store_locations').update(payload).eq('id', form.id)
        : await supabase.from('store_locations').insert(payload);
      if (error) throw error;
      setForm(null);
      await load();
    } catch (e) {
      alert(e.message || "Échec de l'enregistrement");
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Retirer cet emplacement ?')) return;
    const { error } = await supabase.from('store_locations').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await load();
  };

  return (
    <div className={card}>
      <h2 className={ttl}>Emplacements</h2>
      <p className="text-sm text-[#6D7175] mb-4">Adresses physiques de vos boutiques, affichées à vos clients sur votre site (via la section « Nos boutiques » du Theme Editor). Pour vos entrepôts de stock, voir <Link to="/inventory" className="text-[#008060] hover:underline">l'inventaire</Link>.</p>

      {locations.length > 0 && (
        <div className="space-y-2 mb-4">
          {locations.map((l) => (
            <div key={l.id} className="flex items-start justify-between px-3 py-2.5 rounded-lg border border-[#E1E1E1]">
              <div>
                <p className="text-sm font-semibold text-[#202223]">{l.name}</p>
                <p className="text-xs text-[#6D7175]">{l.address}{l.city ? `, ${l.city}` : ''}{l.country ? `, ${l.country}` : ''}</p>
                {l.phone && <p className="text-xs text-[#6D7175]">{l.phone}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setForm(l)} className="text-xs font-semibold text-[#008060] hover:underline">Modifier</button>
                <button onClick={() => remove(l.id)} className="text-xs font-semibold text-red-600 hover:underline">Retirer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form ? (
        <div className="space-y-2 border-t border-[#E1E1E1] pt-3">
          <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom (ex : Boutique Plateau)" className={fld} />
          <input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Adresse" className={fld} />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ville" className={fld} />
            <input value={form.country || ''} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Pays" className={fld} />
          </div>
          <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone (optionnel)" className={fld} />
          <input value={form.hours || ''} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="Horaires (ex : Lun-Sam 9h-19h)" className={fld} />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="text-xs font-semibold text-white bg-[#008060] px-4 py-2 rounded-full hover:bg-[#00694d] disabled:opacity-40">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            <button onClick={() => setForm(null)} className="text-xs font-semibold text-[#6D7175] px-4 py-2">Annuler</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setForm({})} className="text-sm font-semibold text-[#008060] hover:underline">+ Ajouter un emplacement</button>
      )}
    </div>
  );
}
export function SettingsApps() { return <div className={card}><h2 className={ttl}>Applications</h2><p className="text-sm text-[#6D7175] mb-4">Installez des applications pour étendre votre boutique.</p><Link to="/apps" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#008060] hover:underline">Parcourir les apps →</Link></div>; }
export function SettingsAiProvidersLink() { return <div className={card}><h2 className={ttl}>Fournisseurs IA</h2><p className="text-sm text-[#6D7175] mb-4">Connectez votre propre clé Gemini, Claude ou ChatGPT pour l'Assistant Sellia — sinon la clé partagée de la plateforme est utilisée.</p><Link to="/ai-providers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#008060] hover:underline">Gérer les fournisseurs IA →</Link></div>; }

export function SettingsEmail() {
  const { store } = useCurrentStore();
  const [apiKey, setApiKey] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [connected, setConnected] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store?.id) return;
    supabase.from('tenant_email_providers').select('from_email').eq('tenant_id', store.id).eq('provider', 'resend').maybeSingle()
      .then(({ data }) => { setConnected(!!data); if (data?.from_email) setFromEmail(data.from_email); });
  }, [store?.id]);

  const save = async () => {
    if (!apiKey.trim() || !store?.id) return;
    setSaving(true);
    try {
      const { data: enc, error: encError } = await supabase.functions.invoke('encrypt-gateway-credentials', { body: { api_key: apiKey.trim() } });
      if (encError) throw new Error(await functionErrorMessage(encError));
      if (enc.error) throw new Error(enc.error);
      const { error } = await supabase.from('tenant_email_providers').upsert(
        { tenant_id: store.id, provider: 'resend', api_key_encrypted: enc.api_key_encrypted, from_email: fromEmail.trim() || null },
        { onConflict: 'tenant_id,provider' }
      );
      if (error) throw error;
      setConnected(true);
      setApiKey('');
    } catch (e) {
      alert(e.message || "Échec de la connexion");
    } finally { setSaving(false); }
  };

  const disconnect = async () => {
    if (!store?.id || !confirm('Déconnecter votre compte Resend ? Les envois utiliseront à nouveau la clé partagée de Sellia.')) return;
    const { error } = await supabase.from('tenant_email_providers').delete().eq('tenant_id', store.id).eq('provider', 'resend');
    if (error) { alert(error.message); return; }
    setConnected(false);
  };

  if (!store) return null;
  return (
    <div className={card}>
      <h2 className={ttl}>E-mail (envoi)</h2>
      <p className="text-sm text-[#6D7175] mb-4">Sellia envoie vos campagnes et notifications avec une clé partagée par défaut. Connectez votre propre compte Resend pour envoyer depuis votre propre domaine et votre propre réputation d'envoi.</p>
      {connected ? (
        <div className="rounded-lg bg-[#008060]/5 border border-[#008060]/20 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#202223]">Compte Resend connecté</p>
            {fromEmail && <p className="text-xs text-[#6D7175] mt-0.5">Envoi depuis {fromEmail}</p>}
          </div>
          <button onClick={disconnect} className="text-xs font-semibold text-red-600 hover:underline">Déconnecter</button>
        </div>
      ) : (
        <div className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-[#6D7175] mb-1">Clé API Resend</label>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="re_xxxxxxxxxxxx" className={fld} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6D7175] mb-1">Adresse d'envoi (optionnel)</label>
            <input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="contact@votredomaine.com" className={fld} />
            <p className="text-[10px] text-[#6D7175] mt-1">Nécessite un domaine vérifié dans votre compte Resend. Laisser vide pour utiliser l'adresse Resend par défaut.</p>
          </div>
          <button onClick={save} disabled={saving || !apiKey.trim()} className="text-sm font-semibold text-white bg-[#008060] px-4 py-2 rounded-full hover:bg-[#00694d] disabled:opacity-40">{saving ? 'Connexion…' : 'Connecter'}</button>
        </div>
      )}
    </div>
  );
}

export function SettingsSalesChannels() {
  return <div className={card}>
    <h2 className={ttl}>Canaux de vente</h2>
    <div className="flex items-center justify-between p-2.5 bg-[#008060]/5 rounded-lg mb-2"><span className="text-xs font-medium text-[#202223]">Boutique en ligne</span><span className="text-[10px] font-bold text-[#008060]">Actif</span></div>
    <p className="text-xs text-[#6D7175]">D'autres canaux (marketplace, réseaux sociaux) sont en préparation — ils n'apparaissent ici que lorsqu'ils sont réellement connectés, pour éviter d'afficher un statut qui n'est pas vrai.</p>
  </div>;
}

export function SettingsDomains() { return <div className={card}><h2 className={ttl}>Domaines</h2><p className="text-sm text-[#6D7175] mb-4">Connectez un domaine existant ou achetez-en un via Sellia (Cloudflare Registrar, +10%).</p><Link to="/domains" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#008060] hover:underline">Gérer les domaines →</Link></div>; }
export function SettingsCustomerEvents() { return <div className={card}><h2 className={ttl}>Événements client</h2><p className="text-sm text-[#6D7175]">Suivez les événements (clics, vues, ajouts panier) pour vos automatisations marketing.</p><Link to="/automations" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#008060] hover:underline mt-4">Configurer les automatisations →</Link></div>; }

export function SettingsNotifications() {
  const { settings, patch, saved } = useSettingsBag();
  const n = { order: true, stock: true, review: true, msg: true, ...(settings.notifications || {}) };
  const set = (k, v) => patch({ notifications: { ...n, [k]: v } });
  return <div className={card}><h2 className={ttl}>Notifications <SavedBadge show={saved} /></h2><div className="space-y-3">{[['order', 'Nouvelle commande'], ['stock', 'Stock faible'], ['review', 'Nouvel avis client'], ['msg', 'Nouveau message']].map(([k, l]) => (<label key={k} className="flex items-center justify-between"><span className="text-sm text-[#202223]">{l}</span><input type="checkbox" checked={n[k]} onChange={(e) => set(k, e.target.checked)} className="accent-[#008060] w-4 h-4" /></label>))}</div><p className="text-[11px] text-[#6D7175] mt-3">« Nouvelle commande » vous envoie un vrai e-mail à chaque commande. Les autres notifications (stock faible, avis, message) sont enregistrées mais pas encore envoyées par e-mail.</p></div>;
}

export function SettingsMetafields() { return <div className={card}><h2 className={ttl}>Métadonnées et métaobjets</h2><p className="text-sm text-[#6D7175]">Pas encore disponible sur cette plateforme.</p></div>; }

export function SettingsLanguages() {
  return <div className={card}><h2 className={ttl}>Langues</h2><p className="text-sm text-[#6D7175]">L'interface d'administration et la vitrine sont actuellement en français uniquement. Le support multilingue n'est pas encore disponible.</p></div>;
}

export function SettingsCustomerPrivacy() {
  const { settings, patch, saved } = useSettingsBag();
  const p = { cookie_consent: true, gdpr: true, anonymize_24m: false, ...(settings.privacy || {}) };
  const set = (k, v) => patch({ privacy: { ...p, [k]: v } });
  return <div className={card}><h2 className={ttl}>Confidentialité client <SavedBadge show={saved} /></h2><div className="space-y-3">{[['cookie_consent', 'Demander le consentement cookies'], ['gdpr', 'Respecter le RGPD'], ['anonymize_24m', 'Anonymiser les données après 24 mois']].map(([k, l]) => (<label key={k} className="flex items-center justify-between"><span className="text-sm text-[#202223]">{l}</span><input type="checkbox" checked={p[k]} onChange={(e) => set(k, e.target.checked)} className="accent-[#008060] w-4 h-4" /></label>))}</div><p className="text-[11px] text-[#6D7175] mt-3">Préférences enregistrées. Elles ne déclenchent pas encore d'action automatique (bannière cookies, purge de données).</p></div>;
}

export function SettingsPolicies() {
  const { settings, patch, saved } = useSettingsBag();
  const [p, setP] = useState(null);
  useEffect(() => { setP({ refund: '', privacy: '', terms: '', shipping: '', ...(settings.policies || {}) }); }, [settings.policies]);
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); await patch({ policies: p }); setSaving(false); };
  if (!p) return null;
  return <div className={card}><h2 className={ttl}>Politiques <SavedBadge show={saved} /></h2><div className="space-y-3">{[['refund', 'Politique de remboursement'], ['privacy', 'Politique de confidentialité'], ['terms', "Conditions d'utilisation"], ['shipping', 'Politique de livraison']].map(([k, l]) => (<div key={k}><label className={lbl}>{l}</label><textarea value={p[k]} onChange={(e) => setP({ ...p, [k]: e.target.value })} rows={3} className={fld} placeholder="Saisissez votre politique…" /></div>))}</div><button onClick={save} disabled={saving} className="mt-4 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] disabled:opacity-40">{saving ? 'Enregistrement…' : 'Enregistrer'}</button><p className="text-[11px] text-[#6D7175] mt-2">Ces textes ne sont pas encore affichés automatiquement sur la vitrine publique.</p></div>;
}

export function SettingsSupportChat() { return <div className={card}><h2 className={ttl}>Support et chat en direct</h2><p className="text-sm text-[#6D7175] mb-4">Accédez à la documentation et au support en direct.</p><div className="flex gap-3"><Link to="/centre-aide" className="text-sm font-semibold text-white bg-[#008060] px-4 py-2 rounded-full hover:bg-[#00694d]">Centre d'aide</Link><a href="mailto:support@liafrik.com" className="text-sm font-semibold text-[#202223] border border-[#E1E1E1] px-4 py-2 rounded-full hover:bg-black/5">Contacter le support</a></div></div>; }
