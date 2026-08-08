import { PageHeader, Card, Button, Badge } from './ui';
import { Send, Paperclip } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getChatThreads, saveChatThreads, type ChatThread } from '../../lib/app-state';

export default function Chat() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [reply, setReply] = useState('');

  useEffect(() => {
    const t = getChatThreads();
    setThreads(t);
    if (t.length > 0) setActiveId(t[0].id);
  }, []);

  const activeThread = threads.find(t => t.id === activeId);

  const markRead = (id: string) => {
    const updated = threads.map(t => t.id === id ? { ...t, unread: 0, messages: t.messages.map(m => ({ ...m, read: true })) } : t);
    setThreads(updated); saveChatThreads(updated);
  };

  const selectThread = (id: string) => { setActiveId(id); markRead(id); };

  const sendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !activeThread) return;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const msg = { id: `m-${Date.now()}`, customerName: activeThread.customerName, customerEmail: activeThread.customerEmail, message: reply, fromMerchant: true, read: true, createdAt: now };
    const updated = threads.map(t => t.id === activeThread.id ? { ...t, messages: [...t.messages, msg], lastMessage: reply, lastAt: now } : t);
    setThreads(updated); saveChatThreads(updated);
    setReply('');
  };

  return (
    <div>
      <PageHeader title="Chat" subtitle="Boîte de réception unifiée — WhatsApp, Messenger, chat interne." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        <Card className="overflow-y-auto">
          {threads.map(t => (
            <button key={t.id} onClick={() => selectThread(t.id)} className={`w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 ${activeId === t.id ? 'bg-brand-50' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-700">{t.customerName.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate">{t.customerName}</span>
                    <span className="text-xs text-gray-400">{t.lastAt.split(' ')[1] || t.lastAt}</span>
                  </div>
                  <span className="text-xs text-gray-500 truncate block">{t.lastMessage}</span>
                </div>
                {t.unread > 0 && <span className="w-5 h-5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center">{t.unread}</span>}
              </div>
            </button>
          ))}
        </Card>
        <Card className="lg:col-span-2 flex flex-col">
          {activeThread ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-700">{activeThread.customerName.charAt(0)}</div>
                  <div>
                    <div className="font-medium text-gray-900">{activeThread.customerName}</div>
                    <div className="text-xs text-gray-500">{activeThread.customerEmail}</div>
                  </div>
                </div>
                <Badge color="green">Connecté</Badge>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {activeThread.messages.map(m => (
                  <div key={m.id} className={`flex ${m.fromMerchant ? 'justify-end' : ''}`}>
                    <div className={`rounded-2xl px-3 py-2 text-sm max-w-xs ${m.fromMerchant ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-gray-100 rounded-tl-sm'}`}>{m.message}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendReply} className="p-3 border-t border-gray-100 flex items-center gap-2">
                <button type="button" className="p-2 text-gray-400 hover:text-gray-600"><Paperclip size={18} /></button>
                <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Répondre..." className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <Button size="sm" type="submit"><Send size={14} /></Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Sélectionnez une conversation</div>
          )}
        </Card>
      </div>
    </div>
  );
}
