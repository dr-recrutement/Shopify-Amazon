import { PageHeader, Card, Button, Badge } from '../dashboard/ui';
import { Save, Globe, Shield, Server, Mail } from 'lucide-react';
import { useState } from 'react';

export default function AdminSettings() {
  const [config, setConfig] = useState({
    platformName: 'LiAfrikOS',
    supportEmail: 'info@liafrik.com',
    defaultLanguage: 'fr',
    defaultCurrency: 'XOF',
    signupEnabled: true,
    trialDays: 7,
    maintenanceMode: false,
    cloudflareZone: 'liafrikos.com',
    customHostnamesEnabled: true,
  });

  return (
    <div>
      <PageHeader title="Configuration" subtitle="Paramètres globaux de la plateforme." action={<Button><Save size={16} /> Enregistrer</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Globe size={16} /> Général</h3>
          <div className="space-y-3">
            <div><label className="block text-sm font-medium mb-1">Nom de la plateforme</label><input value={config.platformName} onChange={e => setConfig({ ...config, platformName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Email de support</label><div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={config.supportEmail} onChange={e => setConfig({ ...config, supportEmail: e.target.value })} className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm" /></div></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium mb-1">Langue par défaut</label><select value={config.defaultLanguage} onChange={e => setConfig({ ...config, defaultLanguage: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="fr">Français</option><option value="en">English</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Devise par défaut</label><select value={config.defaultCurrency} onChange={e => setConfig({ ...config, defaultCurrency: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="XOF">XOF</option><option value="GHS">GHS</option><option value="NGN">NGN</option><option value="KES">KES</option><option value="USD">USD</option></select></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Durée d'essai (jours)</label><input type="number" value={config.trialDays} onChange={e => setConfig({ ...config, trialDays: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Server size={16} /> Infrastructure Cloudflare</h3>
          <div className="space-y-3">
            <div><label className="block text-sm font-medium mb-1">Zone Cloudflare</label><input value={config.cloudflareZone} onChange={e => setConfig({ ...config, cloudflareZone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" /></div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div><span className="text-sm font-medium">Custom Hostnames</span><p className="text-xs text-gray-500">Domaines personnalisés vendeurs (Premium/Entreprise)</p></div>
              <button onClick={() => setConfig({ ...config, customHostnamesEnabled: !config.customHostnamesEnabled })} className={`w-10 h-6 rounded-full transition-colors ${config.customHostnamesEnabled ? 'bg-orange-600' : 'bg-gray-300'}`}><div className={`w-5 h-5 bg-white rounded-full transition-transform ${config.customHostnamesEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} /></button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div><span className="text-sm font-medium">Inscriptions ouvertes</span><p className="text-xs text-gray-500">Autoriser de nouveaux vendeurs</p></div>
              <button onClick={() => setConfig({ ...config, signupEnabled: !config.signupEnabled })} className={`w-10 h-6 rounded-full transition-colors ${config.signupEnabled ? 'bg-orange-600' : 'bg-gray-300'}`}><div className={`w-5 h-5 bg-white rounded-full transition-transform ${config.signupEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} /></button>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div><span className="text-sm font-medium text-red-700">Mode maintenance</span><p className="text-xs text-red-500">Bloque l'accès à toutes les boutiques</p></div>
              <button onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })} className={`w-10 h-6 rounded-full transition-colors ${config.maintenanceMode ? 'bg-red-600' : 'bg-gray-300'}`}><div className={`w-5 h-5 bg-white rounded-full transition-transform ${config.maintenanceMode ? 'translate-x-4' : 'translate-x-0.5'}`} /></button>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Shield size={16} /> Sécurité</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><span className="text-sm font-medium">MFA obligatoire (Super Admins)</span><Badge color="green">Actif</Badge></div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><span className="text-sm font-medium">Chiffrement AES-256 (clés API)</span><Badge color="green">Actif</Badge></div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><span className="text-sm font-medium">RLS multi-tenant</span><Badge color="green">Actif</Badge></div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><span className="text-sm font-medium">Audit logs</span><Badge color="green">Actif</Badge></div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Statut système</h3>
          <div className="space-y-2">
            {[
              { name: 'Frontend (Cloudflare Pages)', status: 'operational' },
              { name: 'Base de données (Supabase)', status: 'operational' },
              { name: 'Auth (Supabase Auth)', status: 'operational' },
              { name: 'Edge Functions', status: 'operational' },
              { name: 'CDN global', status: 'operational' },
            ].map(s => (
              <div key={s.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{s.name}</span>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-xs text-green-600">Opérationnel</span></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
