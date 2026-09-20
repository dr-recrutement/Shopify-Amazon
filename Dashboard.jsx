import { Tag, Plus } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { ShoppingBag, Eye, Wallet, Clock, Package } from '@/components/admin/StatCard';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from 'recharts';

const SALES_DATA = [
  { jour: 'Lun', ventes: 320, visites: 540 },
  { jour: 'Mar', ventes: 410, visites: 610 },
  { jour: 'Mer', ventes: 380, visites: 580 },
  { jour: 'Jeu', ventes: 520, visites: 720 },
  { jour: 'Ven', ventes: 690, visites: 980 },
  { jour: 'Sam', ventes: 820, visites: 1120 },
  { jour: 'Dim', ventes: 540, visites: 760 },
];

const RECENT_ORDERS = [
  { id: '#1042', client: 'Aïcha Diallo', total: '45 000 FCFA', statut: 'Payée', couleur: 'green' },
  { id: '#1041', client: 'Kwame Mensah', total: '120 000 FCFA', statut: 'En attente', couleur: 'amber' },
  { id: '#1040', client: 'Fatou Bensouda', total: '28 500 FCFA', statut: 'Payée', couleur: 'green' },
  { id: '#1039', client: 'Moussa Diarra', total: '76 000 FCFA', statut: 'Expédiée', couleur: 'blue' },
  { id: '#1038', client: 'Awa Traoré', total: '19 900 FCFA', statut: 'En attente', couleur: 'amber' },
];

const PENDING = [
  { ref: '#1041', client: 'Kwame Mensah', montant: '120 000 FCFA', depuis: '2 h' },
  { ref: '#1038', client: 'Awa Traoré', montant: '19 900 FCFA', depuis: '5 h' },
  { ref: '#1035', client: 'Ibrahim Sow', montant: '54 000 FCFA', depuis: '1 j' },
];

const statutColor = {
  green: 'bg-[#008060]/10 text-[#008060]',
  amber: 'bg-amber-500/10 text-amber-600',
  blue: 'bg-blue-500/10 text-blue-600',
};

export default function Dashboard() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Tag className="w-5 h-5 text-[#6D7175]" />
        <h1 className="text-xl font-bold text-[#202223]">Tableau de bord</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Wallet} label="Revenu (30 j)" value="4,2 M FCFA" delta="+12,4 %" positive hint="vs mois dernier" />
        <StatCard icon={ShoppingBag} label="Commandes" value="318" delta="+8,1 %" positive hint="vs mois dernier" />
        <StatCard icon={Eye} label="Visiteurs" value="9 240" delta="+23 %" positive hint="vs mois dernier" />
        <StatCard icon={Clock} label="En attente" value="3" hint="à traiter" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-[#E1E1E1] p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-[#202223] mb-1">Ventes récentes</h2>
          <p className="text-xs text-[#6D7175] mb-4">7 derniers jours</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={SALES_DATA} margin={{ left: -20, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="gVentes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#008060" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#008060" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" vertical={false} />
              <XAxis dataKey="jour" tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E1E1E1' }} />
              <Area type="monotone" dataKey="ventes" stroke="#008060" strokeWidth={2.5} fill="url(#gVentes)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-[#E1E1E1] p-5">
          <h2 className="text-sm font-semibold text-[#202223] mb-1">Trafic boutique</h2>
          <p className="text-xs text-[#6D7175] mb-4">Visites par jour</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SALES_DATA} margin={{ left: -20, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" vertical={false} />
              <XAxis dataKey="jour" tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E1E1E1' }} />
              <Bar dataKey="visites" fill="#202223" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent orders */}
        <div className="bg-white rounded-lg border border-[#E1E1E1] p-5">
          <h2 className="text-sm font-semibold text-[#202223] mb-4">Commandes récentes</h2>
          <div className="space-y-2">
            {RECENT_ORDERS.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-[#F4F4F4] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#6D7175]">{o.id}</span>
                  <span className="text-sm text-[#202223]">{o.client}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#202223]">{o.total}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statutColor[o.couleur]}`}>{o.statut}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending orders */}
        <div className="bg-white rounded-lg border border-[#E1E1E1] p-5">
          <h2 className="text-sm font-semibold text-[#202223] mb-4">Commandes en attente</h2>
          <div className="space-y-2">
            {PENDING.map((p) => (
              <div key={p.ref} className="flex items-center justify-between py-2 border-b border-[#F4F4F4] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-[#202223] font-medium">{p.ref}</p>
                    <p className="text-xs text-[#6D7175]">{p.client}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#202223]">{p.montant}</p>
                  <p className="text-xs text-[#6D7175]">il y a {p.depuis}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick add card (Shopify-style) */}
      <div className="mt-6 bg-white rounded-lg border border-[#E1E1E1] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#202223]">Ajoutez vos produits</h2>
          <p className="text-sm text-[#6D7175] mt-1 max-w-md">Commencez par remplir votre boutique. Ajoutez vos premiers articles manuellement ou importez un fichier.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-[#202223] text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-1.5 hover:bg-black">
            <Plus className="w-4 h-4" /> Ajouter un produit
          </button>
          <button className="bg-white border border-[#898F94] text-[#202223] text-sm font-medium px-4 py-2 rounded-md">Importer</button>
        </div>
      </div>
    </div>
  );
}