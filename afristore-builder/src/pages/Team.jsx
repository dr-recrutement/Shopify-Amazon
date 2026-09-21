import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users as UsersIcon, UserPlus, Loader2, AlertCircle, Trash2, Mail, Shield, Crown, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { hasFeature, getFeatureValue } from '@/lib/plans';

export default function Team() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const maxUsers = getFeatureValue(store?.plan || 'growth', 'users');
  const canInvite = hasFeature(store?.plan || 'growth', 'users') ? users.length < maxUsers : true;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await base44.entities.User.list());
    } catch (e) {
      setUsers([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const invite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setError(null);
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      setToast(`Invitation envoyée à ${inviteEmail}`);
      setInviteEmail('');
      setTimeout(() => setToast(null), 3000);
      await load();
    } catch (e) {
      setError(e.message || 'Impossible d’inviter cet utilisateur');
    } finally {
      setInviting(false);
    }
  };

  if (storeLoading || loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-brand mx-auto mb-3" />
        <h1 className="text-lg font-bold text-foreground">Configurez votre boutique</h1>
        <Link to="/store-setup" className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground text-sm font-medium px-4 py-2 rounded-full hover:bg-brand/90 mt-3">Configurer</Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <UsersIcon className="w-5 h-5 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Équipe</h1>
          <p className="text-xs text-muted-foreground">{users.length} membre{users.length > 1 ? 's' : ''} {maxUsers === Infinity ? '' : `· ${Math.max(0, maxUsers - users.length)} place${maxUsers - users.length > 1 ? 's' : ''} restante${maxUsers - users.length > 1 ? 's' : ''}`}.</p>
        </div>
      </div>

      {toast && (
        <div className="mb-4 rounded-xl border border-brand/30 bg-brand-muted px-4 py-3 text-sm font-medium text-brand flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Invite form */}
      <div className="rounded-2xl border border-border bg-white p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-brand" />
          <h2 className="font-heading font-bold text-base text-foreground">Inviter un membre</h2>
        </div>
        {maxUsers !== Infinity && users.length >= maxUsers ? (
          <div className="rounded-xl bg-surface border border-border p-4 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-muted-foreground inline mr-1.5" />
            Vous avez atteint la limite de {maxUsers} membre{maxUsers > 1 ? 's' : ''} de votre plan. <Link to="/settings" className="text-brand font-semibold">Mettre à niveau</Link> pour inviter plus de membres.
          </div>
        ) : (
          <form onSubmit={invite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="flex-1 px-4 py-2.5 border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              required
            />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="px-4 py-2.5 border border-border rounded-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/30">
              <option value="user">Membre</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={inviting} className="inline-flex items-center justify-center gap-1.5 bg-brand text-brand-foreground font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-brand/90 transition-colors disabled:opacity-50">
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Inviter
            </button>
          </form>
        )}
      </div>

      {/* Members list */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-heading font-bold text-base text-foreground mb-4">Membres</h2>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors">
              <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold shrink-0">
                {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{u.full_name || u.email}</p>
                {u.full_name && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
              </div>
              {u.role === 'admin' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-foreground text-background px-2.5 py-1 rounded-full shrink-0">
                  <Crown className="w-3 h-3" /> Admin
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}