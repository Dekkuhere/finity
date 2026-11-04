import { useApp } from '../context/AppContext';
import Logo from './Logo';
import './Footer.css';

export default function Footer() {
  const { showToast } = useApp();
  const link = (text, msg) => (
    <a href="#" onClick={(e) => { e.preventDefault(); showToast(msg); }} className="footer-link hover:text-slate-600 transition-colors">{text}</a>
  );
  return (
    <footer className="border-t border-slate-200/60 bg-white py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <div className="flex items-center gap-2">
          <Logo className="w-6 h-6" />
          <p>© 2026 Finity Inc. Mindful Personal Financial Flow.</p>
        </div>
        <div className="flex items-center gap-6">
          {link('Privacy', 'Your data is private and tied to your account')}
          {link('v3.2 Insights', 'Finity Insights v3.2 Flow Engine')}
        </div>
      </div>
    </footer>
  );
}
