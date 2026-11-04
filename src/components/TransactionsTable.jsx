import { useMemo, useState } from 'react';
import { Search, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { expenseCategories, incomeCategories, formatCurrency, formatDate, getCategoryMeta } from '../utils/data';
import './TransactionsTable.css';

const PAGE_SIZE = 8;

export default function TransactionsTable({ type = 'expense', onEdit }) {
  const { transactions, deleteTransaction } = useApp();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  const filtered = useMemo(() =>
    transactions
      .filter((t) => t.description.toLowerCase().includes(q.toLowerCase()) && t.type === type && (cat === 'all' || t.category === cat))
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
  [transactions, q, type, cat]);

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search entries..." className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none">
            <option value="all">All Categories</option>
            {(type === 'income' ? incomeCategories : expenseCategories).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/80 uppercase tracking-wider text-[10px] font-bold text-slate-400 border-b border-slate-100">
            <tr>
              <th className="px-5 py-3">Description</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Date</th>
              <th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.slice(0, PAGE_SIZE).map((item) => {
              const m = getCategoryMeta(item.category);
              const inc = item.type === 'income';
              return (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-5 py-3 font-semibold text-slate-800 flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${m.bg}`}><m.icon className={`w-3.5 h-3.5 ${m.color}`} /></div>
                    <span className="truncate max-w-xs">{item.description}</span>
                  </td>
                  <td className="px-5 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">{item.category}</span></td>
                  <td className="px-5 py-3 text-slate-400">{formatDate(item.date)}</td>
                  <td className="px-5 py-3 text-right font-bold">
                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs ${inc ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-800'}`}>
                      <span>{inc ? '+' : '-'}</span><span>{formatCurrency(item.amount)}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end items-center gap-1">
                      <button onClick={() => onEdit(item)} title="Edit" className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteTransaction(item.id)} title="Delete" className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-12 text-center text-xs text-slate-400">No transactions found matching your criteria.</div>}
      </div>
    </section>
  );
}
