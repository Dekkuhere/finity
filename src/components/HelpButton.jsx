import { useEffect, useState } from 'react';
import { HelpCircle, X, CheckCircle2 } from 'lucide-react';
import { useApp, request } from '../context/AppContext';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const field = 'w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10';
const Err = ({ children }) => (children ? <p role="alert" className="mt-1 text-[11px] font-medium text-rose-600">{children}</p> : null);

export default function HelpButton() {
  const { user, showToast } = useApp();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', email: '', message: '' });
  const [err, setErr] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const real = user.isLoggedIn && !user.isDemo;

  const openForm = () => {
    setF({ name: real ? user.name : '', email: real ? user.email : '', message: '' });
    setErr({}); setStatus('idle'); setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open]);

  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr({ ...err, [k]: undefined, form: undefined }); };

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (!f.name.trim()) v.name = 'Please enter your name.';
    if (!emailRe.test(f.email.trim())) v.email = 'Enter a valid email address.';
    if (f.message.trim().length < 5) v.message = 'Please write at least 5 characters.';
    setErr(v);
    if (Object.keys(v).length) return;
    setStatus('sending');
    try {
      await request('/feedback', { method: 'POST', body: f, token: localStorage.getItem('finity_token') });
      setStatus('sent');
      showToast('Thanks for your feedback!');
    } catch (e2) { setStatus('idle'); setErr({ form: e2.message }); }
  };

  return (
    <>
      <button onClick={openForm} aria-label="Help and feedback" title="Help & feedback"
        className="fixed z-40 right-5 bottom-5 px-4 h-10 rounded-full bg-slate-900 text-white text-xs font-bold shadow-lg border border-slate-700/40 flex items-center gap-2 hover:scale-105 transition-transform">
        <HelpCircle className="w-4 h-4" /> Help
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div onClick={() => setOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 z-10 space-y-5 animate-fade-in">
            <button onClick={() => setOpen(false)} aria-label="Close" className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"><X className="w-4 h-4" /></button>
            {status === 'sent' ? (
              <div className="text-center space-y-3 py-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-extrabold text-slate-900">Feedback sent</h3>
                <p className="text-xs text-slate-500">Thank you! We read every message.</p>
                <button onClick={() => setOpen(false)} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold">Close</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Help &amp; Feedback</h3>
                  <p className="text-xs text-slate-500">Report an issue or suggest an improvement.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                  <input type="text" value={f.name} onChange={set('name')} placeholder="Your name" className={`${field} ${err.name ? 'border-rose-500' : 'border-slate-200'}`} />
                  <Err>{err.name}</Err>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input type="email" value={f.email} onChange={set('email')} placeholder="you@example.com" className={`${field} ${err.email ? 'border-rose-500' : 'border-slate-200'}`} />
                  <Err>{err.email}</Err>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Message</label>
                  <textarea rows={4} maxLength={2000} value={f.message} onChange={set('message')} placeholder="Tell us what happened or what you'd like to see..." className={`${field} resize-none ${err.message ? 'border-rose-500' : 'border-slate-200'}`} />
                  <Err>{err.message}</Err>
                </div>
                {err.form && <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-600">{err.form}</div>}
                <button type="submit" disabled={status === 'sending'} className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95">
                  {status === 'sending' ? 'Sending...' : 'Send Feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
