import { useApp } from '../context/AppContext';
import './Toast.css';

export default function Toast() {
  const { toast } = useApp();
  return (
    <div className={`toast fixed bottom-5 left-5 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white text-xs font-medium rounded-xl shadow-xl border border-slate-800 ${toast.show ? 'toast--show' : ''}`}>
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
      <span>{toast.message}</span>
    </div>
  );
}
