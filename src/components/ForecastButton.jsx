import { useEffect, useRef, useState } from 'react';
import { TrendingUp, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency as fmt } from '../utils/data';

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

export default function ForecastButton() {
  const { fetchForecast, currency } = useApp(); // currency: re-render when it changes
  const btn = useRef(null);
  const drag = useRef(null);
  const [pos, setPos] = useState(null); // null = default bottom-right corner
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const openForecast = async () => {
    setOpen(true); setLoading(true); setError('');
    try { setData(await fetchForecast()); } catch (e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open]);

  // pointer-event drag (mouse + touch); a tap without movement opens the forecast
  const onDown = (e) => {
    const r = btn.current.getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, sx: e.clientX, sy: e.clientY, moved: false };
    btn.current.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d || (!d.moved && Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) < 5)) return;
    d.moved = true;
    const r = btn.current.getBoundingClientRect();
    setPos({ x: clamp(e.clientX - d.dx, 8, window.innerWidth - r.width - 8), y: clamp(e.clientY - d.dy, 8, window.innerHeight - r.height - 8) });
  };
  const onUp = () => { const d = drag.current; drag.current = null; if (d && !d.moved) openForecast(); };

  const neg = data && data.savings < 0;
  const behind = data && data.projectedSurplus < 0;
  const row = (l, v, tone = 'text-slate-900') => (
    <div className="flex items-center justify-between text-sm"><span className="text-slate-500">{l}</span><span className={`font-bold ${tone}`}>{v}</span></div>
  );
  const tile = (l, v, bad) => (
    <div className={`rounded-xl p-3 border ${bad ? 'bg-rose-50 border-rose-500/30' : 'bg-emerald-50 border-emerald-200/70'}`}>
      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{l}</div>
      <div className={`text-lg font-extrabold ${bad ? 'text-rose-600' : 'text-emerald-700'}`}>{v}</div>
    </div>
  );

  return (
    <>
      <button ref={btn} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openForecast()}
        title="Forecast (drag to move)" aria-label="Open forecast"
        style={pos ? { left: pos.x, top: pos.y } : { right: 20, bottom: 84 }}
        className="fixed z-40 touch-none select-none cursor-grab active:cursor-grabbing px-4 h-10 rounded-full bg-slate-900 text-white text-xs font-bold shadow-lg border border-slate-700/40 flex items-center gap-2 hover:scale-105 transition-transform">
        <TrendingUp className="w-4 h-4" /> Forecast
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div onClick={() => setOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 z-10 space-y-5 animate-fade-in">
            <button onClick={() => setOpen(false)} aria-label="Close" className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"><X className="w-4 h-4" /></button>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Monthly Forecast</h3>
              <p className="text-xs text-slate-500">Based on your income and this month's expenses.</p>
            </div>
            {loading && <p className="text-xs text-slate-400 py-6 text-center">Calculating...</p>}
            {error && <p role="alert" className="text-xs font-medium text-rose-600">{error}</p>}
            {!loading && data && (
              <>
                <div className="space-y-2.5">
                  {row('Monthly income', fmt(data.monthlyIncome))}
                  {row('Spent so far', fmt(data.monthlyExpenses))}
                  {row('Possible savings', fmt(data.savings), neg ? 'text-rose-600' : 'text-emerald-600')}
                  {row('Spending velocity', `${fmt(data.velocity)} / day`)}
                  {row('Projected month-end spend', fmt(data.projectedSpend))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {tile('End-of-month surplus', fmt(data.projectedSurplus), behind)}
                  {tile('Daily safe spend', fmt(data.dailySafe), data.dailySafe < 0)}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{`Daily safe spend = (income − spent) ÷ ${data.daysInMonth} days. The surplus assumes your current daily pace (day ${data.daysElapsed}) continues.`}</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
