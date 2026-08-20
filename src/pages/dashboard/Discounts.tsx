import { PageHeader, Card, Button, Table, Badge, EmptyState } from './ui';
import { Tag, Plus, Sparkles, X, Edit2, Trash2, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDiscounts, saveDiscounts, type Discount, type DiscountType, type DiscountStatus } from '../../lib/app-state';
import { fetchCloudDiscounts, pushCloudDiscounts, deleteCloudDiscount, ensureUuidId } from '../../lib/tenant-sync';

const TYPE_LABELS: Record<DiscountType, string> = { percentage: 'Pourcentage', fixed_amount: 'Montant fixe', free_shipping: 'Livraison' };
const STATUS_LABELS: Record<DiscountStatus, string> = { active: 'Actif', scheduled: 'Programmé', expired: 'Expiré' };
const STATUS_COLORS: Record<DiscountStatus, string> = { active: 'green', scheduled: 'brand', expired: 'gray' };

export default function Discounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);

  const [dCode, setDCode] = useState('');
  const [dTitle, setDTitle] = useState('');
  const [dType, setDType] = useState<DiscountType>('percentage');
  const [dValue, setDValue] = useState(10);
  const [dMinOrder, setDMinOrder] = useState(0);
  const [dUsageLimit, setDUsageLimit] = useState(100);
  const [dStatus, setDStatus] = useState<DiscountStatus>('active');

  useEffect(() => {
    const local = getDiscounts().map(d => ({ ...d, id: ensureUuidId(d.id) }));
    setDiscounts(local);
    saveDiscounts(local);
    fetchCloudDiscounts().then(cloud => {
      if (cloud && cloud.length > 0) {
        setDiscounts(cloud);
        saveDiscounts(cloud);
      } else {
        pushCloudDiscounts(local);
      }
    });
  }, []);

  const openAdd = () => {
    setEditing(null); setDCode(''); setDTitle(''); setDType('percentage'); setDValue(10);
    setDMinOrder(0); setDUsageLimit(100); setDStatus('active'); setIsModalOpen(true);
  };

  const openEdit = (d: Discount) => {
    setEditing(d); setDCode(d.code); setDTitle(d.title); setDType(d.type); setDValue(d.value);
    setDMinOrder(d.minOrder || 0); setDUsageLimit(d.usageLimit || 100); setDStatus(d.status); setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dCode.trim() || !dTitle.trim()) return;
    if (editing) {
      const updated = discounts.map(d => d.id === editing.id ? { ...d, code: dCode.toUpperCase(), title: dTitle, type: dType, value: Number(dValue), minOrder: Number(dMinOrder), usageLimit: Number(dUsageLimit), status: dStatus } : d);
      setDiscounts(updated); saveDiscounts(updated); pushCloudDiscounts(updated);
    } else {
      const newD: Discount = { id: crypto.randomUUID(), code: dCode.toUpperCase(), title: dTitle, type: dType, value: Number(dValue), currency: 'XOF', minOrder: Number(dMinOrder), usageLimit: Number(dUsageLimit), usedCount: 0, status: dStatus, createdAt: new Date().toISOString().slice(0, 10) };
      const updated = [newD, ...discounts];
      setDiscounts(updated); saveDiscounts(updated); pushCloudDiscounts(updated);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce code promo ?')) {
      const updated = discounts.filter(d => d.id !== id);
      setDiscounts(updated); saveDiscounts(updated); deleteCloudDiscount(id);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
  };

  const fmtValue = (d: Discount) => {
    if (d.type === 'percentage') return `${d.value}%`;
    if (d.type === 'fixed_amount') return `${d.value.toLocaleString('fr-FR')} ${d.currency || 'XOF'}`;
    return 'Offerte';
  };

  return (
    <div>
      <PageHeader title="Discounts" subtitle="Codes promo et réductions automatiques." action={<Button onClick={openAdd}><Plus size={16} /> Créer une réduction</Button>} />
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Sparkles size={16} className="text-brand-600" />
          <span>L'IA peut générer automatiquement des promotions selon votre stock et votre saison.</span>
          <Button variant="secondary" size="sm" className="ml-auto">Générer une promo</Button>
        </div>
      </Card>
      <Card>
        {discounts.length === 0 ? (
          <EmptyState icon={Tag} title="Aucune réduction" desc="Créez des codes promo pour fidéliser vos clients." action={<Button onClick={openAdd}><Plus size={16} /> Créer</Button>} />
        ) : (
          <Table headers={['Code', 'Titre', 'Type', 'Valeur', 'Min. commande', 'Utilisations', 'Statut', 'Actions']}>
            {discounts.map(d => (
              <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-medium text-gray-900">{d.code}</span>
                    <button onClick={() => copyCode(d.code)} className="text-gray-300 hover:text-brand-600"><Copy size={12} /></button>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-700">{d.title}</td>
                <td className="py-3 px-4 text-gray-500">{TYPE_LABELS[d.type]}</td>
                <td className="py-3 px-4 text-gray-700 font-medium">{fmtValue(d)}</td>
                <td className="py-3 px-4 text-gray-500">{d.minOrder ? `${d.minOrder.toLocaleString('fr-FR')} XOF` : '—'}</td>
                <td className="py-3 px-4 text-gray-700">{d.usedCount}/{d.usageLimit || '∞'}</td>
                <td className="py-3 px-4"><Badge color={STATUS_COLORS[d.status] as any}>{STATUS_LABELS[d.status]}</Badge></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(d)} className="text-brand-600 text-sm font-medium hover:underline flex items-center gap-1"><Edit2 size={12} /></button>
                    <button onClick={() => handleDelete(d.id)} className="text-red-500 text-sm hover:underline"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? 'Modifier la réduction' : 'Nouvelle réduction'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Code promo *</label><input required value={dCode} onChange={e => setDCode(e.target.value.toUpperCase())} placeholder="EX: SUMMER20" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-500" /></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Titre *</label><input required value={dTitle} onChange={e => setDTitle(e.target.value)} placeholder="Ex: Réduction d'été" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Type</label>
                  <select value={dType} onChange={e => setDType(e.target.value as DiscountType)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500">
                    <option value="percentage">Pourcentage (%)</option><option value="fixed_amount">Montant fixe</option><option value="free_shipping">Livraison offerte</option>
                  </select>
                </div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Valeur {dType === 'percentage' ? '(%)' : dType === 'fixed_amount' ? '(XOF)' : ''}</label><input type="number" value={dValue} onChange={e => setDValue(Number(e.target.value))} disabled={dType === 'free_shipping'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50" /></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Min. commande (XOF)</label><input type="number" value={dMinOrder} onChange={e => setDMinOrder(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Limite d'utilisation</label><input type="number" value={dUsageLimit} onChange={e => setDUsageLimit(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" /></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Statut</label>
                  <select value={dStatus} onChange={e => setDStatus(e.target.value as DiscountStatus)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500">
                    <option value="active">Actif</option><option value="scheduled">Programmé</option><option value="expired">Expiré</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit">{editing ? 'Enregistrer' : 'Créer'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
