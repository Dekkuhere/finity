import { useEffect, useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Logo from './Logo';
import './AuthModal.css';

const base = 'w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10';
const okCls = 'border-slate-200 focus:border-slate-400';
const badCls = 'border-rose-500 focus:border-rose-500';
const submitCls = 'w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95';
const empty = { name: '', email: '', password: '', confirm: '' };
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(f, login) {
  const e = {};
  if (!login && !f.name.trim()) e.name = 'Please enter your full name.';
  if (!f.email.trim()) e.email = 'Email is required.';
  else if (!emailRe.test(f.email.trim())) e.email = 'Enter a valid email address.';
  if (!f.password) e.password = 'Password is required.';
  else if (!login) {
    if (f.password.length < 8) e.password = 'Password is too weak: use at least 8 characters.';
    else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'Password is too weak: include letters and numbers.';
  }
  if (!login) {
    if (!f.confirm) e.confirm = 'Please confirm your password.';
    else if (f.confirm !== f.password) e.confirm = 'Passwords do not match.';
  }
  return e;
}

function Field({ label, error, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input {...props} aria-invalid={!!error} className={`${base} ${error ? badCls : okCls}`} />
      {error && <p role="alert" className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>}
    </div>
  );
}

export default function AuthModal() {
  const { authModal, setAuthModal, handleLogin, handleSignup } = useApp();
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErrors((x) => ({ ...x, [k]: undefined, form: undefined })); };

  useEffect(() => { setF(empty); setErrors({}); }, [authModal]);
  if (!authModal) return null;
  const login = authModal === 'login';
  const forgot = authModal === 'forgot';

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate(f, login);
    if (Object.keys(v).length) return setErrors(v);
    setBusy(true);
    const msg = await (login ? handleLogin(f) : handleSignup(f));
    setBusy(false);
    if (msg) setErrors({ form: msg });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={() => setAuthModal(null)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
      <div className="auth-card relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 z-10 space-y-6 animate-fade-in">
        <button onClick={() => setAuthModal(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all">
          <X className="w-4 h-4" />
        </button>
        <div className="text-left space-y-1">
          <Logo className="w-9 h-9 mb-3" />
          {!forgot && (
            <>
          <h3 className="text-xl font-extrabold text-slate-900">{login ? 'Welcome Back' : 'Create Your Finity Account'}</h3>
          <p className="text-xs text-slate-500">{login ? 'Sign in to access your personal cashflow trajectory' : 'Unlock minimalist expense flow insights in seconds'}</p>
            </>
          )}
        </div>

        {forgot && <ForgotFlow />}

        {!forgot && (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {!login && <Field label="Full Name" type="text" value={f.name} onChange={set('name')} placeholder="Alex Rivera" error={errors.name} />}
          <Field label="Email Address" type="email" value={f.email} onChange={set('email')} placeholder="alex@example.com" error={errors.email} />
          <Field label="Password" type="password" value={f.password} onChange={set('password')} placeholder={login ? '••••••••' : 'At least 8 characters, letters & numbers'} error={errors.password} />
          {login && (
            <div className="text-right -mt-2">
              <button type="button" onClick={() => setAuthModal('forgot')} className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 hover:underline">Forgot Password?</button>
            </div>
          )}
          {!login && <Field label="Confirm Password" type="password" value={f.confirm} onChange={set('confirm')} placeholder="Repeat your password" error={errors.confirm} />}
          {errors.form && (
            <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-600">{errors.form}</div>
          )}
          <button type="submit" disabled={busy} className={submitCls}>{busy ? 'Please wait...' : login ? 'Sign In to Dashboard' : 'Create Free Account'}</button>
        </form>
        )}

        {!forgot && (
        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          {login
            ? <p>Don't have an account? <button onClick={() => setAuthModal('signup')} className="font-bold text-slate-900 hover:underline">Sign up</button></p>
            : <p>Already have an account? <button onClick={() => setAuthModal('login')} className="font-bold text-slate-900 hover:underline">Sign in</button></p>}
        </div>
        )}
      </div>
    </div>
  );
}

function ForgotFlow() {
  const { setAuthModal, requestPasswordReset } = useApp();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); } catch (e) { setErr({ form: e.message }); }
    setBusy(false);
  };

  const sendResetLink = (e) => {
    e.preventDefault();
    if (!emailRe.test(email.trim())) return setErr({ email: 'Enter a valid email address.' });
    setErr({});
    run(async () => {
      await requestPasswordReset(email.trim());
      setSent(true);
    });
  };

  const formErr = err.form && <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-600">{err.form}</div>;
  const link = 'text-[11px] font-semibold text-slate-500 hover:text-slate-900 hover:underline disabled:opacity-50 disabled:no-underline';

  return (
    <div className="space-y-5">
      {sent ? (
        <div className="space-y-4 text-center py-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-xl font-extrabold text-slate-900">Check your email</h3>
          <p className="text-xs text-slate-500">If {email.trim()} is registered, Supabase has sent a password reset link.</p>
        </div>
      ) : (
        <form onSubmit={sendResetLink} noValidate className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-900">Forgot your password?</h3>
            <p className="text-xs text-slate-500">Enter your email and we'll send you a secure reset link.</p>
          </div>
          <Field label="Email Address" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr({}); }} placeholder="alex@example.com" error={err.email} />
          {formErr}
          <button type="submit" disabled={busy} className={submitCls}>{busy ? 'Please wait...' : 'Send Reset Link'}</button>
        </form>
      )}
      <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
        <button onClick={() => setAuthModal('login')} className={link}>Back to Sign In</button>
      </div>
    </div>
  );
}
