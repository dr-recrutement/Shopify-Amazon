import { BarChart3, TrendingUp, Percent, ShoppingBag } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import { Wallet, Eye } from '@/components/admin/StatCard';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

const REVENUE = [
  { mois: 'Avr', revenu: 2800, visites: 5200 },
  { mois: 'Mai', revenu: 3400, visites: 6100 },
  { mois: 'Jun', revenu: 3100, visites: 5800 },
  { mois: 'Jul', revenu: 4200, visites: 7400 },
  { mois: 'Aoû', revenu: 4900, visites: 8200 },
  { mois: 'Sep', revenu: 4200, visites: 9240 },
];

const FUNNEL = [
  { etape: 'Visites', valeur: 9240 },
  { etape: 'Vues produit', valeur: 4100 },
  { etape: 'Ajouts panier', valeur: 1380 },
  { etape: 'Commandes', valeur: 318 },
];

const SOURCES = [
  { name: 'Recherche', value: 38, color: '#008060' },
  { name: 'Direct', value: 27, color: '#202223' },
  { name: 'Réseaux sociaux', value: 22, color: '#8B6F3F' },
  { name: 'Référents', value: 13, color: '#C4A86A' },
];

const BEST_SELLERS = [
  { nom: 'Robe Wax Traditionnelle', ventes: 142, revenu: '2 130 000 FCFA', pct: 100 },
  { nom: 'Sac en Cuir Artisanal', ventes: 98, revenu: '2 450 000 FCFA', pct: 69 },
  { nom: 'Ensemble Wax Royal', ventes: 76, revenu: '2 660 000 FCFA', pct: 54 },
  { nom: 'Boucles d’oreilles Dorées', ventes: 64, revenu: '512 000 FCFA', pct: 45 },
  { nom: 'Collier Perles Multicolore', ventes: 51, revenu: '612 000 FCFA', pct: 36 },
];

export default function Analytics() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-[#6D7175]" />
        <h1 className="text-xl font-bold text-[#202223]">Analytiques boutique</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Wallet} label="Revenu total" value="22,6 M FCFA" delta="+18 %" positive hint="6 mois" />
        <StatCard icon={ShoppingBag} label="Commandes" value="1 902" delta="+9 %" positive hint="6 mois" />
        <StatCard icon={Percent} label="Taux de conversion" value="3,44 %" delta="+0,4 pt" positive hint="vs préc." />
        <StatCard icon={Eye} label="Visites" value="41 940" delta="+12 %" positive hint="6 mois" />
      </div>

      {/* Revenue + sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-[#E1E1E1] p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-[#202223] mb-1">Revenu sur 6 mois</h2>
          <p className="text-xs text-[#6D7175] mb-4">Tendance mensuelle</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={REVENUE} margin={{ left: -10, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#008060" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#008060" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E1E1E1' }} formatter={(v) => [`${v} k FCFA`, 'Revenu']} />
              <Area type="monotone" dataKey="revenu" stroke="#008060" strokeWidth={2.5} fill="url(#gRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-[#E1E1E1] p-5">
          <h2 className="text-sm font-semibold text-[#202223] mb-1">Sources de trafic</h2>
          <p className="text-xs text-[#6D7175] mb-4">Répartition</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={SOURCES} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                {SOURCES.map((s) => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E1E1E1' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {SOURCES.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-[#6D7175]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-semibold text-[#202223]">{s.value} %</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-lg border border-[#E1E1E1] p-5 mb-6">
        <h2 className="text-sm font-semibold text-[#202223] mb-1">Tunnel de conversion</h2>
        <p className="text-xs text-[#6D7175] mb-4">Du visiteur à la commande</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={FUNNEL} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="etape" tick={{ fontSize: 12, fill: '#6D7175' }} axisLine={false} tickLine={false} width={110} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E1E1E1' }} />
            <Bar dataKey="valeur" fill="#008060" radius={[0, 4, 4, 0]} barSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Best sellers */}
      <div className="bg-white rounded-lg border border-[#E1E1E1] p-5">
        <h2 className="text-sm font-semibold text-[#202223] mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#008060]" /> Meilleures ventes
        </h2>
        <div className="space-y-3">
          {BEST_SELLERS.map((p, i) => (
            <div key={p.nom} className="flex items-center gap-4">
              <span className="text-xs font-bold text-[#6D7175] w-5">{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[#202223]">{p.nom}</span>
                  <span className="text-xs text-[#6D7175]">{p.ventes} ventes · {p.revenu}</span>
                </div>
                <div className="h-2 rounded-full bg-[#F4F4F4] overflow-hidden">
                  <div className="h-full rounded-full bg-[#008060]" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}