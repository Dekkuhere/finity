import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { defaultTransactions, defaultIncome, setActiveCurrency, daysInMonth, monthlyIncomeOf, isThisMonth, buildForecast } from '../utils/data';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const GUEST = { name: 'Guest User', email: '', isLoggedIn: false };
const read = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};

// Small fetch wrapper for the Finity API (proxied to :4000 by Vite)
export async function request(path, { method = 'GET', body, token } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the server. Is it running?");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong');
    err.status = res.status;
    throw err;
  }
  return data;
}

const saveSession = (session) => {
  localStorage.setItem('finity_token', session.token);
  localStorage.setItem('finity_refresh_token', session.refreshToken);
};

export function AppProvider({ children }) {
  const navigate = useNavigate();
  const tokenRef = useRef(localStorage.getItem('finity_token'));
  const refreshTokenRef = useRef(localStorage.getItem('finity_refresh_token'));
  const [user, setUser] = useState(() => (tokenRef.current ? read('finity_user', GUEST) : GUEST));
  const [expenses, setExpenses] = useState(() => (tokenRef.current ? [] : defaultTransactions()));
  const [income, setIncome] = useState(() => (tokenRef.current ? [] : defaultIncome()));
  const [toast, setToast] = useState({ show: false, message: '' });
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'signup'
  const [activeTab, setActiveTab] = useState('overview');
  const timer = useRef();

  // ----- theme (light = original look, dark = slate variant) -----
  const [theme, setTheme] = useState(() => localStorage.getItem('finity_theme') || 'light');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('finity_theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // ----- currency (display only) -----
  const [currency, setCurrencyState] = useState(() => {
    const c = localStorage.getItem('finity_currency') || 'USD';
    setActiveCurrency(c);
    return c;
  });
  const setCurrency = (c) => { setActiveCurrency(c); localStorage.setItem('finity_currency', c); setCurrencyState(c); };

  const call = useCallback((path, opts = {}) => request(path, { ...opts, token: tokenRef.current }), []);
  const demo = user.isDemo;

  const showToast = useCallback((message) => {
    setToast({ show: true, message });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  }, []);

  const clearSession = () => {
    tokenRef.current = null;
    refreshTokenRef.current = null;
    localStorage.removeItem('finity_token');
    localStorage.removeItem('finity_refresh_token');
    localStorage.removeItem('finity_user');
    setUser(GUEST);
    setExpenses([]);
    setIncome([]);
  };
  const fail = (e) => {
    if (e.status === 401) { clearSession(); navigate('/'); }
    showToast(e.message);
  };

  const loadData = async () => {
    const [inc, exp] = await Promise.all([call('/income'), call('/expenses')]);
    setIncome(inc);
    setExpenses(exp);
  };

  // Restore a saved session on page load
  useEffect(() => {
    if (!tokenRef.current) return;
    (async () => {
      try {
        if (!refreshTokenRef.current) throw new Error('Your saved session has expired. Please sign in again.');
        const session = await request('/auth/refresh', {
          method: 'POST',
          body: { refreshToken: refreshTokenRef.current },
        });
        tokenRef.current = session.token;
        refreshTokenRef.current = session.refreshToken;
        saveSession(session);
        const me = await call('/auth/me');
        setUser({ name: me.name, email: me.email, isLoggedIn: true, isAdmin: me.isAdmin });
        await loadData();
      } catch (e) {
        clearSession();
        navigate('/');
        if (e.status !== 401) showToast(e.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timerId = setInterval(async () => {
      if (!refreshTokenRef.current) return;
      try {
        const session = await request('/auth/refresh', {
          method: 'POST',
          body: { refreshToken: refreshTokenRef.current },
        });
        tokenRef.current = session.token;
        refreshTokenRef.current = session.refreshToken;
        saveSession(session);
      } catch (e) {
        clearSession();
        navigate('/');
        showToast(e.message);
      }
    }, 45 * 60 * 1000);
    return () => clearInterval(timerId);
  }, [navigate, showToast]);

  // Login / signup -> Page 2 (income entry)
  const startSession = async ({ token, refreshToken, user: u }, msg) => {
    tokenRef.current = token;
    refreshTokenRef.current = refreshToken;
    saveSession({ token, refreshToken });
    const profile = { name: u.name, email: u.email, isLoggedIn: true, isAdmin: u.isAdmin };
    localStorage.setItem('finity_user', JSON.stringify(profile));
    setUser(profile);
    await loadData();
    setAuthModal(null);
    navigate(u.isAdmin ? '/admin' : '/income');
    showToast(msg);
  };

  // These return an error message (shown inside the form) or null on success
  const handleLogin = async ({ email, password }) => {
    try {
      const data = await request('/auth/login', { method: 'POST', body: { email, password } });
      await startSession(data, `Welcome back, ${data.user.name}`);
      return null;
    } catch (e) { return e.message; }
  };
  const handleSignup = async ({ name, email, password }) => {
    try {
      const data = await request('/auth/register', { method: 'POST', body: { name, email, password } });
      if (data.needsEmailConfirmation) {
        setAuthModal('login');
        showToast(data.message);
        return null;
      }
      await startSession(data, 'Account created! Welcome to Finity.');
      return null;
    } catch (e) { return e.message; }
  };

  // Demo stays fully local with sample data
  const launchDemoMode = () => {
    if (!user.isLoggedIn) {
      setUser({ name: 'Alex Rivera (Demo)', email: 'alex.demo@finity.app', isLoggedIn: true, isDemo: true });
      setExpenses(defaultTransactions());
      setIncome(defaultIncome());
    }
    navigate('/dashboard');
    showToast('Launched live interactive dashboard');
  };

  const logout = () => {
    clearSession();
    navigate('/');
    showToast('Signed out successfully.');
  };

  // ----- income -----
  const addIncome = async (data) => {
    const payload = { amount: parseFloat(data.amount), source: data.source.trim(), frequency: data.frequency };
    try {
      const row = demo ? { id: Date.now(), created_at: new Date().toISOString(), ...payload } : await call('/income', { method: 'POST', body: payload });
      setIncome((l) => [row, ...l]);
      showToast('Income added');
      return true;
    } catch (e) { fail(e); return false; }
  };
  const deleteIncome = async (id) => {
    try {
      if (!demo) await call(`/income/${id}`, { method: 'DELETE' });
      setIncome((l) => l.filter((x) => x.id !== id));
      showToast('Income removed');
    } catch (e) { fail(e); }
  };

  // ----- expenses -----
  const addTransaction = async (data) => {
    const payload = { ...data, amount: parseFloat(data.amount) };
    try {
      const tx = demo ? { id: Date.now(), ...payload } : await call('/expenses', { method: 'POST', body: payload });
      setExpenses((t) => [tx, ...t]);
      showToast('Expense logged.');
    } catch (e) { fail(e); }
  };
  const updateTransaction = async (id, data) => {
    const payload = { ...data, amount: parseFloat(data.amount) };
    try {
      const tx = demo ? { id, ...payload } : await call(`/expenses/${id}`, { method: 'PUT', body: payload });
      setExpenses((t) => t.map((x) => (x.id === id ? tx : x)));
      showToast('Entry updated');
    } catch (e) { fail(e); }
  };
  const deleteTransaction = async (id) => {
    try {
      if (!demo) await call(`/expenses/${id}`, { method: 'DELETE' });
      setExpenses((t) => t.filter((x) => x.id !== id));
      showToast('Entry removed');
    } catch (e) { fail(e); }
  };
  const resetData = async () => {
    if (demo) { setExpenses(defaultTransactions()); showToast('Reset to default sample data'); return true; }
    try {
      await call('/expenses', { method: 'DELETE' });
      setExpenses([]);
      showToast('All expenses cleared');
      return true;
    } catch (e) { fail(e); return false; }
  };

  // ----- forecast: (income - expenses) / days in month -----
  const fetchForecast = async () => {
    if (demo || !tokenRef.current) {
      const monthlyExpenses = expenses.filter((t) => isThisMonth(t.date)).reduce((a, t) => a + Number(t.amount), 0);
      return buildForecast({ monthlyIncome: monthlyIncomeOf(income), monthlyExpenses, daysInMonth: daysInMonth(), daysElapsed: new Date().getDate() });
    }
    return buildForecast(await call('/summary'));
  };

  const exportCSV = () => {
    if (!expenses.length) return;
    let csv = 'data:text/csv;charset=utf-8,ID,Description,Amount,Category,Date\n';
    expenses.forEach((t) => {
      csv += `"${t.id}","${String(t.description).replace(/"/g, '""')}",${t.amount},"${t.category}","${t.date}"\n`;
    });
    const a = document.createElement('a');
    a.href = encodeURI(csv);
    a.download = `finity_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('CSV downloaded');
  };

  return (
    <Ctx.Provider value={{
      user, income, expenses, transactions: expenses, toast, authModal, setAuthModal, activeTab, setActiveTab,
      adminRequest: call,
      request,
      requestPasswordReset: async (email) => request('/auth/forgot', { method: 'POST', body: { email } }),
      showToast, handleLogin, handleSignup, launchDemoMode, logout,
      addIncome, deleteIncome, addTransaction, updateTransaction, deleteTransaction, resetData, fetchForecast, exportCSV,
      theme, toggleTheme, currency, setCurrency,
    }}>
      {children}
    </Ctx.Provider>
  );
}
