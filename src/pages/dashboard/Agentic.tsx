import { useState, FormEvent, useRef, useEffect } from 'react';
import { useTenant } from '../../lib/hooks';
import { supabase } from '../../lib/supabase';
import { Card, PageHeader, Button } from './ui';
import { Bot, Send, Sparkles } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }

const tips = [
  'Quels sont mes produits les plus vendus?',
  'Analyse les tendances de mes commandes',
  'Aide-moi à créer une stratégie de remise',
  'Comment optimiser mon inventaire?',
];

function getResponse(input: string): string {
  const q = input.toLowerCase();
  if (q.includes('vente') || q.includes('revenu') || q.includes('chiffre')) return 'D\'après vos données, la tendance des revenus est positive. Envisagez une promotion pour stimuler les ventes pendant les périodes creuses.';
  if (q.includes('produit')) return 'Vos meilleurs produits sont visibles dans l\'onglet Produits. Je recommande de concentrer vos efforts marketing sur les plus performants.';
  if (q.includes('remise') || q.includes('promo') || q.includes('réduction')) return 'Créer un code promo à durée limitée peut créer un sentiment d\'urgence. Essayez -10% pour les nouveaux clients.';
  if (q.includes('client')) return 'Engager vos clients avec des emails personnalisés augmente la rétention. Envisagez de segmenter votre audience.';
  if (q.includes('commande')) return 'La gestion des commandes est essentielle. Traitez rapidement les commandes en attente pour garder vos clients satisfaits.';
  return 'Je suis là pour vous aider à développer votre boutique! Posez-moi des questions sur vos ventes, produits, clients, remises et stratégies marketing.';
}

export default function Agentic() {
  const { tenant } = useTenant();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Bonjour! Je suis votre assistant IA. Posez-moi des questions sur votre boutique, vos performances ou vos stratégies de croissance.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    if (tenant) {
      await supabase.from('ai_generations').insert({ tenant_id: tenant.id, type: 'agentic', prompt: input, status: 'completed' }).then(() => {});
    }

    setTimeout(() => {
      setMessages(m => [...m, { role: 'assistant', content: getResponse(input) }]);
      setLoading(false);
    }, 600);
  };

  return (
    <div>
      <PageHeader title="Agentic" subtitle="Votre assistant IA pour le commerce" />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0"><Bot size={16} /></div>}
                  <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${m.role === 'user' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-700'}`}>{m.content}</div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><Bot size={16} /></div>
                  <div className="px-3 py-2 rounded-lg bg-gray-100 text-gray-400 text-sm">Réflexion…</div>
                </div>
              )}
              <div ref={endRef} />
            </div>
            <form onSubmit={send} className="p-3 border-t border-gray-100 flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Posez votre question…"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" />
              <Button type="submit" disabled={!input.trim()}><Send size={16} /></Button>
            </form>
          </Card>
        </div>
        <div>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4"><Sparkles size={18} className="text-brand-500" /><h2 className="font-semibold text-gray-900">Suggestions</h2></div>
            <div className="space-y-3">
              {tips.map((t, i) => (
                <button key={i} onClick={() => setInput(t)} className="block w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-brand-50 border border-gray-100 hover:border-brand-200 transition-colors text-sm text-gray-600 hover:text-brand-700">{t}</button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
