import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Button, EmptyState, Table, Badge } from './ui';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Tag, Plus, X, Trash2, AlertCircle } from 'lucide-react';

type Discount = {
  id: string; code: string; discount_type: string; value: number; min_amount_cents: number;
  max_uses: number | null; used_count: number; starts_at: string | null; ends_at: string | null;
  is_active: boolean; created_at: string;
};

export default function Discounts() {
  const { tenant } = useTenant();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discount_type: 'percentage', value: '', min_amount: '', max_uses: '', starts_at: '', ends_at: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!tenant) return;
    const { data } = await supabase.from('discount_codes').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false });
    setDiscounts(data || []);
    setLoading(false);
  }, [tenant]);

  useEffect(() => { if (tenant) load(); }, [tenant, load]);

  const save = async () => {
    if (!tenant || !form.code || !form.value) return;
    setSaving(true); setError('');
    const payload = {
      tenant_id: tenant.id, code: form.code.toUpperCase(), discount_type: form.discount_type,
      value: parseFloat(form.value), min_amount_cents: form.min_amount ? Math.round(parseFloat(form.min_amount) * 100) : 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      starts_at: form.starts_at || null, ends_at: form.ends_at || null, is_active: true,
    };
    const { error: e } = await supabase.from('discount_codes').insert(payload);
    if (e) { setError(e.message); setSaving(false); return; }
    setShowForm(false); setSaving(false); setForm({ code: '', discount_type: 'percentage', value: '', min_amount: '', max_uses: '', starts_at: '', ends_at: '' }); load();
  };

  const toggle = async (d: Discount) => {
    await supabase.from('discount_codes').update({ is_active: !d.is_active }).eq('id', d.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce code ?')) return;
    await supabase.from('discount_codes').delete().eq('id', id);
    load();
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <PageHeader title="Réductions" subtitle="Créez des codes promo et des remises." action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Créer un code</Button>} />
      <Card>
        {discounts.length === 0 ? (
          <EmptyState icon={Tag} title="Aucune réduction" desc="Créez des codes promo pour stimuler vos ventes." action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Créer un code</Button>} />
        ) : (
          <Table headers={['Code', 'Type', 'Valeur', 'Utilisé', 'Statut', '']}>
            {discounts.map(d => (
              <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-mono font-medium text-gray-900">{d.code}</td>
                <td className="py-3 px-4 text-gray-700">{d.discount_type === 'percentage' ? 'Pourcentage' : 'Montant fixe'}</td>
                <td className="py-3 px-4 text-gray-700">{d.discount_type === 'percentage' ? `${d.value}%` : `${d.value} ${tenant?.currency || 'XOF'}`}</td>
                <td className="py-3 px-4 text-gray-700">{d.used_count}/{d.max_uses || '∞'}</td>
                <td className="py-3 px-4"><Badge color={d.is_active ? 'green' : 'gray'}>{d.is_active ? 'Actif' : 'Inactif'}</Badge></td>
                <td className="py-3 px-4 flex gap-2">
                  <button onClick={() => toggle(d)} className="text-xs text-gray-600 hover:underline">{d.is_active ? 'Désactiver' : 'Activer'}</button>
                  <button onClick={() => remove(d.id)} className="text-red-600 text-xs hover:underline"><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Nouveau code promo</h3>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            {error && <div className="mb-3 flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-lg text-sm"><AlertCircle size={14} />{error}</div>}
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Code *</label><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER25" className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono" /></div>
              <div><label className="block text-sm font-medium mb-1">Type de réduction</label><select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="percentage">Pourcentage (%)</option><option value="fixed">Montant fixe</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Valeur *</label><input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="25" className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Montant minimum ({tenant?.currency || 'XOF'})</label><input type="number" value={form.min_amount} onChange={e => setForm({ ...form, min_amount: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Max utilisations (vide = illimité)</label><input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Début</label><input type="date" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Fin</label><input type="date" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
              </div>
              <Button onClick={save} disabled={saving || !form.code || !form.value} className="w-full">{saving ? 'Création...' : 'Créer le code'}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
