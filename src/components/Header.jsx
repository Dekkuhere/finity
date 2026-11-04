import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Download, RotateCcw, LogOut, LayoutDashboard, TrendingUp, Target, List, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { currencies } from '../utils/data';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import './Header.css';

const tabs = [
  ['overview', 'Overview', LayoutDashboard, ''],
  ['insights', 'Flow Insights', TrendingUp, 'text-emerald-600'],
  ['budgets', 'Budgets', Target, 'text-indigo-500'],
  ['transactions', 'Expenses', List, ''],
];

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, activeTab, setActiveTab, setAuthModal, exportCSV, logout, currency, setCurrency } = useApp();
  const inApp = ['/dashboard', '/reset', '/income', '/admin'].includes(pathname);

  const tab = ([id, label, Icon, color]) => (
    <button key={id} onClick={() => { setActiveTab(id); if (pathname !== '/dashboard') navigate('/dashboard'); }}
      className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === id ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900'}`}>
      <Icon className={`w-3.5 h-3.5 ${color}`} /><span>{label}</span>
    </button>
  );

  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-5 h-14 flex items-center justify-between gap-3">
        <button onClick={() => navigate('/')} aria-label="Finity home" className="brand-btn flex items-center gap-2.5 group focus:outline-none shrink-0">
          <Logo className="w-8 h-8 group-hover:scale-105 transition-transform" />
          <span className="text-[15px] font-extrabold tracking-[0.24em] text-slate-900 leading-none">FINITY</span>
        </button>

        {!inApp && (
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-600">
            <a href="/#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="/#demo-preview" className="hover:text-slate-900 transition-colors">Insights Preview</a>
            <a href="/#philosophy" className="hover:text-slate-900 transition-colors">Mindful Philosophy</a>
          </nav>
        )}
        {inApp && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-xs font-medium border border-slate-200/60">{tabs.map(tab)}</nav>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          {!inApp && !user.isLoggedIn && (
            <>
              <button onClick={() => setAuthModal('login')} className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">Sign In</button>
              <button onClick={() => setAuthModal('signup')} className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all active:scale-95">Get Started</button>
            </>
          )}
          {!inApp && user.isLoggedIn && (
            <Link to="/dashboard" className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5">
              <span>Dashboard</span><ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
          {inApp && (
            <>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} title="Currency" aria-label="Currency"
                className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none cursor-pointer">
                {Object.entries(currencies).map(([code, c]) => <option key={code} value={code}>{c.label}</option>)}
              </select>
              <button onClick={exportCSV} title="Export CSV" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"><Download className="w-4 h-4" /></button>
              <Link to="/reset" title="Reset Transactions" className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-all"><RotateCcw className="w-4 h-4" /></Link>
              {user.isAdmin && <Link to="/admin" title="Admin users" aria-label="Admin users" className={`p-2 rounded-xl transition-all ${pathname === '/admin' ? 'text-slate-900 bg-slate-100' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}><ShieldCheck className="w-4 h-4" /></Link>}
              <div className="flex items-center gap-1.5 bg-slate-100/80 pl-3 pr-1 py-1 rounded-xl border border-slate-200/60">
                <span className="hidden sm:block text-[11px] font-bold text-slate-900 max-w-[110px] truncate">{user.name}</span>
                <button onClick={logout} title="Sign Out" className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all"><LogOut className="w-3.5 h-3.5" /></button>
              </div>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
      {inApp && <nav className="md:hidden flex items-center gap-1 overflow-x-auto px-4 pb-2 text-xs font-medium">{tabs.map(tab)}</nav>}
    </header>
  );
}
