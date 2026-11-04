import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ResetTransactions() {
  const { user, transactions, resetData } = useApp();
  const navigate = useNavigate();
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const demo = user.isDemo;
  const count = transactions.length;

  const confirmReset = async () => {
    setBusy(true);
    const done = await resetData();
    setBusy(false);
    if (done) navigate('/dashboard');
  };

  return (
    <main className="max-w-xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-center animate-fade-in">
      <div className="bg-white rounded-2xl border border-rose-500/40 shadow-sm overflow-hidden">
        <div className="p-6 bg-rose-50 border-b border-rose-500/30 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-rose-600 flex items-center justify-center shrink-0 border border-rose-500/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Reset Transactions</h2>
            <p className="text-xs text-slate-500 mt-1">This action cannot be undone.</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-slate-700 leading-relaxed">
            {demo
              ? `Your ${count} demo expense${count === 1 ? '' : 's'} will be replaced with the original sample data.`
              : `All ${count} of your expense${count === 1 ? '' : 's'} will be permanently deleted from your account. Your income sources are not affected.`}
          </p>

          <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} className="mt-0.5 w-4 h-4 accent-rose-600" />
            <span>I understand this will {demo ? 'discard my demo changes' : 'delete all my expenses'}.</span>
          </label>

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Cancel
            </button>
            <button onClick={confirmReset} disabled={!sure || busy}
              className="px-4 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
              <Trash2 className="w-3.5 h-3.5" /> {busy ? 'Resetting...' : 'Yes, reset transactions'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
