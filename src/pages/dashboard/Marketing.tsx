import { PageHeader, Card, Button, Badge, Table } from './ui';
import { Megaphone, Plus, Mail, MessageSquare, Calendar, Sparkles, Send, X, Eye } from 'lucide-react';
import { useState } from 'react';

interface Campaign {
  name: string; channel: string; audience: string; sent: number; opens: string; status: string;
}

export default function Marketing() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { name: 'Soldes d\'été', channel: 'Email', audience: 'Tous', sent: 1240, opens: '38%', status: 'sent' },
    { name: 'Panier abandonné', channel: 'WhatsApp', audience: 'Auto', sent: 45, opens: '62%', status: 'active' },
    { name: 'Bienvenue nouveau client', channel: 'Email', audience: 'Nouveaux', sent: 0, opens: '-', status: 'draft' },
  ]);
  const [showEditor, setShowEditor] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({ name: '', channel: 'Email', audience: 'Tous', subject: '', content: '', cta: 'Acheter maintenant', schedule: 'now', date: '' });

  const sendCampaign = () => {
    setCampaigns([{ name: form.name || 'Nouvelle campagne', channel: form.channel, audience: form.audience, sent: 0, opens: '-', status: form.schedule === 'now' ? 'sent' : 'scheduled' }, ...campaigns]);
    setShowEditor(false);
    setForm({ name: '', channel: 'Email', audience: 'Tous', subject: '', content: '', cta: 'Acheter maintenant', schedule: 'now', date: '' });
  };

  return (
    <div>
      <PageHeader title="Marketing" subtitle="Campagnes, automatisations et performance." action={<Button onClick={() => setShowEditor(true)}><Plus size={16} /> Créer une campagne</Button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><Mail size={18} className="text-orange-600 mb-2" /><p className="text-xs text-gray-500">Campagnes email</p><p className="text-xl font-semibold">{campaigns.filter(c => c.channel === 'Email').length}</p></Card>
        <Card className="p-4"><MessageSquare size={18} className="text-green-600 mb-2" /><p className="text-xs text-gray-500">Campagnes WhatsApp</p><p className="text-xl font-semibold">{campaigns.filter(c => c.channel === 'WhatsApp').length}</p></Card>
        <Card className="p-4"><Calendar size={18} className="text-blue-600 mb-2" /><p className="text-xs text-gray-500">Programmées</p><p className="text-xl font-semibold">{campaigns.filter(c => c.status === 'scheduled').length}</p></Card>
        <Card className="p-4"><Sparkles size={18} className="text-purple-600 mb-2" /><p className="text-xs text-gray-500">Taux d'ouverture moyen</p><p className="text-xl font-semibold">50%</p></Card>
      </div>

      <Card className="mb-6 p-4 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
        <div className="flex items-center gap-3">
          <Sparkles className="text-orange-600" size={20} />
          <p className="text-sm text-gray-700">L'assistant marketing IA peut générer vos textes, segments et calendrier.</p>
        </div>
        <Button variant="secondary" size="sm">Lancer l'assistant IA</Button>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Campagnes</h3></div>
        <Table headers={['Nom', 'Canal', 'Audience', 'Envoyés', 'Ouverture', 'Statut', '']}>
          {campaigns.map(c => (
            <tr key={c.name} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900">{c.name}</td>
              <td className="py-3 px-4 text-gray-500">{c.channel}</td>
              <td className="py-3 px-4 text-gray-500">{c.audience}</td>
              <td className="py-3 px-4 text-gray-700">{c.sent}</td>
              <td className="py-3 px-4 text-gray-700">{c.opens}</td>
              <td className="py-3 px-4"><Badge color={c.status === 'sent' ? 'green' : c.status === 'active' ? 'orange' : c.status === 'scheduled' ? 'blue' : 'gray'}>{c.status === 'sent' ? 'Envoyée' : c.status === 'active' ? 'Active' : c.status === 'scheduled' ? 'Programmée' : 'Brouillon'}</Badge></td>
              <td className="py-3 px-4"><button className="text-orange-600 text-sm font-medium hover:underline">Voir</button></td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card className="mt-6 p-5">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Megaphone size={16} /> Automatisations</h3>
        <p className="text-sm text-gray-500 mb-4">Disponible avec le plan Premium : panier abandonné, bienvenue, relance post-achat, anniversaire.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['Panier abandonné', 'Bienvenue nouveau client', 'Relance post-achat', 'Anniversaire client'].map(a => (
            <div key={a} className="p-3 border border-gray-100 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{a}</span>
              <Button variant="secondary" size="sm">Activer</Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Campaign editor modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowEditor(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Éditeur de campagne</h3>
              <button onClick={() => setShowEditor(false)}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Nom de la campagne</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Ex. Soldes d'été" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Canal</label><select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option>Email</option><option>WhatsApp</option><option>SMS</option></select></div>
                <div><label className="block text-sm font-medium mb-1">Audience</label><select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option>Tous</option><option>Nouveaux</option><option>Acheteurs récents</option><option>Inactifs 60j</option><option>VIP</option></select></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Objet</label><input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Ex. -20% sur tout le magasin" /></div>
              <div><label className="block text-sm font-medium mb-1">Contenu</label><textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Rédigez votre message..." /></div>
              <div><label className="block text-sm font-medium mb-1">CTA</label><input value={form.cta} onChange={e => setForm({ ...form, cta: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Programmation</label><select value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="now">Immédiate</option><option value="later">Différée</option></select></div>
                {form.schedule === 'later' && <div><label className="block text-sm font-medium mb-1">Date</label><input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>}
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">Code promo lié (optionnel)</span>
                <Button variant="secondary" size="sm">Associer</Button>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={() => setPreview(!preview)} className="flex items-center gap-1"><Eye size={14} /> Aperçu</Button>
                <Button onClick={sendCampaign} className="flex-1 flex items-center justify-center gap-2"><Send size={14} /> {form.schedule === 'now' ? 'Envoyer maintenant' : 'Programmer'}</Button>
              </div>
              {preview && (
                <div className="p-4 bg-white border-2 border-gray-100 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Aperçu</div>
                  <div className="font-semibold text-gray-900">{form.subject || '(Objet)'}</div>
                  <p className="mt-2 text-sm text-gray-700">{form.content || '(Contenu)'}</p>
                  <div className="mt-3 inline-block px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold">{form.cta}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
