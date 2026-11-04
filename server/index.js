import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const PORT = process.env.PORT || 4000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_NAME = (process.env.ADMIN_NAME || 'Finity Admin').trim().slice(0, 80);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in server/.env');
}

const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, flowType: 'implicit' },
});
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, flowType: 'implicit' },
});

const app = express();
app.use(cors());
app.use(express.json());

const hits = new Map();
const limit = (max, windowMs) => (req, res, next) => {
  const key = `${req.ip}|${req.path}`;
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= max) return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
  recent.push(now);
  hits.set(key, recent);
  next();
};

const text = (value, max) => String(value ?? '').trim().slice(0, max);
const money = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 && amount < 1e12 ? Math.round(amount * 100) / 100 : null;
};
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const api = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const failIfError = (result) => {
  if (result.error) throw result.error;
  return result.data;
};

async function findProfile(userId) {
  const { data, error } = await db.from('profiles')
    .select('id, name, email, is_admin')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function ensureProfile(authUser) {
  if (!authUser?.id || !authUser.email) throw new Error('Authenticated Supabase user is missing an id or email');
  const { data, error } = await db.from('profiles').upsert({
    id: authUser.id,
    name: text(authUser.user_metadata?.name, 80),
    email: authUser.email.toLowerCase(),
  }, { onConflict: 'id' })
    .select('id, name, email, is_admin')
    .single();
  if (error) throw error;
  return data;
}

function publicUser(profile) {
  return { id: profile.id, name: profile.name, email: profile.email, isAdmin: profile.is_admin };
}

const bearerToken = (req) => {
  const match = (req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
};

const auth = api(async (req, res, next) => {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Unauthorized' });
  req.userId = data.user.id;
  req.accessToken = token;
  next();
});

const requireAdmin = api(async (req, res, next) => {
  const profile = await findProfile(req.userId);
  if (!profile?.is_admin) return res.status(403).json({ error: 'Admin access required' });
  req.profile = profile;
  next();
});

app.post('/api/auth/register', api(async (req, res) => {
  const name = text(req.body?.name, 80);
  const email = text(req.body?.email, 120).toLowerCase();
  const password = String(req.body?.password ?? '');
  if (!name || !emailRe.test(email) || password.length < 8)
    return res.status(400).json({ error: 'A name, a valid email and a password of 8+ characters are required' });

  const { data, error } = await authClient.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) return res.status(error.status || 400).json({ error: error.message });
  if (!data.session) {
    return res.status(202).json({ needsEmailConfirmation: true, message: 'Check your email to confirm your account, then sign in.' });
  }
  const profile = await ensureProfile(data.user);
  res.status(201).json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: publicUser(profile),
  });
}));

app.post('/api/auth/login', api(async (req, res) => {
  const email = text(req.body?.email, 120).toLowerCase();
  const { data, error } = await authClient.auth.signInWithPassword({
    email,
    password: String(req.body?.password ?? ''),
  });
  if (error || !data.session) return res.status(401).json({ error: 'Invalid email or password' });
  const profile = await ensureProfile(data.user);
  res.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: publicUser(profile),
  });
}));

app.post('/api/auth/refresh', api(async (req, res) => {
  const refreshToken = String(req.body?.refreshToken ?? '');
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required' });
  const { data, error } = await authClient.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  res.json({ token: data.session.access_token, refreshToken: data.session.refresh_token });
}));

app.get('/api/auth/me', auth, api(async (req, res) => {
  const profile = await findProfile(req.userId);
  profile ? res.json(publicUser(profile)) : res.status(404).json({ error: 'User not found' });
}));

app.post('/api/auth/forgot', limit(5, 15 * 60 * 1000), api(async (req, res) => {
  const email = text(req.body?.email, 120).toLowerCase();
  if (!emailRe.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
  const { error } = await authClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${APP_URL.replace(/\/$/, '')}/reset-password`,
  });
  if (error) return res.status(error.status || 400).json({ error: error.message });
  res.json({ message: 'If that email is registered, a password reset link has been sent.' });
}));

app.post('/api/auth/reset-password', auth, api(async (req, res) => {
  const password = String(req.body?.password ?? '');
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  const { error } = await db.auth.admin.updateUserById(req.userId, { password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
}));

app.get('/api/admin/users', auth, requireAdmin, api(async (_req, res) => {
  const profiles = failIfError(await db.from('profiles')
    .select('id, name, email, is_admin, created_at')
    .order('created_at', { ascending: false }));
  const users = await Promise.all(profiles.map(async (profile) => {
    const [income, expenses] = await Promise.all([
      db.from('income').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
      db.from('expenses').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
    ]);
    if (income.error) throw income.error;
    if (expenses.error) throw expenses.error;
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      isAdmin: profile.is_admin,
      createdAt: profile.created_at,
      incomeCount: income.count,
      expenseCount: expenses.count,
    };
  }));
  res.json(users);
}));

app.delete('/api/admin/users/:id', auth, requireAdmin, api(async (req, res) => {
  const id = req.params.id;
  if (id === req.userId) return res.status(400).json({ error: 'You cannot delete your own account' });
  const profile = await findProfile(id);
  if (!profile) return res.status(404).json({ error: 'User not found' });
  if (profile.is_admin) return res.status(403).json({ error: 'Admin accounts cannot be deleted here' });
  const { error } = await db.auth.admin.deleteUser(id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
}));

app.get('/api/admin/overview', auth, requireAdmin, api(async (_req, res) => {
  const [users, income, expenses, feedback] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('income').select('id', { count: 'exact', head: true }),
    db.from('expenses').select('id', { count: 'exact', head: true }),
    db.from('feedback').select('id', { count: 'exact', head: true }),
  ]);
  for (const result of [users, income, expenses, feedback]) {
    if (result.error) throw result.error;
  }
  res.json({
    users: users.count,
    incomeEntries: income.count,
    expenses: expenses.count,
    feedback: feedback.count,
  });
}));

app.get('/api/admin/feedback', auth, requireAdmin, api(async (_req, res) => {
  const messages = failIfError(await db.from('feedback')
    .select('id, name, email, message, created_at')
    .order('created_at', { ascending: false })
    .limit(100));
  res.json(messages);
}));

app.get('/api/income', auth, api(async (req, res) => {
  const rows = failIfError(await db.from('income')
    .select('id, amount, source, frequency, created_at')
    .eq('user_id', req.userId)
    .order('id', { ascending: false }));
  res.json(rows);
}));

app.post('/api/income', auth, api(async (req, res) => {
  const amount = money(req.body?.amount);
  const source = text(req.body?.source, 100);
  const frequency = req.body?.frequency;
  if (amount === null || !source || !['weekly', 'monthly'].includes(frequency))
    return res.status(400).json({ error: 'Amount, source and frequency (weekly/monthly) are required' });
  const row = failIfError(await db.from('income')
    .insert({ user_id: req.userId, amount, source, frequency })
    .select('id, amount, source, frequency, created_at')
    .single());
  res.status(201).json(row);
}));

app.delete('/api/income/:id', auth, api(async (req, res) => {
  const { data, error } = await db.from('income').delete()
    .eq('id', req.params.id).eq('user_id', req.userId).select('id').maybeSingle();
  if (error) throw error;
  data ? res.status(204).end() : res.status(404).json({ error: 'Not found' });
}));

const toExpense = (row) => ({
  id: row.id,
  type: 'expense',
  description: row.description,
  amount: row.amount,
  category: row.category,
  date: row.created_at.slice(0, 10),
});

function parseExpense(body = {}) {
  const amount = money(body.amount);
  const category = text(body.category, 60);
  if (amount === null || !category) return null;
  const date = typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
    ? `${body.date}T00:00:00.000Z`
    : new Date().toISOString();
  return { amount, category, description: text(body.description, 200), created_at: date };
}

app.get('/api/expenses', auth, api(async (req, res) => {
  const rows = failIfError(await db.from('expenses')
    .select('id, amount, category, description, created_at')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false }));
  res.json(rows.map(toExpense));
}));

app.post('/api/expenses', auth, api(async (req, res) => {
  const expense = parseExpense(req.body);
  if (!expense) return res.status(400).json({ error: 'A positive amount and a category are required' });
  const row = failIfError(await db.from('expenses')
    .insert({ ...expense, user_id: req.userId })
    .select('id, amount, category, description, created_at')
    .single());
  res.status(201).json(toExpense(row));
}));

app.put('/api/expenses/:id', auth, api(async (req, res) => {
  const expense = parseExpense(req.body);
  if (!expense) return res.status(400).json({ error: 'Invalid expense' });
  const { data, error } = await db.from('expenses').update(expense)
    .eq('id', req.params.id).eq('user_id', req.userId)
    .select('id, amount, category, description, created_at').maybeSingle();
  if (error) throw error;
  data ? res.json(toExpense(data)) : res.status(404).json({ error: 'Not found' });
}));

app.delete('/api/expenses/:id', auth, api(async (req, res) => {
  const { data, error } = await db.from('expenses').delete()
    .eq('id', req.params.id).eq('user_id', req.userId).select('id').maybeSingle();
  if (error) throw error;
  data ? res.status(204).end() : res.status(404).json({ error: 'Not found' });
}));

app.delete('/api/expenses', auth, api(async (req, res) => {
  const { error } = await db.from('expenses').delete().eq('user_id', req.userId);
  if (error) throw error;
  res.status(204).end();
}));

app.get('/api/summary', auth, api(async (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 1).toISOString();
  const [income, expenses] = await Promise.all([
    db.from('income').select('amount, frequency').eq('user_id', req.userId),
    db.from('expenses').select('amount').eq('user_id', req.userId).gte('created_at', start).lt('created_at', end),
  ]);
  if (income.error) throw income.error;
  if (expenses.error) throw expenses.error;
  const monthlyIncome = income.data.reduce((sum, row) =>
    sum + Number(row.amount) * (row.frequency === 'weekly' ? daysInMonth / 7 : 1), 0);
  const monthlyExpenses = expenses.data.reduce((sum, row) => sum + Number(row.amount), 0);
  res.json({
    monthlyIncome,
    monthlyExpenses,
    savings: monthlyIncome - monthlyExpenses,
    dailySafe: (monthlyIncome - monthlyExpenses) / daysInMonth,
    daysInMonth,
    daysElapsed: now.getDate(),
  });
}));

app.post('/api/feedback', limit(5, 10 * 60 * 1000), api(async (req, res) => {
  const name = text(req.body?.name, 80);
  const email = text(req.body?.email, 120);
  const message = text(req.body?.message, 2000);
  if (!name || !emailRe.test(email) || message.length < 5)
    return res.status(400).json({ error: 'Name, a valid email and a message (5+ characters) are required' });
  let userId = null;
  const token = bearerToken(req);
  if (token) {
    const { data } = await authClient.auth.getUser(token);
    if (data.user) userId = data.user.id;
  }
  const { error } = await db.from('feedback').insert({ user_id: userId, name, email, message });
  if (error) throw error;
  res.status(201).json({ ok: true });
}));

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'Finity' }));
app.use((error, req, res, _next) => {
  console.error('[api]', req.method, req.path, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
  if (['42P01', 'PGRST205'].includes(error.code)) {
    return res.status(503).json({ error: 'Supabase tables are missing. Run server/schema.sql in the Supabase SQL Editor.' });
  }
  res.status(500).json({ error: 'Server error. Check the API terminal for details.' });
});

async function configureAdmin() {
  if (!ADMIN_EMAIL) {
    if (ADMIN_PASSWORD) console.warn('ADMIN_PASSWORD is set but ADMIN_EMAIL is empty; skipping admin provisioning.');
    return;
  }

  let authUser = null;
  for (let page = 1; !authUser; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    authUser = data.users.find((user) => user.email?.toLowerCase() === ADMIN_EMAIL) || null;
    if (authUser || data.users.length < 1000) break;
  }

  if (!authUser && ADMIN_PASSWORD) {
    const { data, error } = await db.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: ADMIN_NAME },
    });
    if (error) throw error;
    authUser = data.user;
  }

  if (!authUser) {
    console.warn(`ADMIN_EMAIL "${ADMIN_EMAIL}" does not match an existing Supabase account. Set ADMIN_PASSWORD to provision it.`);
    return;
  }

  await ensureProfile(authUser);
  const { error } = await db.from('profiles').update({ is_admin: true }).eq('id', authUser.id);
  if (error) throw error;
  console.log(`Admin access enabled for ${ADMIN_EMAIL}.`);
}

await configureAdmin();

app.listen(PORT, () => console.log(`Finity API running on http://localhost:${PORT}`));
