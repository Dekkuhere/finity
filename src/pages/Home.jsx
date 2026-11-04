import { ArrowRight, LineChart, ShieldCheck, TrendingUp, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Home.css';

const bars = [30, 45, 38, 65, 52, 78, 92, 85, 96];
const features = [
  [TrendingUp, 'bg-emerald-50 text-emerald-600', 'Flow Line Spline Graphs', 'Say goodbye to pie charts. Continuous curved splines visualize income influx vs outflow in real time with daily, weekly, and monthly toggle views.'],
  [Award, 'bg-indigo-50 text-indigo-600', 'One-Tap Forecast', 'A floating button shows your end-of-month surplus, spending velocity and safe daily spend whenever you need them.'],
  [ShieldCheck, 'bg-slate-100 text-slate-700', 'Private & Secure', 'Your financial data belongs to you. It is tied to your own account, never sold, and no bank tracking is required.'],
];

export default function Home() {
  const { setAuthModal, launchDemoMode } = useApp();
  return (
    <div className="flex-1 flex flex-col justify-center gap-16 py-8">
      <section className="relative pt-12 md:pt-20 pb-12 overflow-hidden">
        <div className="hero-glow absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-emerald-100/40 via-slate-100 to-indigo-100/40 blur-3xl -z-10 rounded-full opacity-70"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 shadow-sm animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Minimalist Mindful Spending &amp; Flow Insights</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
            Master your money with <span className="bg-gradient-to-r from-emerald-600 via-slate-800 to-indigo-600 bg-clip-text text-transparent">smooth continuous flow visualizers.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Say goodbye to confusing pie charts. Track cashflow velocity with minimal spline graphs, smart expense progress, and gamified financial health scores.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button onClick={() => setAuthModal('signup')} className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
              <span>Get Started Free</span><ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={launchDemoMode} className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/90 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
              <LineChart className="w-4 h-4 text-emerald-600" /><span>Explore Insights Dashboard</span>
            </button>
          </div>

          <div id="demo-preview" className="pt-8 max-w-4xl mx-auto">
            <div className="relative rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xl shadow-slate-200/60 transition-transform hover:scale-[1.01] text-left">
              <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <span className="text-[11px] font-mono text-slate-400">finity.app/flow-insights</span>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  <ShieldCheck className="w-3.5 h-3.5" /><span>Finity Score: 92/100</span>
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-4 bg-slate-50/50 rounded-b-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cashflow Trajectory Flow</h4>
                    <p className="text-xl font-extrabold text-slate-900 mt-0.5">+$3,240.50 Net Velocity</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100/70 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">67.4% Savings Rate</span>
                </div>
                <div className="h-36 bg-white rounded-xl border border-slate-200/70 p-4 flex items-end justify-between relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-indigo-500/10 blur-xl"></div>
                  <div className="w-full flex items-end justify-between h-full relative z-10 gap-2">
                    {bars.map((h, i) => <div key={i} className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md transition-all duration-500 hover:opacity-90" style={{ height: `${h}%` }}></div>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-5 space-y-12">
        <div id="philosophy" className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900">Designed for Financial Serenity</h2>
          <p className="text-xs sm:text-sm text-slate-500">Minimal components, pure data visualization, and actionable habits without overwhelming tables or chaotic colors.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(([Icon, tone, title, text]) => (
            <div key={title} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}><Icon className="w-5 h-5" /></div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
