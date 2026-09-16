import { PageHeader, Card, Button } from '../dashboard/ui';
import { Wrench, Megaphone, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchPlatformSettings, savePlatformSettings, type PlatformSettings } from '../../lib/platform-settings';
import { useToast } from '../../lib/toast';

const DEFAULTS: PlatformSettings = {
  maintenance_mode: false,
  maintenance_message: 'La plateforme est en maintenance. Nous serons de retour très bientôt.',
  announcement_active: false,
  announcement_message: '',
};

/**
 * Real Configuration admin page — replaces the last AdminGeneric "not
 * built yet" stub. Deliberately scoped to what's safely wireable without
 * rearchitecting routing: maintenance mode gates the merchant dashboard
 * only (see DashboardLayout.tsx) — the public storefront stays up so
 * shoppers can keep buying during merchant-side maintenance — plus a
 * platform-wide announcement banner shown to every merchant. Broader
 * config (per-country payment defaults, global integrations) can extend
 * the same platform_settings table later; this is real infrastructure,
 * not a placeholder that only covers two fields forever.
 */
export default function AdminConfiguration() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlatformSettings().then(s => { if (s) setSettings(s); setLoading(false); });
  }, []);

  const save = async () => {
    setSaving(true);
    const ok = await savePlatformSettings(settings);
    setSaving(false);
    showToast(ok ? 'Configuration enregistrée ✓' : "Échec de l'enregistrement.", ok ? 'success' : 'error');
  };

  if (loading) return <div className="p-10 text-center text-sm text-gray-400">Chargement…</div>;

  return (
    <div>
      <PageHeader
        title="Configuration"
        subtitle="Réglages globaux de la plateforme, appliqués à tous les marchands."
        action={<Button onClick={save} disabled={saving}><Save size={14} /> {saving ? 'Enregistrement…' : 'Enregistrer'}</Button>}
      />

      <div className="space-y-6 max-w-2xl">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Wrench size={16} className="text-amber-600" />
            <h3 className="font-semibold text-gray-900">Mode maintenance</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">Bloque l'accès au tableau de bord marchand (pas la boutique publique — vos marchands continuent de vendre) avec le message ci-dessous.</p>

          <label className="flex items-center gap-2.5 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={settings.maintenance_mode}
              onChange={e => setSettings(s => ({ ...s, maintenance_mode: e.target.checked }))}
              className="w-4 h-4 rounded accent-brand-600"
            />
            <span className="text-sm font-medium text-gray-800">Activer le mode maintenance</span>
          </label>

          <label className="block text-xs font-bold text-gray-600 mb-1">Message affiché aux marchands</label>
          <textarea
            value={settings.maintenance_message}
            onChange={e => setSettings(s => ({ ...s, maintenance_message: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">Bannière d'annonce</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">Message affiché en haut du tableau de bord de tous les marchands (ex: nouvelle fonctionnalité, incident en cours).</p>

          <label className="flex items-center gap-2.5 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={settings.announcement_active}
              onChange={e => setSettings(s => ({ ...s, announcement_active: e.target.checked }))}
              className="w-4 h-4 rounded accent-brand-600"
            />
            <span className="text-sm font-medium text-gray-800">Afficher la bannière</span>
          </label>

          <label className="block text-xs font-bold text-gray-600 mb-1">Message</label>
          <textarea
            value={settings.announcement_message}
            onChange={e => setSettings(s => ({ ...s, announcement_message: e.target.value }))}
            rows={2}
            placeholder="Ex: Nouveauté : l'Assistant IA est maintenant disponible pour tous les marchands 🎉"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </Card>
      </div>
    </div>
  );
}
