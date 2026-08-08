import { PageHeader, Card, Button, Badge } from './ui';
import { MessageSquare, Send, Paperclip, MessageCircle, Facebook, Send as TelegramIcon } from 'lucide-react';
import { useState } from 'react';

export default function Chat() {
  const [active, setActive] = useState('aicha');
  const convs = [
    { id: 'aicha', name: 'Aïcha Diallo', channel: 'WhatsApp', preview: 'Bonjour, la robe est disponible ?', time: '14:32', unread: 2 },
    { id: 'kwame', name: 'Kwame Mensah', channel: 'Messenger', preview: 'Merci pour la livraison !', time: '13:10', unread: 0 },
    { id: 'fatou', name: 'Fatou Ndiaye', channel: 'Telegram', preview: 'Question sur le stock', time: '11:45', unread: 1 },
  ];
  const channelIcons: any = { WhatsApp: MessageCircle, Messenger: Facebook, Telegram: TelegramIcon };
  return (
    <div>
      <PageHeader title="Chat" subtitle="Boîte de réception unifiée — WhatsApp, Messenger, Telegram, chat interne." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        <Card className="overflow-y-auto scrollbar-thin">
          {convs.map(c => {
            const Icon = channelIcons[c.channel];
            return (
              <button key={c.id} onClick={() => setActive(c.id)} className={`w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 ${active === c.id ? 'bg-brand-50' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-700">{c.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 truncate">{c.name}</span>
                      <span className="text-xs text-gray-400">{c.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500 truncate">{c.preview}</span>
                    </div>
                  </div>
                  {c.unread > 0 && <span className="w-5 h-5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center">{c.unread}</span>}
                </div>
              </button>
            );
          })}
        </Card>
        <Card className="lg:col-span-2 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-700">A</div>
              <div>
                <div className="font-medium text-gray-900">Aïcha Diallo</div>
                <div className="text-xs text-gray-500 flex items-center gap-1"><MessageCircle size={10} /> WhatsApp</div>
              </div>
            </div>
            <Badge color="green">En ligne</Badge>
          </div>
          <div className="flex-1 p-4 overflow-y-auto scrollbar-thin space-y-3">
            <div className="flex"><div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 text-sm max-w-xs">Bonjour, la robe wax est disponible ?</div></div>
            <div className="flex justify-end"><div className="bg-brand-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 text-sm max-w-xs">Bonjour ! Oui, disponible en S, M, L.</div></div>
            <div className="flex"><div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 text-sm max-w-xs">Parfait, je commande taille M.</div></div>
          </div>
          <div className="p-3 border-t border-gray-100 flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600"><Paperclip size={18} /></button>
            <input placeholder="Répondre..." className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <Button size="sm"><Send size={14} /></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
