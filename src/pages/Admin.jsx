import { useCallback, useEffect, useState } from 'react';
import { MessageSquareText, Search, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Admin() {
  const { adminRequest, user, showToast } = useApp();
  const [users, setUsers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [userRows, stats, messages] = await Promise.all([
        adminRequest('/admin/users'),
        adminRequest('/admin/overview'),
        adminRequest('/admin/feedback'),
      ]);
      setUsers(userRows);
      setOverview(stats);
      setFeedback(messages);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [adminRequest]);

  useEffect(() => { loadAdminData(); }, [loadAdminData]);

  const filteredUsers = users.filter((entry) =>
    `${entry.name} ${entry.email}`.toLowerCase().includes(search.trim().toLowerCase()));

  const deleteUser = async (target) => {
    if (!window.confirm(`Permanently delete ${target.name}'s account and all their finance data?`)) return;
    setDeletingId(target.id);
    try {
      await adminRequest(`/admin/users/${target.id}`, { method: 'DELETE' });
      setUsers((current) => current.filter((entry) => entry.id !== target.id));
      showToast('User and associated data deleted');
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-5 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
            <ShieldCheck className="w-4 h-4" /> Admin
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">User management</h1>
          <p className="mt-2 text-sm text-slate-500">Signed in as {user.email}</p>
        </div>
      </div>

      {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[
          ['Users', overview?.users, Users],
          ['Income entries', overview?.incomeEntries, ShieldCheck],
          ['Expenses', overview?.expenses, Trash2],
          ['Feedback', overview?.feedback, MessageSquareText],
        ].map(([label, count, Icon]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500">{label}</span>
              <Icon className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="mt-3 text-2xl font-extrabold text-slate-900">{loading ? '—' : count}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900">Users</h2>
            <p className="mt-1 text-xs text-slate-500">{users.length} accounts</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or email"
              aria-label="Search users by name or email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </label>
        </div>
        {loading ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">No user accounts found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">User</th>
                  <th className="px-5 py-4 font-semibold">Joined</th>
                  <th className="px-5 py-4 font-semibold">Income entries</th>
                  <th className="px-5 py-4 font-semibold">Expenses</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((entry) => (
                  <tr key={entry.id} className="text-slate-700">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{entry.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{entry.email}</p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">{new Date(entry.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">{entry.incomeCount}</td>
                    <td className="px-5 py-4">{entry.expenseCount}</td>
                    <td className="px-5 py-4">{entry.isAdmin ? 'Admin' : 'User'}</td>
                    <td className="px-5 py-4 text-right">
                      {!entry.isAdmin && (
                        <button
                          type="button"
                          disabled={deletingId === entry.id}
                          onClick={() => deleteUser(entry)}
                          aria-label={`Delete ${entry.name}`}
                          title="Delete user and their data"
                          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <h2 className="font-bold text-slate-900">Recent feedback</h2>
          <p className="mt-1 text-xs text-slate-500">Latest 100 messages from users and visitors</p>
        </div>
        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">Loading feedback...</p>
        ) : feedback.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">No feedback submitted yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {feedback.map((message) => (
              <li key={message.id} className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{message.name}</p>
                    <a href={`mailto:${message.email}`} className="text-xs text-indigo-600 hover:underline">{message.email}</a>
                  </div>
                  <time className="text-xs text-slate-400">{new Date(message.created_at).toLocaleString()}</time>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-600">{message.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
