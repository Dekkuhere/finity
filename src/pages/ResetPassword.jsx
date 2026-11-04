import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { request } from '../context/AppContext';

const passwordError = (password) => {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include letters and numbers.';
  return '';
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get('access_token');
  const recovery = params.get('type') === 'recovery';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const validation = passwordError(password);
    if (validation) return setError(validation);
    if (password !== confirm) return setError('Passwords do not match.');
    if (!accessToken || !recovery) return setError('This reset link is invalid or expired. Request a new one.');

    setBusy(true);
    setError('');
    try {
      await request('/auth/reset-password', {
        method: 'POST',
        body: { password },
        token: accessToken,
      });
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      setComplete(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex-1 w-full max-w-md mx-auto px-4 py-16">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        {complete ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h1 className="text-xl font-extrabold text-slate-900">Password updated</h1>
            <p className="text-sm text-slate-500">You can sign in with your new password.</p>
            <button onClick={() => navigate('/')} className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800">
              Return to Finity
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <KeyRound className="h-8 w-8 text-indigo-500" />
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Set a new password</h1>
              <p className="mt-1 text-xs text-slate-500">Choose a new password for your Finity account.</p>
            </div>
            <label className="block text-xs font-semibold text-slate-600">
              New password
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Confirm new password
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </label>
            {error && <p role="alert" className="text-xs font-medium text-rose-600">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60">
              {busy ? 'Please wait...' : 'Update password'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
