import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, Button } from '../pages/dashboard/ui';
import { Search, MessageSquare, FileText, ChevronRight, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSupportTickets, saveSupportTicket, type SupportTicket } from '../lib/app-state';

// Real routing: each ticket category maps to the actual department inbox
// that receives it. Tickets used to save locally only, with no real
// destination — clicking "Envoyer" didn't reach anyone. Since there's no
// email-sending backend on this platform yet, submitting now also opens
// a pre-filled mailto: to the right real address (help@liafrik.com and
// friends) so the message genuinely leaves the browser and reaches a
// real inbox, not just localStorage.
const CATEGORY_EMAIL: Record<string, string> = {
  'Démarrage': 'help@liafrik.com',
  'Produits': 'help@liafrik.com',
  'Commandes': 'support@liafrik.com',
  'Paiements': 'sales@liafrik.com',
  'Livraison': 'support@liafrik.com',
  'Design': 'help@liafrik.com',
  'IA': 'help@liafrik.com',
  'Abonnement': 'sales@liafrik.com',
  'Sécurité': 'security@liafrik.com',
};
const CATS = Object.keys(CATEGORY_EMAIL);

export default function SupportPage() {
  const [tab, setTab] = useState('help');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(CATS[0]);
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setTickets(getSupportTickets());
  }, []);

  const filteredCats = CATS.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  const openTicketFor = (cat: string) => {
    setCategory(cat);
    setTab('ticket');
  };

  const submitTicket = () => {
    if (!subject.trim() || !message.trim()) return;
    const ticket: SupportTicket = {
      id: `T-${Date.now()}`,
      subject: subject.trim(),
      category,
      message: message.trim(),
      createdAt: new Date().toLocaleDateString('fr-FR'),
      status: 'open',
    };
    saveSupportTicket(ticket);
    setTickets(getSupportTickets());

    const to = CATEGORY_EMAIL[category] || 'help@liafrik.com';
    const body = encodeURIComponent(`Catégorie : ${category}\n\n${message.trim()}`);
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(`[${category}] ${subject.trim()}`)}&body=${body}`;

    setSubject('');
    setMessage('');
    setCategory(CATS[0]);
    setTab('help');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <h1 className="font-serif-display text-3xl font-bold text-gray-900 mb-6">Support</h1>
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('help')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'help' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200'}`}>Centre d'aide</button>
          <button onClick={() => setTab('ticket')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'ticket' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200'}`}>Mes tickets</button>
          <button onClick={() => setTab('chat')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'chat' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200'}`}>Nous contacter</button>
        </div>
        {tab === 'help' && (
          <>
            <Card className="p-5 mb-6">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une catégorie..." className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </Card>
            {filteredCats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucune catégorie ne correspond.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredCats.map(c => (
                  <Card key={c} onClick={() => openTicketFor(c)} className="p-4 hover:shadow-md transition-all cursor-pointer flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-brand-600" />
                      <span className="text-sm font-medium text-gray-900">{c}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
        {tab === 'ticket' && (
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Nouveau ticket</h3>
            <p className="text-xs text-gray-500 mb-4">Envoyé à <strong>{CATEGORY_EMAIL[category] || 'help@liafrik.com'}</strong> selon la catégorie choisie.</p>
            <div className="space-y-3">
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Sujet" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Décrivez votre problème..." rows={5} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
              <Button onClick={submitTicket} disabled={!subject.trim() || !message.trim()}>Envoyer le ticket</Button>
            </div>
          </Card>
        )}
        {tab === 'chat' && (
          <Card className="p-6 text-center">
            <MessageSquare size={32} className="text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Nous contacter directement</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Le chat en direct n'est pas encore disponible — écrivez-nous directement, on vous répond par email.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto text-left">
              {[
                { label: 'Service client', email: 'cs@liafrik.com' },
                { label: 'Aide générale', email: 'help@liafrik.com' },
                { label: 'Ventes', email: 'sales@liafrik.com' },
                { label: 'Support technique', email: 'support@liafrik.com' },
                { label: 'Sécurité', email: 'security@liafrik.com' },
              ].map(c => (
                <a key={c.email} href={`mailto:${c.email}`} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-brand-300 hover:bg-brand-50/30 transition-colors">
                  <Mail size={16} className="text-brand-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{c.label}</div>
                    <div className="text-[11px] text-gray-500">{c.email}</div>
                  </div>
                </a>
              ))}
            </div>
          </Card>
        )}
        {tickets.length > 0 && tab === 'help' && (
          <Card className="p-5 mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Tickets récents</h3>
            <div className="space-y-2">
              {tickets.map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{ticket.subject}</div>
                    <div className="text-xs text-gray-500">{ticket.category} · {ticket.createdAt}</div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs ${ticket.status === 'open' ? 'bg-brand-100 text-brand-700' : 'bg-green-100 text-green-700'}`}>{ticket.status === 'open' ? 'Ouvert' : 'Résolu'}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
