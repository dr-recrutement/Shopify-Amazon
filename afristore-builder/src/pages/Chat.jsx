import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Loader2, AlertCircle, Mail, Send, Trash2,
  Inbox, CheckCheck, Clock, Archive, Search,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentStore } from '@/hooks/useCurrentStore';

export default function Chat() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      setMessages(await base44.entities.Message.filter({ store_id: store.id }, '-created_date', 200));
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = messages.filter((m) => {
    if (filter === 'unread' && m.status !== 'unread') return false;
    if (filter === 'archived' && m.status !== 'archived') return false;
    if (search && !m.customer_name?.toLowerCase().includes(search.toLowerCase()) && !m.subject?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openMessage = async (m) => {
    setSelected(m);
    if (m.status === 'unread') {
      await base44.entities.Message.update(m.id, { status: 'read' });
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: 'read' } : x)));
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: selected.customer_email,
        subject: `Re: ${selected.subject || 'Votre message'}`,
        html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;padding:24px"><h2 style="color:#008060">Bonjour ${selected.customer_name},</h2><div style="color:#202223;font-size:14px;line-height:1.6">${reply.replace(/\n/g, '<br>')}</div><p style="color:#6D7175;font-size:12px;margin-top:24px">— L'\u00e9quipe ${store?.name || ''}</p></div>`,
      });
      const updated = await base44.entities.Message.update(selected.id, {
        reply,
        status: 'replied',
        replied_at: new Date().toISOString(),
      });
      setMessages((prev) => prev.map((x) => (x.id === selected.id ? updated : x)));
      setSelected(updated);
      setReply('');
    } catch (e) {
      alert('Erreur : ' + (e.message));
    } finally { setSending(false); }
  };

  const archive = async (m) => {
    await base44.entities.Message.update(m.id, { status: 'archived' });
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: 'archived' } : x)));
    if (selected?.id === m.id) setSelected(null);
  };

  const remove = async (m) => {
    if (!confirm('Supprimer ce message ?')) return;
    await base44.entities.Message.delete(m.id);
    setMessages((prev) => prev.filter((x) => x.id !== m.id));
    if (selected?.id === m.id) setSelected(null);
  };

  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  if (storeLoading || loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Configurez votre boutique</h1>
        <Link to="/store-setup" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-3">Configurer</Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-[#6D7175]" />
        <div>
          <h1 className="text-xl font-bold text-[#202223]">Chat</h1>
          <p className="text-xs text-[#6D7175]">Messages de vos clients. {unreadCount > 0 && <span className="text-[#008060] font-semibold">{unreadCount} non lu(s)</span>}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Message list */}
        <div className="flex flex-col bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
          <div className="p-3 border-b border-[#E1E1E1] space-y-2">
            <div className="flex items-center gap-2 bg-[#F4F4F4] rounded-md px-3 py-1.5">
              <Search className="w-4 h-4 text-[#6D7175]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher\u2026" className="bg-transparent outline-none text-sm flex-1" />
            </div>
            <div className="flex items-center gap-1">
              {[['all', 'Tous', Inbox], ['unread', 'Non lus', Clock], ['archived', 'Archiv\u00e9s', Archive]].map(([k, l, Ic]) => (
                <button key={k} onClick={() => setFilter(k)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ${filter === k ? 'bg-[#008060] text-white' : 'text-[#6D7175] hover:bg-black/5'}`}>
                  <Ic className="w-3.5 h-3.5" /> {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-[#6D7175] text-center py-12">Aucun message.</p>
            ) : (
              filtered.map((m) => (
                <button key={m.id} onClick={() => openMessage(m)} className={`w-full text-left p-3.5 border-b border-[#E1E1E1] hover:bg-[#F4F4F4] transition ${selected?.id === m.id ? 'bg-[#008060]/5' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${m.status === 'unread' ? 'bg-[#008060] text-white' : 'bg-[#F4F4F4] text-[#6D7175]'}`}>
                      {m.customer_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${m.status === 'unread' ? 'font-bold text-[#202223]' : 'font-medium text-[#202223]'}`}>{m.customer_name}</p>
                        <span className="text-[10px] text-[#6D7175] shrink-0">{new Date(m.created_date).toLocaleDateString()}</span>
                      </div>
                      {m.subject && <p className="text-xs font-medium text-[#6D7175] truncate">{m.subject}</p>}
                      <p className="text-xs text-[#6D7175] truncate mt-0.5">{m.body}</p>
                      {m.status === 'replied' && <span className="inline-flex items-center gap-1 text-[10px] text-[#008060] font-semibold mt-1"><CheckCheck className="w-3 h-3" /> R\u00e9pondu</span>}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail / Reply */}
        <div className="flex flex-col bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <Mail className="w-10 h-10 text-[#C9C9C9] mx-auto mb-3" />
                <p className="text-sm text-[#6D7175]">S\u00e9lectionnez un message pour le lire et r\u00e9pondre.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-[#E1E1E1]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#202223]">{selected.customer_name}</p>
                    <p className="text-xs text-[#6D7175]">{selected.customer_email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => archive(selected)} title="Archiver" className="p-2 rounded-md text-[#6D7175] hover:bg-black/5"><Archive className="w-4 h-4" /></button>
                    <button onClick={() => remove(selected)} title="Supprimer" className="p-2 rounded-md text-[#6D7175] hover:bg-red-50 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {selected.subject && <p className="text-sm font-semibold text-[#202223] mt-2">{selected.subject}</p>}
                <p className="text-[11px] text-[#6D7175] mt-1">{new Date(selected.created_date).toLocaleString()}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-[#F4F4F4] rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-[#6D7175] mb-1">Message du client</p>
                  <p className="text-sm text-[#202223] whitespace-pre-wrap">{selected.body}</p>
                </div>
                {selected.reply && (
                  <div className="bg-[#008060]/5 border border-[#008060]/20 rounded-xl p-3.5">
                    <p className="text-xs font-semibold text-[#008060] mb-1">Votre r\u00e9ponse</p>
                    <p className="text-sm text-[#202223] whitespace-pre-wrap">{selected.reply}</p>
                    {selected.replied_at && <p className="text-[10px] text-[#6D7175] mt-1.5">{new Date(selected.replied_at).toLocaleString()}</p>}
                  </div>
                )}
              </div>
              {selected.status !== 'archived' && (
                <div className="p-3 border-t border-[#E1E1E1]">
                  <div className="flex gap-2">
                    <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Votre r\u00e9ponse\u2026" className="flex-1 px-3 py-2 border border-[#E1E1E1] rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#008060]/30" />
                    <button onClick={sendReply} disabled={sending || !reply.trim()} className="self-end flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-[#00694d] disabled:opacity-40">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}