import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Loader2, AlertCircle, Trash2, Inbox, Clock, Archive, Search,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrentStore } from '@/hooks/useCurrentStore';

// Real viewer for form_submissions (theme's new "Formulaire" section -
// contact/quote/booking forms for showcase sites, not just product
// checkout). data is arbitrary jsonb (whatever fields that form defined),
// rendered generically here since different forms on the same store can
// have completely different fields.
export default function FormSubmissions() {
  const { store, loading: storeLoading } = useCurrentStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('form_submissions').select('*').eq('tenant_id', store.id).order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      console.error('Failed to load form submissions:', e);
      setItems([]);
    } finally { setLoading(false); }
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  const previewOf = (m) => Object.values(m.data || {}).find((v) => typeof v === 'string' && v.length > 0) || '';

  const filtered = items.filter((m) => {
    if (filter === 'unread' && m.status !== 'new' && m.status) return false;
    if (filter === 'archived' && m.status !== 'archived') return false;
    if (search) {
      const hay = `${m.form_name} ${JSON.stringify(m.data || {})}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const setStatus = async (m, status) => {
    const { error } = await supabase.from('form_submissions').update({ status }).eq('id', m.id);
    if (error) { alert(error.message); return; }
    setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, status } : x)));
    if (selected?.id === m.id) setSelected((s) => ({ ...s, status }));
  };

  const open = (m) => {
    setSelected(m);
    if (!m.status || m.status === 'new') setStatus(m, 'read');
  };

  const remove = async (m) => {
    if (!confirm('Supprimer cette soumission ?')) return;
    const { error } = await supabase.from('form_submissions').delete().eq('id', m.id);
    if (error) { alert(error.message); return; }
    setItems((prev) => prev.filter((x) => x.id !== m.id));
    if (selected?.id === m.id) setSelected(null);
  };

  const unreadCount = items.filter((m) => !m.status || m.status === 'new').length;

  if (storeLoading || loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Configurez votre boutique</h1>
        <Link to="/onboarding" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-3">Configurer</Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <ClipboardList className="w-5 h-5 text-[#6D7175]" />
        <div>
          <h1 className="text-xl font-bold text-[#202223]">Formulaires</h1>
          <p className="text-xs text-[#6D7175]">Soumissions des formulaires de votre site (contact, devis, réservation…). {unreadCount > 0 && <span className="text-[#008060] font-semibold">{unreadCount} non lu(s)</span>}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        <div className="flex flex-col bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
          <div className="p-3 border-b border-[#E1E1E1] space-y-2">
            <div className="flex items-center gap-2 bg-[#F4F4F4] rounded-md px-3 py-1.5">
              <Search className="w-4 h-4 text-[#6D7175]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="bg-transparent outline-none text-sm flex-1" />
            </div>
            <div className="flex items-center gap-1">
              {[['all', 'Tous', Inbox], ['unread', 'Non lus', Clock], ['archived', 'Archivés', Archive]].map(([k, l, Ic]) => (
                <button key={k} onClick={() => setFilter(k)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ${filter === k ? 'bg-[#008060] text-white' : 'text-[#6D7175] hover:bg-black/5'}`}>
                  <Ic className="w-3.5 h-3.5" /> {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-[#6D7175] text-center py-12">Aucune soumission pour le moment. Ajoutez une section « Formulaire » dans l'éditeur de thème pour en recevoir.</p>
            ) : (
              filtered.map((m) => {
                const unread = !m.status || m.status === 'new';
                return (
                  <button key={m.id} onClick={() => open(m)} className={`w-full text-left p-3.5 border-b border-[#E1E1E1] hover:bg-[#F4F4F4] transition ${selected?.id === m.id ? 'bg-[#008060]/5' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm truncate ${unread ? 'font-bold text-[#202223]' : 'font-medium text-[#202223]'}`}>{m.form_name}</p>
                      <span className="text-[10px] text-[#6D7175] shrink-0">{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-[#6D7175] truncate mt-0.5">{previewOf(m)}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <ClipboardList className="w-10 h-10 text-[#C9C9C9] mx-auto mb-3" />
                <p className="text-sm text-[#6D7175]">Sélectionnez une soumission pour la voir.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-[#E1E1E1]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#202223]">{selected.form_name}</p>
                  <div className="flex items-center gap-1">
                    {selected.status !== 'archived' && <button onClick={() => setStatus(selected, 'archived')} title="Archiver" className="p-2 rounded-md text-[#6D7175] hover:bg-black/5"><Archive className="w-4 h-4" /></button>}
                    <button onClick={() => remove(selected)} title="Supprimer" className="p-2 rounded-md text-[#6D7175] hover:bg-red-50 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-[11px] text-[#6D7175] mt-1">{new Date(selected.created_at).toLocaleString('fr-FR')}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {Object.entries(selected.data || {}).map(([key, value]) => (
                  <div key={key} className="bg-[#F4F4F4] rounded-xl p-3.5">
                    <p className="text-xs font-semibold text-[#6D7175] mb-1 capitalize">{key}</p>
                    <p className="text-sm text-[#202223] whitespace-pre-wrap">{String(value) || '—'}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
