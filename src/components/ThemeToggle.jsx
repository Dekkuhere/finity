import { Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useApp();
  const dark = theme === 'dark';
  const icon = 'absolute w-3 h-3 transition-all duration-500';
  return (
    <button type="button" role="switch" aria-checked={dark} aria-label="Toggle dark mode" onClick={toggleTheme}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="group relative w-14 h-7 shrink-0 rounded-full border border-slate-200 bg-slate-100 shadow-inner transition-all duration-500 hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50">
      <span className={`absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white flex items-center justify-center transition-all duration-500 ease-out group-hover:scale-110 ${dark ? 'translate-x-7 shadow-[0_0_10px_rgba(165,180,252,0.55)]' : 'translate-x-0 shadow-[0_0_10px_rgba(245,158,11,0.6)]'}`}>
        <Sun className={`${icon} text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.9)] ${dark ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
        <Moon className={`${icon} text-indigo-300 drop-shadow-[0_0_5px_rgba(165,180,252,0.8)] ${dark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`} />
      </span>
    </button>
  );
}
