import { PageHeader, Card, Button, Table, Badge, EmptyState } from './ui';
import { Users, Plus, Filter, UserPlus, X, Edit2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCustomers, saveCustomers, type Customer, type CustomerSegment } from '../../lib/app-state';
import { fetchCloudCustomers, pushCloudCustomers, deleteCloudCustomer, ensureUuidId } from '../../lib/tenant-sync';

const SEGMENT_LABELS: Record<CustomerSegment, string> = { vip: 'VIP', new: 'Nouveau', regular: 'Régulier', inactive: 'Inactif' };
const SEGMENT_COLORS: Record<CustomerSegment, string> = { vip: 'brand', new: 'green', regular: 'gray', inactive: 'gray' };

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeSegment, setActiveSegment] = useState<CustomerSegment | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cCountry, setCCountry] = useState('CI');
  const [cCity, setCCity] = useState('');
  const [cSegment, setCSegment] = useState<CustomerSegment>('new');
  const [cNotes, setCNotes] = useState('');

  useEffect(() => {
    const local = getCustomers().map(c => ({ ...c, id: ensureUuidId(c.id) }));
    setCustomers(local);
    saveCustomers(local);
    fetchCloudCustomers().then(cloud => {
      if (cloud && cloud.length > 0) {
        setCustomers(cloud);
        saveCustomers(cloud);
      } else {
        pushCloudCustomers(local);
      }
    });
  }, []);

  const stats = {
    total: customers.length,
    new30: customers.filter(c => c.segment === 'new').length,
    avg: customers.length > 0 ? Math.round(customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length) : 0,
  };

  const filtered = customers.filter(c => {
    if (activeSegment !== 'all' && c.segment !== activeSegment) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openAdd = () => {
    setEditing(null); setCName(''); setCEmail(''); setCPhone(''); setCCountry('CI'); setCCity('');
    setCSegment('new'); setCNotes(''); setIsModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c); setCName(c.name); setCEmail(c.email); setCPhone(c.phone || '');
    setCCountry(c.country || 'CI'); setCCity(c.city || ''); setCSegment(c.segment); setCNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cEmail.trim()) return;
    if (editing) {
      const updated = customers.map(c => c.id === editing.id ? { ...c, name: cName, email: cEmail, phone: cPhone, country: cCountry, city: cCity, segment: cSegment, notes: cNotes } : c);
      setCustomers(updated); saveCustomers(updated); pushCloudCustomers(updated);
    } else {
      const newC: Customer = { id: crypto.randomUUID(), name: cName, email: cEmail, phone: cPhone, country: cCountry, city: cCity, ordersCount: 0, totalSpent: 0, currency: 'XOF', segment: cSegment, createdAt: new Date().toISOString().slice(0, 10), tags: [], notes: cNotes };
      const updated = [newC, ...customers];
      setCustomers(updated); saveCustomers(updated); pushCloudCustomers(updated);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce client ?')) {
      const updated = customers.filter(c => c.id !== id);
      setCustomers(updated); saveCustomers(updated); deleteCloudCustomer(id);
    }
  };

  const fmtMoney = (amt: number, cur: string) => `${amt.toLocaleString('fr-FR')} ${cur}`;

  return (
    <div>
      <PageHeader title="Clients" subtitle="Votre base clients et segments." action={<Button onClick={openAdd}><UserPlus size={16} /> Ajouter</Button>} />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Total clients</p><p className="mt-2 text-2xl font-bold">{stats.total}</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Nouveaux</p><p className="mt-2 text-2xl font-bold">{stats.new30}</p></Card>
        <Card className="p-5"><p className="text-xs text-gray-500 uppercase">Panier moyen</p><p className="mt-2 text-2xl font-bold">{fmtMoney(stats.avg, 'XOF')}</p></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Segments</h3>
          <div className="space-y-2">
            {(['all', 'vip', 'new', 'regular', 'inactive'] as const).map(s => (
              <button key={s} onClick={() => setActiveSegment(s)} className={`w-full text-left px-3 py-2 rounded-full text-sm ${activeSegment === s ? 'bg-brand-50 text-brand-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}>
                {s === 'all' ? 'Tous les clients' : SEGMENT_LABELS[s]} ({s === 'all' ? customers.length : customers.filter(c => c.segment === s).length})
              </button>
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-3">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <input type="text" placeholder="Rechercher par nom ou email..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={Users} title="Aucun client" desc="Ajoutez votre premier client." action={<Button onClick={openAdd}><Plus size={16} /> Ajouter</Button>} />
          ) : (
            <Table headers={['Client', 'Email', 'Commandes', 'Total dépensé', 'Segment', 'Actions']}>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-3 px-4 text-gray-500">{c.email}</td>
                  <td className="py-3 px-4 text-gray-700">{c.ordersCount}</td>
                  <td className="py-3 px-4 text-gray-700">{fmtMoney(c.totalSpent, c.currency)}</td>
                  <td className="py-3 px-4"><Badge color={SEGMENT_COLORS[c.segment] as any}>{SEGMENT_LABELS[c.segment]}</Badge></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(c)} className="text-brand-600 text-sm font-medium hover:underline flex items-center gap-1"><Edit2 size={12} /> Éditer</button>
                      <button onClick={() => handleDelete(c.id)} className="text-red-500 text-sm hover:underline"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? 'Modifier le client' : 'Nouveau client'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Nom complet *</label><input required value={cName} onChange={e => setCName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Email *</label><input required type="email" value={cEmail} onChange={e => setCEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Téléphone</label><input value={cPhone} onChange={e => setCPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Ville</label><input value={cCity} onChange={e => setCCity(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Pays</label>
                  <select value={cCountry} onChange={e => setCCountry(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500">
                    <option value="CI">Côte d'Ivoire</option><option value="SN">Sénégal</option><option value="GH">Ghana</option><option value="NG">Nigeria</option><option value="CM">Cameroun</option><option value="ML">Mali</option><option value="BF">Burkina Faso</option>
                  </select>
                </div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Segment</label>
                  <select value={cSegment} onChange={e => setCSegment(e.target.value as CustomerSegment)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500">
                    <option value="new">Nouveau</option><option value="regular">Régulier</option><option value="vip">VIP</option><option value="inactive">Inactif</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Notes</label><textarea rows={2} value={cNotes} onChange={e => setCNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" /></div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit">{editing ? 'Enregistrer' : 'Ajouter'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
