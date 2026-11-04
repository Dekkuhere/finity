import { useMemo, useState } from 'react';
import { Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, getStats, isThisMonth, monthlyIncomeOf } from '../utils/data';
import FlowChart from '../components/FlowChart';
import Budgets from '../components/Budgets';
import TransactionForm from '../components/TransactionForm';
import TransactionsTable from '../components/TransactionsTable';
import IncomeOverview from '../components/IncomeOverview';
import ForecastButton from '../components/ForecastButton';
import './Dashboard.css';

export default function Dashboard() {
  const { income, expenses, activeTab } = useApp();
  const [editing, setEditing] = useState(null);
  const monthExpenses = useMemo(() => expenses.filter((t) => isThisMonth(t.date)), [expenses]);
  const monthlyIncome = useMemo(() => monthlyIncomeOf(income), [income]);
  const stats = useMemo(() => getStats(monthExpenses, monthlyIncome), [monthExpenses, monthlyIncome]);

  const cards = [
    ['Total Balance', formatCurrency(stats.totalBalance), Wallet, 'bg-slate-100 text-slate-700',
      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-emerald-600" /><span className="text-emerald-600 font-bold">{`${stats.savingsRatePercent}% Savings Rate`}</span></p>],
    ['Monthly Income', formatCurrency(stats.totalIncome), ArrowDownLeft, 'bg-emerald-50 text-emerald-600',
      <p className="text-[11px] text-slate-500 mt-1"><span className="font-bold text-slate-700">{income.length}</span> income sources</p>],
    ['Spent This Month', formatCurrency(stats.totalExpenses), ArrowUpRight, 'bg-rose-50 text-rose-600',
      <p className="text-[11px] text-slate-500 mt-1"><span className="font-bold text-slate-700">{monthExpenses.length}</span> expenses this month</p>],
  ];

  // Sections shown on "overview" plus their own tab
  const show = (tab) => activeTab === 'overview' || activeTab === tab;

  return (
    <>
      <main className="dashboard max-w-6xl w-full mx-auto px-4 sm:px-5 py-6 flex-1 flex flex-col justify-center gap-6 animate-fade-in">
        <IncomeOverview income={income} total={monthlyIncome} />

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map(([title, value, Icon, tone, note]) => (
            <div key={title} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3 hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase font-bold tracking-wider">{title}</span>
                <div className={`p-2 rounded-xl ${tone}`}><Icon className="w-4 h-4" /></div>
              </div>
              <div><div className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</div>{note}</div>
            </div>
          ))}
        </section>

        {show('insights') && <FlowChart transactions={expenses} stats={stats} />}
        {show('budgets') && <Budgets stats={stats} />}
        {show('transactions') && (
          <>
            <TransactionForm editing={editing} onDone={() => setEditing(null)} />
            <TransactionsTable onEdit={setEditing} />
          </>
        )}
      </main>
      <ForecastButton />
    </>
  );
}
