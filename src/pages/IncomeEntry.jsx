import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trash2, Wallet, CalendarDays, CalendarRange, PlusCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { currencySymbol, formatCurrency, monthlyIncomeOf } from '../utils/data';

const field = 'w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10';
const label = 'block text-xs font-semibold text-slate-600 mb-1';
const Err = ({ children }) => (children ? <p role="alert" className="mt-1 text-[11px] font-medium text-rose-600">{children}</p> : null);

export default function IncomeEntry() {
  const { income, addIncome, deleteIncome, currency } = useApp();
  const navigate = useNavigate();
  const [f, setF] = useState({ amount: '', source: '', frequency: 'monthly' });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr({ ...err, [k]: undefined }); };
  const total = monthlyIncomeOf(income);

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (!(parseFloat(f.amount) > 0)) v.amount = 'Enter an amount greater than 0.';
    if (!f.source.trim()) v.source = 'Enter where this income comes from.';
    setErr(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    const ok = await addIncome(f);
    setBusy(false);
    if (ok) setF({ ...f, amount: '', source: '' });
  };

  return (
    <main className="max-w-6xl w-full mx-auto px-4 sm:px-5 py-6 flex-1 flex flex-col justify-center gap-6 animate-fade-in">
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/70">Step 1 of 2</span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Add your income</h2>
        <p className="text-sm text-slate-500">Tell Finity what you earn so it can show your savings and a safe daily spending limit.</p>
      </div>

      <form onSubmit={submit} noValidate className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          <div className="md:col-span-3">
            <label className={label}>{`Income amount (${currencySymbol(currency)})`}</label>
            <input type="number" step="0.01" min="0" value={f.amount} onChange={set('amount')} placeholder="0.00" className={`${field} ${err.amount ? 'border-rose-500' : 'border-slate-200'}`} />
            <Err>{err.amount}</Err>
          </div>
          <div className="md:col-span-4">
            <label className={label}>Source</label>
            <input type="text" list="income-sources" value={f.source} onChange={set('source')} placeholder="e.g. Salary, Freelance" className={`${field} ${err.source ? 'border-rose-500' : 'border-slate-200'}`} />
            <datalist id="income-sources"><option value="Salary" /><option value="Freelance" /><option value="Business" /><option value="Investments" /><option value="Other" /></datalist>
            <Err>{err.source}</Err>
          </div>
          <div className="md:col-span-3">
            <label className={label}>Frequency</label>
            <div className="inline-flex w-full p-1 bg-slate-100 rounded-xl text-xs font-semibold border border-slate-200/60">
              {[['weekly', 'Weekly', CalendarDays], ['monthly', 'Monthly', CalendarRange]].map(([id, text, Icon]) => (
                <button key={id} type="button" onClick={() => setF({ ...f, frequency: id })}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${f.frequency === id ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'}`}>
                  <Icon className="w-3.5 h-3.5" />{text}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 md:pt-[22px]">
            <button type="submit" disabled={busy} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95">
              <PlusCircle className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      </form>

      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-600" /> Your income sources</h3>
          <span className="text-xs text-slate-400">{`${income.length} ${income.length === 1 ? 'source' : 'sources'}`}</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {income.map((i) => (
            <li key={i.id} className="px-5 py-3 flex items-center justify-between gap-3 text-sm group">
              <div className="min-w-0">
                <div className="font-semibold text-slate-800 truncate">{i.source}</div>
                <div className="text-[11px] text-slate-400 capitalize">{i.frequency}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-bold text-emerald-600">{formatCurrency(i.amount)}</div>
                  <div className="text-[10px] text-slate-400">{`per ${i.frequency === 'weekly' ? 'week' : 'month'}`}</div>
                </div>
                <button onClick={() => deleteIncome(i.id)} title="Remove" className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </li>
          ))}
          {income.length === 0 && <li className="px-5 py-10 text-center text-xs text-slate-400">No income added yet. Add your first source above.</li>}
        </ul>
        <div className="px-5 py-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">Estimated monthly income <span className="ml-1 text-base font-extrabold text-slate-900">{formatCurrency(total)}</span></div>
          <button onClick={() => navigate('/dashboard')} disabled={income.length === 0}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
            Continue to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </main>
  );
}
