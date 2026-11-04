import { Utensils, ShoppingBag, Home, Banknote, Car, Zap, Film, HeartPulse, Briefcase, MoreHorizontal } from 'lucide-react';

export const categoriesMeta = {
  'Food & Dining': { icon: Utensils, bg: 'bg-slate-100', color: 'text-orange-600', colorCode: '#f97316' },
  Shopping: { icon: ShoppingBag, bg: 'bg-slate-100', color: 'text-purple-600', colorCode: '#a855f7' },
  'Housing & Rent': { icon: Home, bg: 'bg-slate-100', color: 'text-blue-600', colorCode: '#3b82f6' },
  'Salary & Income': { icon: Banknote, bg: 'bg-slate-100', color: 'text-emerald-600', colorCode: '#10b981' },
  Transport: { icon: Car, bg: 'bg-slate-100', color: 'text-amber-600', colorCode: '#f59e0b' },
  Utilities: { icon: Zap, bg: 'bg-slate-100', color: 'text-sky-600', colorCode: '#0ea5e9' },
  Entertainment: { icon: Film, bg: 'bg-slate-100', color: 'text-pink-600', colorCode: '#ec4899' },
  'Health & Fitness': { icon: HeartPulse, bg: 'bg-slate-100', color: 'text-rose-600', colorCode: '#f43f5e' },
  Freelance: { icon: Briefcase, bg: 'bg-slate-100', color: 'text-teal-600', colorCode: '#14b8a6' },
  Misc: { icon: MoreHorizontal, bg: 'bg-slate-100', color: 'text-slate-600', colorCode: '#64748b' },
};

export const expenseCategories = ['Food & Dining', 'Shopping', 'Housing & Rent', 'Transport', 'Utilities', 'Entertainment', 'Health & Fitness', 'Misc'];
export const incomeCategories = ['Salary & Income', 'Freelance', 'Misc'];
export const budgetCaps = { 'Housing & Rent': 1500, 'Food & Dining': 450, Shopping: 250, Utilities: 150, Entertainment: 120 };

export const getCategoryMeta = (c) => categoriesMeta[c] || categoriesMeta.Misc;
export const getCategoryColor = (c) => categoriesMeta[c]?.colorCode || '#64748b';

export const currencies = {
  INR: { symbol: '₹', label: 'INR (₹)', locale: 'en-IN' },
  USD: { symbol: '$', label: 'USD ($)', locale: 'en-US' },
  JPY: { symbol: '¥', label: 'YEN (¥)', locale: 'en-US' },
  CNY: { symbol: '元', label: 'YUAN (元)', locale: 'en-US' },
};
let activeCurrency = 'USD';
export const setActiveCurrency = (c) => { if (currencies[c]) activeCurrency = c; };
export const currencySymbol = (c = activeCurrency) => (currencies[c] || currencies.USD).symbol;

export function formatCurrency(v) {
  const { symbol, locale } = currencies[activeCurrency];
  const n = Number(v) || 0;
  const digits = activeCurrency === 'JPY' ? 0 : 2;
  const num = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(n));
  const sign = n < 0 ? '-' : '';
  return activeCurrency === 'CNY' ? `${sign}${num}${symbol}` : `${sign}${symbol}${num}`;
}

export function formatDate(s) {
  if (!s) return '';
  const p = s.split('-');
  if (p.length === 3) return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return s;
}

export function defaultTransactions() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  const t = (id, description, amount, type, category, d) => ({ id, description, amount, type, category, date: `${y}-${m}-${d}` });
  return [
    t(2, 'Apartment Rent', 1350.0, 'expense', 'Housing & Rent', '02'),
    t(3, 'Organic Grocery Market', 165.2, 'expense', 'Food & Dining', '04'),
    t(5, 'Electric & Heating Bill', 92.4, 'expense', 'Utilities', '10'),
    t(6, 'Fitness Center Membership', 55.0, 'expense', 'Health & Fitness', '12'),
    t(7, 'Weekend Dinner & Drinks', 112.8, 'expense', 'Food & Dining', '15'),
    t(8, 'Metro Pass Upgrade', 75.0, 'expense', 'Transport', '18'),
  ];
}

/** All derived values that were Alpine "get" properties */
export function getStats(tx, incomeOverride) {
  const sum = (f) => tx.filter(f).reduce((a, t) => a + Number(t.amount), 0);
  const totalIncome = incomeOverride ?? sum((t) => t.type === 'income');
  const totalExpenses = sum((t) => t.type === 'expense');
  const totalBalance = totalIncome - totalExpenses;
  const savingsRatePercent = totalIncome === 0 ? 0 : Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100));
  const now = new Date();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const safeDailySpend = totalBalance / Math.max(1, dim - now.getDate() + 1);

  const catMap = {};
  const dayMap = {};
  tx.filter((t) => t.type === 'expense').forEach((t) => {
    catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
    const d = new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' });
    dayMap[d] = (dayMap[d] || 0) + Number(t.amount);
  });
  const expensesByCategory = Object.keys(catMap).map((category) => ({ category, amount: catMap[category] })).sort((a, b) => b.amount - a.amount);
  let peakSpendingDay = 'Friday';
  let max = 0;
  Object.keys(dayMap).forEach((d) => { if (dayMap[d] > max) { max = dayMap[d]; peakSpendingDay = d; } });

  const budgetItems = Object.keys(budgetCaps).map((category) => ({
    category,
    cap: budgetCaps[category],
    spent: sum((t) => t.type === 'expense' && t.category === category),
  }));

  return {
    totalIncome, totalExpenses, totalBalance, savingsRatePercent, safeDailySpend,
    expensesByCategory, budgetItems, peakSpendingDay,
    topExpenseCategory: expensesByCategory[0]?.category || 'None',
    topExpenseAmount: expensesByCategory[0]?.amount || 0,
    categoryPct: (amt) => (totalExpenses === 0 ? 0 : Math.round((amt / totalExpenses) * 100)),
  };
}

/* ---- income helpers (income entries are recurring: weekly or monthly) ---- */
export const daysInMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
export const monthlyIncomeOf = (list) => {
  const dim = daysInMonth();
  return list.reduce((a, i) => a + (i.frequency === 'weekly' ? (Number(i.amount) * dim) / 7 : Number(i.amount)), 0);
};
export const isThisMonth = (s) => {
  const n = new Date();
  return (s || '').slice(0, 7) === `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
};
export const defaultIncome = () => [
  { id: 1, amount: 4800, source: 'Tech Salary', frequency: 'monthly', created_at: new Date().toISOString() },
  { id: 2, amount: 220, source: 'Freelance Design', frequency: 'weekly', created_at: new Date().toISOString() },
];

/* Single source for the forecast numbers (used for demo data and the API summary) */
export function buildForecast({ monthlyIncome, monthlyExpenses, daysInMonth: dim, daysElapsed, dailySafe }) {
  const savings = monthlyIncome - monthlyExpenses;
  const velocity = monthlyExpenses / Math.max(1, daysElapsed);
  const projectedSpend = velocity * dim;
  return {
    monthlyIncome, monthlyExpenses, savings, daysInMonth: dim, daysElapsed, velocity, projectedSpend,
    projectedSurplus: monthlyIncome - projectedSpend,
    dailySafe: dailySafe ?? savings / dim,
  };
}
