import { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { expenseCategories, incomeCategories, currencySymbol } from '../utils/data';
import './TransactionForm.css';

const today = () => new Date().toISOString().split('T')[0];
const blank = (type) => ({ description: '', amount: '', category: type === 'income' ? 'Salary & Income' : 'Food & Dining', date: today() });
const field = 'w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400';
const label = 'block text-xs font-medium text-slate-500 mb-1';

export default function TransactionForm({ type = 'expense', editing, onDone }) {
  const { addTransaction, updateTransaction, currency } = useApp();
  const [f, setF] = useState(blank(type));
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { setF(blank(type)); }, [type]);
  useEffect(() => {
    if (editing) {
      setF({ description: editing.description, amount: editing.amount, category: editing.category, date: editing.date });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editing]);

  const submit = (e) => {
    e.preventDefault();
    const payload = { ...f, type };
    editing ? updateTransaction(editing.id, payload) : addTransaction(payload);
    onDone();
    setF({ ...f, description: '', amount: '' });
  };

  const cats = type === 'income' ? incomeCategories : expenseCategories;
  const noun = type === 'income' ? 'Income' : 'Expense';

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-slate-500" /><span>{editing ? `Edit ${noun}` : `Log ${noun}`}</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          <div className="md:col-span-4"><label className={label}>Description</label><input type="text" value={f.description} onChange={set('description')} placeholder={type === 'income' ? 'e.g. Freelance Project' : 'e.g. Organic Groceries'} required className={field} /></div>
          <div className="md:col-span-2"><label className={label}>{`Amount (${currencySymbol(currency)})`}</label><input type="number" step="0.01" min="0.01" value={f.amount} onChange={set('amount')} placeholder="0.00" required className={field} /></div>
          <div className="md:col-span-3"><label className={label}>Category</label>
            <select value={f.category} onChange={set('category')} required className={`${field} text-slate-700`}>{cats.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          </div>
          <div className="md:col-span-2"><label className={label}>Date</label><input type="date" value={f.date} onChange={set('date')} required className={`${field} text-slate-700`} /></div>
          <div className="md:col-span-1 flex items-end">
            <button type="submit" className="w-full h-[34px] bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center transition-all shadow-sm active:scale-95">{editing ? 'Update' : 'Add'}</button>
          </div>
        </div>
      </form>
    </section>
  );
}
