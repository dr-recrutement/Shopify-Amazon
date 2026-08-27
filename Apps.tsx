import { PageHeader, Card, Button, Badge } from './ui';
import { BarChart3, Facebook, Music2, Webhook, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchCloudSettings, pushCloudSettings } from '../../lib/tenant-sync';

/**
 * Real, functional app connectors — no fake "Connect" buttons. Each of
 * these stores a real tracking ID that StorefrontPage.tsx actually
 * injects into the live storefront (see the analytics script loader
 * there) — genuinely different from just saving a setting nobody reads.
 * Zapier/Make.com aren't literal OAuth integrations (would need
 * registering an app with each of them, which isn't something to fake
 * with placeholder credentials) — their real underlying mechanism is a
 * webhook, which is already real and built (Settings > Customer events).
 */
export default function Apps() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [saved, setSaved] = useState(false);
  const [openApp, setOpenApp] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    fetchCloudSettings().then(cloud => { if (cloud) setSettings(cloud); });
  }, []);

  const save = (key: string, value: string) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      pushCloudSettings(next);
      return next;
    });
    setSaved(true);
    setOpenApp(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const apps = [
    { id: 'gaId', icon: BarChart3, name: 'Google Analytics', desc: 'Suivi du trafic et du comportement des visiteurs (GA4).', placeholder: 'G-XXXXXXXXXX' },
    { id: 'metaPixelId', icon: Facebook, name: 'Meta Pixel', desc: 'Suivi des conversions pour vos publicités Facebook/Instagram.', placeholder: '1234567890123456' },
    { id: 'tiktokPixelId', icon: Music2, name: 'TikTok Pixel', desc: 'Suivi des conversions pour vos publicités TikTok.', placeholder: 'CXXXXXXXXXXXXXXXXXXX' },
    { id: 'gtmId', icon: BarChart3, name: 'Google Tag Manager', desc: 'Gérez tous vos scripts de suivi depuis un seul conteneur.', placeholder: 'GTM-XXXXXXX' },
  ];

  return (
    <div>
      <PageHeader title="Apps" subtitle="Connectez de vrais outils à votre boutique — chaque ID est réellement injecté sur votre vitrine publique." />
      {saved && <p className="text-green-600 text-xs mb-4">Enregistré ✓ — actif sur votre boutique dès le prochain chargement de page.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {apps.map(app => {
          const Icon = app.icon;
          const connected = !!settings[app.id];
          return (
            <Card key={app.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0"><Icon size={18} className="text-brand-600" /></div>
                  <div>
                    <p className="font-semibold text-gray-900">{app.name}</p>
                    <p className="text-xs text-gray-500">{app.desc}</p>
                  </div>
                </div>
                {connected && <Badge color="green"><Check size={10} className="inline mr-0.5" /> Actif</Badge>}
              </div>
              {openApp === app.id ? (
                <div className="mt-4 flex gap-2">
                  <input
                    autoFocus
                    defaultValue={settings[app.id] || ''}
                    onChange={e => setDraft(e.target.value)}
                    placeholder={app.placeholder}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                  />
                  <Button size="sm" onClick={() => save(app.id, draft)}>Enregistrer</Button>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => { setOpenApp(app.id); setDraft(settings[app.id] || ''); }}>
                    {connected ? 'Modifier' : 'Connecter'}
                  </Button>
                  {connected && <Button variant="ghost" size="sm" onClick={() => save(app.id, '')}>Déconnecter</Button>}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0"><Webhook size={18} className="text-brand-600" /></div>
          <div>
            <p className="font-semibold text-gray-900">Zapier, Make.com & automatisations</p>
            <p className="text-xs text-gray-500">Ces outils se connectent via un webhook — déjà réel et fonctionnel, configurable dans Réglages.</p>
          </div>
        </div>
        <Link to="/app/settings"><Button variant="secondary" size="sm" className="mt-4">Configurer le webhook</Button></Link>
      </Card>
    </div>
  );
}
