import { Target } from 'lucide-react';
import { formatCurrency } from '../utils/data';
import './Budgets.css';

export default function Budgets({ stats }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Target className="w-4 h-4 text-indigo-500" /> Category Spending Caps</h3>
          <p className="text-xs text-slate-400">Monthly spend limits &amp; remaining capacity</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.budgetItems.map((b) => {
          const over = b.spent > b.cap;
          return (
            <div key={b.category} className="budget-card p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{b.category}</span>
                <span className={`text-[11px] font-bold ${over ? 'text-rose-600' : 'text-slate-700'}`}>{`${formatCurrency(b.spent)} / ${formatCurrency(b.cap)}`}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${over ? 'bg-rose-500' : 'bg-slate-900'}`} style={{ width: `${Math.min((b.spent / b.cap) * 100, 100)}%` }}></div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>{`${Math.round((b.spent / b.cap) * 100)}% utilized`}</span>
                <span className={`font-bold ${over ? 'text-rose-600' : 'text-emerald-600'}`}>{over ? 'Over Limit' : 'Within Range'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
