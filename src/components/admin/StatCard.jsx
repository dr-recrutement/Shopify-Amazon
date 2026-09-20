import { TrendingUp, TrendingDown, ShoppingBag, Eye, Wallet, Clock, Package } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, delta, positive = true, hint }) {
  return (
    <div className="bg-white rounded-lg border border-[#E1E1E1] p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#6D7175] font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1 text-[#202223]">{value}</p>
        </div>
        <div className="w-9 h-9 rounded-md bg-[#F4F4F4] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#202223]" />
        </div>
      </div>
      {(delta || hint) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {delta && (
            <span className={`flex items-center gap-0.5 font-semibold ${positive ? 'text-[#008060]' : 'text-red-600'}`}>
              {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {delta}
            </span>
          )}
          {hint && <span className="text-[#6D7175]">{hint}</span>}
        </div>
      )}
    </div>
  );
}

export { ShoppingBag, Eye, Wallet, Clock, Package };