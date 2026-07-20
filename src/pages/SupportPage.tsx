import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, Button } from '../pages/dashboard/ui';
import { Search, MessageSquare, Mail, FileText, ChevronRight, Send, Paperclip } from 'lucide-react';
import { useState } from 'react';

export default function SupportPage() {
  const [tab, setTab] = useState('help');
  const cats = ['Démarrage', 'Produits', 'Commandes', 'Paiements', 'Livraison', 'Design', 'IA', 'Abonnement', 'Sécurité'];
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <h1 className="text-3xl font-semibold text-gray-900 mb-6 tracking-tight">Support</h1>
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('help')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'help' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200'}`}>Centre d'aide</button>
          <button onClick={() => setTab('ticket')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'ticket' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200'}`}>Mes tickets</button>
          <button onClick={() => setTab('chat')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'chat' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200'}`}>Chat en direct</button>
        </div>
        {tab === 'help' && (
          <>
            <Card className="p-5 mb-6">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input placeholder="Recherchez dans le centre d'aide..." className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </Card>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {cats.map(c => (
                <Card key={c} className="p-4 hover:shadow-md transition-all cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-orange-600" />
                    <span className="text-sm font-medium text-gray-900">{c}</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </Card>
              ))}
            </div>
          </>
        )}
        {tab === 'ticket' && (
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Nouveau ticket</h3>
            <div className="space-y-3">
              <input placeholder="Sujet" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
              <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                <option>Catégorie...</option>
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
              <textarea placeholder="Décrivez votre problème..." rows={5} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
              <button className="text-sm text-gray-500 flex items-center gap-1"><Paperclip size={14} /> Joindre un fichier</button>
              <Button>Envoyer le ticket</Button>
            </div>
          </Card>
        )}
        {tab === 'chat' && (
          <Card className="p-6 text-center">
            <MessageSquare size={32} className="text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Chat en direct</h3>
            <p className="text-sm text-gray-500 mt-1">Disponible selon votre plan. Starter: email · Premium: email prioritaire · Entreprise: dédié + WhatsApp.</p>
            <Button className="mt-4">Démarrer une conversation</Button>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
