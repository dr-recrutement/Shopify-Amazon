import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Badge, Button } from './ui';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { AFRICAN_COUNTRIES } from '../../lib/constants';
import { Globe, Check, Plus, X } from 'lucide-react';

const REGIONS = ['North Africa', 'West Africa', 'Central Africa', 'East Africa', 'Southern Africa'];
const REGION_LABELS: any = {
  'North Africa': 'Afrique du Nord', 'West Africa': "Afrique de l'Ouest",
  'Central Africa': 'Afrique Centrale', 'East Africa': "Afrique de l'Est",
  'Southern Africa': 'Afrique Australe',
};

type Market = { id: string; country: string; currency: string; language: string; is_active: boolean };

export default function Markets() {
  const { tenant } = useTenant();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ country: '', currency: '', language: 'fr' });

  const load = useCallback(async () => {
    if (!tenant) return;
    const { data } = await supabase.from('markets').select('*').eq('tenant_id', tenant.id);
    setMarkets(data || []);
    setLoading(false);
  }, [tenant]);

  useEffect(() => { if (tenant) load(); }, [tenant, load]);

  const activate = async () => {
    if (!tenant || !form.country) return;
    const country = AFRICAN_COUNTRIES.find(c => c.name === form.country);
    await supabase.from('markets').insert({
      tenant_id: tenant.id, country: form.country, currency: form.currency || country?.currency || 'XOF',
      language: form.language, is_active: true,
    });
    setShowForm(false); setForm({ country: '', currency: '', language: 'fr' }); load();
  };

  const toggle = async (m: Market) => {
    await supabase.from('markets').update({ is_active: !m.is_active }).eq('id', m.id); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Désactiver ce marché ?')) return;
    await supabase.from('markets').delete().eq('id', id); load();
  };

  const activeMarkets = markets.filter(m => m.is_active);

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <PageHeader title="Markets" subtitle="Activez les pays et devises pour votre boutique. 54 pays africains supportés." action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Activer un marché</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Marché par défaut</p><p className="mt-2 text-lg font-semibold">{tenant?.country || '—'}</p><p className="text-xs text-gray-500">{tenant?.currency || 'XOF'}</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Marchés actifs</p><p className="mt-2 text-lg font-semibold">{activeMarkets.length} pays</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Devises supportées</p><p className="mt-2 text-lg font-semibold">{[...new Set(activeMarkets.map(m => m.currency))].join(', ') || tenant?.currency || 'XOF'}</p></Card>
      </div>

      {activeMarkets.length > 0 && (
        <Card className="mb-6">
          <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Marchés actifs</h3></div>
          <div className="divide-y divide-gray-50">
            {activeMarkets.map(m => (
              <div key={m.id} className="p-4 flex items-center justify-between">
                <div><p className="font-medium text-gray-900">{m.country}</p><p className="text-xs text-gray-500">{m.currency} · {m.language === 'fr' ? 'Français' : 'English'}</p></div>
                <div className="flex items-center gap-2">
                  <Badge color="green"><Check size={10} /> Actif</Badge>
                  <button onClick={() => toggle(m)} className="text-xs text-gray-600 hover:underline">Désactiver</button>
                  <button onClick={() => remove(m.id)} className="text-xs text-red-600 hover:underline">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {REGIONS.map(region => {
        const countries = AFRICAN_COUNTRIES.filter(c => c.region === region);
        return (
          <Card key={region} className="mb-4">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{REGION_LABELS[region]} <span className="text-gray-400 font-normal">({countries.length} pays)</span></h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
              {countries.map(c => {
                const isActive = markets.some(m => m.country === c.name && m.is_active);
                return (
                  <div key={c.code} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    <span className="text-xl">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.currency}</div>
                    </div>
                    {isActive && <Check size={14} className="text-green-600" />}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Activer un marché</h3>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Pays *</label><select value={form.country} onChange={e => { const c = AFRICAN_COUNTRIES.find(x => x.name === e.target.value); setForm({ ...form, country: e.target.value, currency: c?.currency || '' }); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="">Sélectionnez...</option>{AFRICAN_COUNTRIES.map(c => <option key={c.code}>{c.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Devise</label><input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} placeholder="XOF" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Langue</label><select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="fr">Français</option><option value="en">English</option></select></div>
              </div>
              <Button onClick={activate} disabled={!form.country} className="w-full">Activer</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
