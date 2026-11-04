import { useMemo, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Activity, Layers, Lightbulb } from 'lucide-react';
import { formatCurrency, getCategoryMeta, getCategoryColor, daysInMonth } from '../utils/data';
import { useApp } from '../context/AppContext';
import './FlowChart.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const intervals = [['daily', '7 Days'], ['weekly', '30 Days'], ['monthly', 'Monthly']];
const font = { family: 'Inter', size: 10 };

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// income is recurring, so the inflow line shows expected income per period
function buildSeries(interval, tx, stats) {
  const now = new Date();
  const perDay = stats.totalIncome / daysInMonth();
  const spent = (pred) => tx.filter((t) => t.type === 'expense' && pred(t)).reduce((a, b) => a + Number(b.amount), 0);
  const points = [];
  if (interval === 'daily') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const key = iso(d);
      points.push({ label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }), inc: perDay, exp: spent((t) => t.date === key) });
    }
  } else if (interval === 'weekly') {
    for (let i = 3; i >= 0; i--) {
      const end = new Date(now); end.setDate(now.getDate() - 7 * i);
      const start = new Date(end); start.setDate(end.getDate() - 6);
      const a = iso(start), b = iso(end);
      points.push({ label: `Wk ${4 - i}`, inc: perDay * 7, exp: spent((t) => t.date >= a && t.date <= b) });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      points.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), inc: stats.totalIncome, exp: spent((t) => t.date.slice(0, 7) === key) });
    }
  }
  return points;
}

export default function FlowChart({ transactions, stats }) {
  const [interval, setInterval] = useState('daily');
  const { theme } = useApp();
  const pal = theme === 'dark'
    ? { inc: '#34d399', rgb: '52,211,153', exp: '#fb7185', tick: '#94a3b8', grid: '#1e293b', tipBg: '#e2e8f0', tipText: '#0f172a', text: '#e2e8f0' }
    : { inc: '#10b981', rgb: '16,185,129', exp: '#f43f5e', tick: '#94a3b8', grid: '#f1f5f9', tipBg: '#0f172a', tipText: '#ffffff', text: '#334155' };
  const series = useMemo(() => buildSeries(interval, transactions, stats), [interval, transactions, stats.totalIncome, stats.totalExpenses]);

  const data = {
    labels: series.map((p) => p.label),
    datasets: [
      {
        label: 'Expected Income', data: series.map((p) => p.inc), borderColor: pal.inc, borderWidth: 3, tension: 0.4, fill: true,
        pointBackgroundColor: pal.inc, pointRadius: 4, pointHoverRadius: 6,
        backgroundColor: (ctx) => {
          const { ctx: c, chartArea } = ctx.chart;
          if (!chartArea) return null;
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, `rgba(${pal.rgb}, 0.25)`);
          g.addColorStop(1, `rgba(${pal.rgb}, 0)`);
          return g;
        },
      },
      { label: 'Outflow Trajectory', data: series.map((p) => p.exp), borderColor: pal.exp, borderWidth: 2, borderDash: [4, 4], backgroundColor: 'transparent', tension: 0.4, pointRadius: 3 },
    ],
  };

  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', align: 'end', labels: { color: pal.text, usePointStyle: true, font: { family: 'Inter', size: 11, weight: '600' } } },
      tooltip: {
        backgroundColor: pal.tipBg, titleColor: pal.tipText, bodyColor: pal.tipText, padding: 10,
        titleFont: { family: 'Inter', size: 12, weight: 'bold' }, bodyFont: { family: 'Inter', size: 11 },
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw || 0)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font, color: pal.tick } },
      y: { grid: { color: pal.grid }, ticks: { font, color: pal.tick } },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" /> Cashflow Trajectory Flow Line
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Smooth spline trajectory of Inflow vs Outflow over time</p>
          </div>
          <div className="inline-flex p-0.5 bg-slate-100 rounded-xl text-xs font-semibold border border-slate-200/60">
            {intervals.map(([id, label]) => (
              <button key={id} onClick={() => setInterval(id)} className={`px-2.5 py-1 rounded-lg transition-all ${interval === id ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'}`}>{label}</button>
            ))}
          </div>
        </div>

        <div className="chart-wrap relative w-full h-72"><Line data={data} options={options} /></div>

        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
          {[['Avg. Daily Spend', formatCurrency(stats.totalExpenses / 30), 'text-slate-800'], ['Peak Outflow Day', stats.peakSpendingDay, 'text-slate-800'], ['Flow Volatility Index', 'Low / Stable', 'text-emerald-600']].map(([l, v, c]) => (
            <div key={l} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">{l}</span>
              <span className={`font-extrabold mt-0.5 block ${c}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Layers className="w-4 h-4 text-slate-400" /> Category Breakdown</h3>
          <span className="text-[11px] text-slate-400 font-medium">{`${stats.expensesByCategory.length} Active Categories`}</span>
        </div>
        <div className="space-y-4 overflow-y-auto max-h-72 pr-1">
          {stats.expensesByCategory.map((item) => {
            const m = getCategoryMeta(item.category);
            const pct = stats.categoryPct(item.amount);
            return (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${m.bg}`}><m.icon className={`w-3.5 h-3.5 ${m.color}`} /></div>
                    <span className="font-semibold text-slate-800">{item.category}</span>
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                    <span className="text-[10px] text-slate-400 ml-1">{`(${pct}%)`}</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: getCategoryColor(item.category) }}></div>
                </div>
              </div>
            );
          })}
          {stats.expensesByCategory.length === 0 && <div className="text-center py-10 text-xs text-slate-400">No expense data recorded yet.</div>}
        </div>
        <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100 text-xs text-emerald-900 flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold">Flow Suggestion:</strong> Your primary outflow is <span className="font-bold">{stats.topExpenseCategory}</span>. Cutting this by 10% redirects <span className="font-bold">{formatCurrency(stats.topExpenseAmount * 0.1)}</span> to your savings pool.
          </p>
        </div>
      </div>
    </div>
  );
}
