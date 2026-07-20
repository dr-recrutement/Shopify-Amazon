import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, Badge, EmptyState, Table, Button } from './ui';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Users, X, Mail, Phone, Edit3 } from 'lucide-react';

type Customer = {
  id: string; name: string | null; email: string | null; phone: string | null;
  total_spent_cents: number; orders_count: number; created_at: string;
};

export default function Customers() {
  const { tenant } = useTenant();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const load = useCallback(async () => {
    if (!tenant) return;
    const { data } = await supabase.from('customers').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false });
    setCustomers(data || []);
    setLoading(false);
  }, [tenant]);

  useEffect(() => { if (tenant) load(); }, [tenant, load]);

  const saveEdit = async () => {
    if (!viewing) return;
    await supabase.from('customers').update({ name: form.name, email: form.email, phone: form.phone }).eq('id', viewing.id);
    setEditing(false); setViewing(null); load();
  };

  const openEdit = (c: Customer) => {
    setViewing(c);
    setEditing(true);
    setForm({ name: c.name || '', email: c.email || '', phone: c.phone || '' });
  };

  const fmt = (cents: number, currency: string) => `${(cents / 100).toLocaleString('fr-FR')} ${currency}`;

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <PageHeader title="Clients" subtitle="Votre base clients et segments." />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Total clients</p><p className="mt-2 text-2xl font-semibold">{customers.length}</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Nouveaux (30j)</p><p className="mt-2 text-2xl font-semibold">{customers.filter(c => Date.now() - new Date(c.created_at).getTime() < 30 * 86400000).length}</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Total dépensé</p><p className="mt-2 text-2xl font-semibold">{fmt(customers.reduce((s, c) => s + c.total_spent_cents, 0), tenant?.currency || 'XOF')}</p></Card>
      </div>
      <Card>
        {customers.length === 0 ? (
          <EmptyState icon={Users} title="Aucun client" desc="Vos clients apparaîtront ici dès qu'ils passeront commande." />
        ) : (
          <Table headers={['Client', 'Email', 'Téléphone', 'Commandes', 'Total dépensé', '']}>
            {customers.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{c.name || '—'}</td>
                <td className="py-3 px-4 text-gray-500">{c.email || '—'}</td>
                <td className="py-3 px-4 text-gray-500">{c.phone || '—'}</td>
                <td className="py-3 px-4 text-gray-700">{c.orders_count || 0}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{fmt(c.total_spent_cents || 0, tenant?.currency || 'XOF')}</td>
                <td className="py-3 px-4"><button onClick={() => openEdit(c)} className="text-orange-600 text-sm font-medium hover:underline flex items-center gap-1"><Edit3 size={12} /> Voir</button></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => { setViewing(null); setEditing(false); }}>          <Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Fiche client</h3>
              <button onClick={() => { setViewing(null); setEditing(false); }}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3 text-sm">
              {editing ? (
                <>
                  <div><label className="block text-sm font-medium mb-1">Nom</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium mb-1">Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium mb-1">Téléphone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                  <Button onClick={saveEdit} className="w-full">Sauvegarder</Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2"><Users size={14} className="text-gray-400" /> <span className="font-medium">{viewing.name || '—'}</span></div>
                  <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {viewing.email || '—'}</div>
                  <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {viewing.phone || '—'}</div>
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex justify-between"><span className="text-gray-500">Commandes</span><span className="font-medium">{viewing.orders_count || 0}</span></div>
                    <div className="flex justify-between mt-1"><span className="text-gray-500">Total dépensé</span><span className="font-medium">{fmt(viewing.total_spent_cents || 0, tenant?.currency || 'XOF')}</span></div>
                    <div className="flex justify-between mt-1"><span className="text-gray-500">Inscrit le</span><span className="font-medium">{new Date(viewing.created_at).toLocaleDateString('fr-FR')}</span></div>
                  </div>
                  <Button variant="secondary" className="w-full" onClick={() => setEditing(true)}><Edit3 size={14} /> Modifier</Button>
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
