import { Link } from 'react-router-dom';
import { Wallet, Pencil } from 'lucide-react';
import { formatCurrency, daysInMonth } from '../utils/data';

export default function IncomeOverview({ income, total }) {
  const dim = daysInMonth();
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col lg:flex-row gap-6 lg:items-center">
      <div className="lg:w-72 shrink-0 space-y-1">
        <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-slate-400"><Wallet className="w-4 h-4 text-emerald-600" /> Income Summary</div>
        <div className="text-3xl font-extrabold tracking-tight text-slate-900">{formatCurrency(total)}</div>
        <p className="text-[11px] text-slate-400">{`per month · weekly income counted as ${dim} days ÷ 7`}</p>
      </div>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {income.map((i) => (
          <div key={i.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-800 truncate">{i.source}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium capitalize">{i.frequency}</span>
            </div>
            <div className="mt-1 font-extrabold text-emerald-600">{formatCurrency(i.amount)}</div>
          </div>
        ))}
        {income.length === 0 && <p className="text-xs text-slate-400">No income added yet.</p>}
      </div>
      <Link to="/income" className="shrink-0 px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all flex items-center justify-center gap-1.5">
        <Pencil className="w-3.5 h-3.5" /> Manage income
      </Link>
    </section>
  );
}
