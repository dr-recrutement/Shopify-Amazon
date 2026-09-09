import { PageHeader, Card, Button, Badge, Table } from './ui';
import { Megaphone, Plus, Mail, MessageSquare, Calendar, Sparkles, Send, X, Eye, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCampaigns, saveCampaigns, getDiscounts, getAutomations, saveAutomations, type Campaign, type CampaignChannel, type AutomationTrigger, type AutomationAction } from '../../lib/app-state';
import { fetchCloudCampaigns, pushCloudCampaigns, deleteCloudCampaign, fetchCloudDiscounts, ensureUuidId } from '../../lib/tenant-sync';

const CHANNEL_LABELS: Record<CampaignChannel, string> = { email: 'Email', sms: 'SMS', social: 'Social' };
const STATUS_LABELS: Record<string, string> = { sent: 'Envoyée', active: 'Active', scheduled: 'Programmée', draft: 'Brouillon' };

const AUTOMATION_TEMPLATES: Array<{ name: string; trigger: AutomationTrigger; action: AutomationAction }> = [
  { name: 'Panier abandonné', trigger: 'abandoned_cart', action: 'send_email' },
  { name: 'Bienvenue nouveau client', trigger: 'customer_signup', action: 'send_email' },
  { name: 'Relance post-achat', trigger: 'order_paid', action: 'send_email' },
];

export default function Marketing() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [automations, setAutomations] = useState(() => getAutomations());
  const [showEditor, setShowEditor] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({ name: '', channel: 'email' as CampaignChannel, audience: 'Tous', subject: '', content: '', cta: 'Acheter maintenant', schedule: 'now', date: '', discountCode: '' });
  const [discountCodes, setDiscountCodes] = useState<string[]>([]);

  const activateTemplate = (t: { name: string; trigger: AutomationTrigger; action: AutomationAction }) => {
    const updated = [...automations, { id: crypto.randomUUID(), name: t.name, trigger: t.trigger, action: t.action, enabled: true, runs: 0, createdAt: new Date().toISOString().slice(0, 10) }];
    setAutomations(updated);
    saveAutomations(updated);
  };


  useEffect(() => {
    const local = getCampaigns().map(c => ({ ...c, id: ensureUuidId(c.id) }));
    setCampaigns(local);
    saveCampaigns(local);
    fetchCloudCampaigns().then(cloud => {
      if (cloud && cloud.length > 0) {
        setCampaigns(cloud);
        saveCampaigns(cloud);
      } else {
        pushCloudCampaigns(local);
      }
    });
    setDiscountCodes(getDiscounts().map(d => d.code));
    fetchCloudDiscounts().then(cloud => { if (cloud) setDiscountCodes(cloud.map(d => d.code)); });
  }, []);

  const sendCampaign = () => {
    if (!form.name.trim()) return;
    // Never claim 'sent' — no email/SMS provider is connected anywhere in
    // this platform yet, so nothing is actually transmitted to anyone.
    // Always saved as draft/scheduled instead of falsely marking it sent.
    const status = form.schedule === 'now' ? 'draft' : 'scheduled';
    const newC: Campaign = { id: crypto.randomUUID(), name: form.name, channel: form.channel, status: status as Campaign['status'], audience: 0, sent: 0, opened: 0, clicked: 0, revenue: 0, currency: 'XOF', createdAt: new Date().toISOString().slice(0, 10) };
    const updated = [newC, ...campaigns];
    setCampaigns(updated); saveCampaigns(updated); pushCloudCampaigns(updated);
    setShowEditor(false);
    setForm({ name: '', channel: 'email', audience: 'Tous', subject: '', content: '', cta: 'Acheter maintenant', schedule: 'now', date: '', discountCode: '' });
  };

  const deleteCampaign = (id: string) => {
    const updated = campaigns.filter(c => c.id !== id);
    setCampaigns(updated); saveCampaigns(updated); deleteCloudCampaign(id);
  };

  const totalOpens = campaigns.reduce((s, c) => s + c.opened, 0);
  const totalSent = campaigns.reduce((s, c) => s + c.sent, 0);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0;

  return (
    <div>
      <PageHeader title="Marketing" subtitle="Campagnes, automatisations et performance." action={<Button onClick={() => setShowEditor(true)}><Plus size={16} /> Créer une campagne</Button>} />

      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
        L'envoi réel d'emails et de SMS n'est pas encore branché sur un fournisseur — vos campagnes sont enregistrées en brouillon/programmées, mais aucun message n'est transmis à vos clients pour l'instant.
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><Mail size={18} className="text-brand-600 mb-2" /><p className="text-xs text-gray-500">Campagnes email</p><p className="text-xl font-bold">{campaigns.filter(c => c.channel === 'email').length}</p></Card>
        <Card className="p-4"><MessageSquare size={18} className="text-green-600 mb-2" /><p className="text-xs text-gray-500">Campagnes SMS</p><p className="text-xl font-bold">{campaigns.filter(c => c.channel === 'sms').length}</p></Card>
        <Card className="p-4"><Calendar size={18} className="text-blue-600 mb-2" /><p className="text-xs text-gray-500">Programmées</p><p className="text-xl font-bold">{campaigns.filter(c => c.status === 'scheduled').length}</p></Card>
        <Card className="p-4"><Sparkles size={18} className="text-purple-600 mb-2" /><p className="text-xs text-gray-500">Taux d'ouverture moyen</p><p className="text-xl font-bold">{avgOpenRate}%</p></Card>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Campagnes</h3></div>
        <Table headers={['Nom', 'Canal', 'Audience', 'Envoyés', 'Ouverts', 'Clics', 'Revenus', 'Statut', '']}>
          {campaigns.map(c => (
            <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900">{c.name}</td>
              <td className="py-3 px-4 text-gray-500">{CHANNEL_LABELS[c.channel]}</td>
              <td className="py-3 px-4 text-gray-500">{c.audience}</td>
              <td className="py-3 px-4 text-gray-700">{c.sent}</td>
              <td className="py-3 px-4 text-gray-700">{c.opened}</td>
              <td className="py-3 px-4 text-gray-700">{c.clicked}</td>
              <td className="py-3 px-4 text-gray-700">{c.revenue.toLocaleString('fr-FR')} {c.currency}</td>
              <td className="py-3 px-4"><Badge color={c.status === 'sent' ? 'green' : c.status === 'active' ? 'brand' : c.status === 'scheduled' ? 'blue' : 'gray'}>{STATUS_LABELS[c.status]}</Badge></td>
              <td className="py-3 px-4"><button onClick={() => deleteCampaign(c.id)} className="text-red-500 text-sm hover:underline"><Trash2 size={12} /></button></td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card className="mt-6 p-5">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Megaphone size={16} /> Automatisations</h3>
        <p className="text-sm text-gray-500 mb-4">Activez une règle prête à l'emploi — elle est créée dans votre page Automations (règle réellement enregistrée ; l'exécution automatique — envoi effectif — arrive avec le moteur d'automatisation, en cours de développement).</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AUTOMATION_TEMPLATES.map(t => {
            const already = automations.some(a => a.trigger === t.trigger && a.action === t.action);
            return (
              <div key={t.name} className="p-3 border border-gray-100 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{t.name}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={already}
                  onClick={() => activateTemplate(t)}
                >
                  {already ? 'Activée ✓' : 'Activer'}
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowEditor(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Éditeur de campagne</h3>
              <button onClick={() => setShowEditor(false)}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Nom de la campagne</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" placeholder="Ex. Soldes d'été" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Canal</label><select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value as CampaignChannel })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"><option value="email">Email</option><option value="sms">SMS</option><option value="social">Social</option></select></div>
                <div><label className="block text-sm font-medium mb-1">Audience</label><select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"><option>Tous</option><option>Nouveaux</option><option>Acheteurs récents</option><option>Inactifs 60j</option><option>VIP</option></select></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Objet</label><input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" placeholder="Ex. -20% sur tout le magasin" /></div>
              <div><label className="block text-sm font-medium mb-1">Contenu</label><textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" placeholder="Rédigez votre message..." /></div>
              <div><label className="block text-sm font-medium mb-1">CTA</label><input value={form.cta} onChange={e => setForm({ ...form, cta: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Programmation</label><select value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"><option value="now">Immédiate</option><option value="later">Différée</option></select></div>
                {form.schedule === 'later' && <div><label className="block text-sm font-medium mb-1">Date</label><input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" /></div>}
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                <span className="text-xs text-gray-500 flex-shrink-0">Code promo lié (optionnel)</span>
                {discountCodes.length > 0 ? (
                  <select value={form.discountCode} onChange={e => setForm({ ...form, discountCode: e.target.value })} className="px-2 py-1 border border-gray-200 rounded-md text-xs bg-white">
                    <option value="">Aucun</option>
                    {discountCodes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <Link to="/app/discounts" className="text-xs text-brand-600 hover:underline">Créer un code promo</Link>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={() => setPreview(!preview)} className="flex items-center gap-1"><Eye size={14} /> Aperçu</Button>
                <Button onClick={sendCampaign} className="flex-1 flex items-center justify-center gap-2"><Send size={14} /> {form.schedule === 'now' ? 'Enregistrer en brouillon' : 'Programmer'}</Button>
              </div>
              {preview && (
                <div className="p-4 bg-white border-2 border-gray-100 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Aperçu</div>
                  <div className="font-semibold text-gray-900">{form.subject || '(Objet)'}</div>
                  <p className="mt-2 text-sm text-gray-700">{form.content || '(Contenu)'}</p>
                  <div className="mt-3 inline-block px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold">{form.cta}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
