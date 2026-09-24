import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import CustomerForm from '@/components/admin/CustomerForm';
import { formatMoney } from '@/lib/world/currencies';
import {
  Users, Loader2, ArrowLeft, Search, AlertCircle, Plus, Pencil, Trash2, Mail, Phone,
} from 'lucide-react';

function avatarColor(s) {
  const colors = ['#008060', '#0EA5E9', '#6366F1', '#F59E0B', '#EC4899'];
  return colors[(s || '').charCodeAt(0) % colors.length] || colors[0];
}

export default function Customers() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', store.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      // The native table stores one `name` field (no tags column yet) -
      // split it back into first/last for the existing edit form.
      setCustomers((data || []).map((row) => {
        const [first_name, ...rest] = (row.name || '').split(' ');
        return {
          ...row,
          first_name: first_name || '',
          last_name: rest.join(' '),
          total_spent: (row.total_spent_cents || 0) / 100,
          tags: [],
        };
      }));
    } catch (e) {
      console.error('Failed to load customers:', e);
      setCustomers([]);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter((c) => {
    if (!q) return true;
    return `${c.first_name || ''} ${c.last_name || ''} ${c.email || ''} ${c.phone || ''}`.toLowerCase().includes(q.toLowerCase());
  });

  const remove = async (c) => {
    if (!confirm(`Supprimer le client ${c.email} ?`)) return;
    const { error } = await supabase.from('customers').delete().eq('id', c.id);
    if (error) { alert(error.message); return; }
    setCustomers((l) => l.filter((x) => x.id !== c.id));
  };

  if (storeLoading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Créez d'abord votre boutique</h1>
        <Link to="/onboarding" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#00694d] mt-3">Configurer ma boutique</Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F4F4F4]">
      <div className="sticky top-0 z-10 bg-white border-b border-[#E1E1E1] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="text-[#6D7175] hover:text-[#202223]"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-base font-bold text-[#202223] flex items-center gap-2"><Users className="w-4 h-4 text-[#008060]" /> Clients</h1>
            <p className="text-xs text-[#6D7175]">{store.name} · {customers.length} client(s)</p>
          </div>
        </div>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-3 sm:px-4 py-2 rounded-md hover:bg-[#00694d] shrink-0">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>

      <div className="px-4 sm:px-6 py-4 space-y-4">
        <div className="flex items-center gap-2 bg-white border border-[#E1E1E1] rounded-md px-3">
          <Search className="w-4 h-4 text-[#6D7175]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par nom, e-mail ou téléphone…" className="w-full bg-transparent py-2 text-sm outline-none" />
        </div>

        <div className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-10 h-10 text-[#C9C9C9] mb-2" />
              <p className="text-sm font-medium text-[#202223]">Aucun client</p>
              <p className="text-xs text-[#6D7175] mt-1 mb-4">Ajoutez manuellement ou laissez vos commandes les créer.</p>
              <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#00694d]"><Plus className="w-4 h-4" /> Ajouter un client</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAFAFA] text-[11px] font-semibold text-[#6D7175] uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5">Client</th>
                  <th className="text-left px-4 py-2.5 hidden sm:table-cell">Contact</th>
                  <th className="text-right px-4 py-2.5 hidden md:table-cell">Commandes</th>
                  <th className="text-right px-4 py-2.5">Total dépensé</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E1E1]">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: avatarColor(c.first_name || c.email) }}>
                          {(c.first_name?.[0] || c.email?.[0] || '?').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#202223] truncate">{c.first_name} {c.last_name}</p>
                          {c.tags?.length > 0 && <div className="flex gap-1 mt-0.5">{c.tags.map((t, i) => <span key={i} className="text-[10px] bg-[#F4F4F4] text-[#6D7175] px-1.5 py-0.5 rounded">{t}</span>)}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-[#6D7175]">
                      <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</p>
                      {c.phone && <p className="flex items-center gap-1 text-[11px]"><Phone className="w-3 h-3" /> {c.phone}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-right text-[#6D7175]">{c.orders_count || 0}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#202223]">{formatMoney(c.total_spent, store.currency)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditing(c); setFormOpen(true); }} className="p-1.5 rounded text-[#6D7175] hover:bg-black/5"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => remove(c)} className="p-1.5 rounded text-[#6D7175] hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      <CustomerForm open={formOpen} onOpenChange={setFormOpen} store={store} customer={editing} onSaved={load} />
    </div>
  );
}