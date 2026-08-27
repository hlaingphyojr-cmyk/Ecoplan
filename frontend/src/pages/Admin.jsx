import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  MessageSquare,
  Shield,
  Trash2,
  UserPlus,
  UserMinus,
  Users as UsersIcon,
  Bookmark,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

const tabs = [
  { key: 'overview', label: 'Overview', icon: Shield },
  { key: 'users', label: 'Users', icon: UsersIcon },
  { key: 'plans', label: 'Plans', icon: FileText },
  { key: 'comments', label: 'Comments', icon: MessageSquare },
];

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <span className={`grid place-items-center w-12 h-12 rounded-2xl ${tint}`}>
        <Icon className="w-5 h-5 text-[#1c1f1c]" />
      </span>
      <div>
        <div className="text-2xl font-bold text-[#1c1f1c] font-display">{value}</div>
        <div className="text-xs font-semibold text-[#5f655f]">{label}</div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [comments, setComments] = useState([]);
  const [userQ, setUserQ] = useState('');
  const [planQ, setPlanQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    const data = await api.get('/admin/stats');
    setStats(data);
  }, []);

  const loadUsers = useCallback(async () => {
    const data = await api.get(`/admin/users?q=${encodeURIComponent(userQ)}`);
    setUsers(data.users);
  }, [userQ]);

  const loadPlans = useCallback(async () => {
    const data = await api.get(`/admin/plans?q=${encodeURIComponent(planQ)}`);
    setPlans(data.plans);
  }, [planQ]);

  const loadComments = useCallback(async () => {
    const data = await api.get('/admin/comments');
    setComments(data.comments);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetcher =
      tab === 'overview' ? loadStats : tab === 'users' ? loadUsers : tab === 'plans' ? loadPlans : loadComments;
    fetcher()
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, loadStats, loadUsers, loadPlans, loadComments]);

  function changeTab(key) {
    setError('');
    setLoading(true);
    setTab(key);
  }

  async function runAction(fn) {
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleRole(u) {
    await runAction(async () => {
      const next = u.role === 'admin' ? 'user' : 'admin';
      await api.patch(`/admin/users/${u.id}/role`, { role: next });
      await loadUsers();
      await loadStats();
    });
  }

  async function deleteUser(u) {
    if (!window.confirm(`Delete ${u.name} (${u.email})? Their plans and comments will also be removed.`)) return;
    await runAction(async () => {
      await api.del(`/admin/users/${u.id}`);
      await loadUsers();
      await loadStats();
    });
  }

  async function deletePlan(p) {
    if (!window.confirm(`Delete plan "${p.title}"? This cannot be undone.`)) return;
    await runAction(async () => {
      await api.del(`/admin/plans/${p.id}`);
      await loadPlans();
      await loadStats();
    });
  }

  async function deleteComment(c) {
    if (!window.confirm(`Delete comment by ${c.author?.name}? Replies will also be removed.`)) return;
    await runAction(async () => {
      await api.del(`/admin/comments/${c.id}`);
      await loadComments();
      await loadStats();
    });
  }

  const tabBtn = (t) =>
    `rounded-xl px-4 py-2 text-sm font-semibold transition-all ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f1c] font-display">Admin dashboard</h1>
          <p className="text-sm text-[#5f655f] mt-1">Overview and moderation for the EcoPlan community.</p>
        </div>
        <span className="chip !bg-[#f4d9a8] !text-[#1c1f1c]">
          <Shield size={12} /> Signed in as admin
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => changeTab(t.key)} className={tabBtn(t)}>
            <t.icon size={15} className="inline-block align-text-bottom" /> {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading && <Spinner />}

      {!loading && tab === 'overview' && stats && (
        <div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={UsersIcon} label="Users" value={stats.stats.totalUsers} tint="bg-[#b9ddf0]" />
            <StatCard icon={Shield} label="Admins" value={stats.stats.totalAdmins} tint="bg-[#f4d9a8]" />
            <StatCard icon={FileText} label="Plans" value={stats.stats.totalPlans} tint="bg-[#cfe8b8]" />
            <StatCard icon={MessageSquare} label="Comments" value={stats.stats.totalComments} tint="bg-[#f0c4c4]" />
            <StatCard icon={Bookmark} label="Saves" value={stats.stats.totalSaves} tint="bg-[#e6f4ec]" />
          </div>

          {stats.plansByType?.length > 0 && (
            <section className="card p-5 mt-4">
              <h2 className="font-bold text-[#1c1f1c] mb-3">Plans by product type</h2>
              <div className="flex flex-wrap gap-2">
                {stats.plansByType.map((t) => (
                  <span key={t._id} className="chip !bg-[#e6f4ec] !text-[#047857]">
                    {t._id} · {t.count}
                  </span>
                ))}
              </div>
            </section>
          )}

          <div className="mt-4 grid lg:grid-cols-3 gap-4">
            <section className="card p-5">
              <h2 className="font-bold text-[#1c1f1c] mb-3">Recent users</h2>
              <ul className="space-y-2">
                {stats.recentUsers.map((u) => (
                  <li key={u.id} className="text-sm flex items-center gap-2">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-[#b9ddf0] grid place-items-center text-xs font-bold text-[#1c1f1c]">
                      {u.name?.[0]?.toUpperCase() || '?'}
                    </span>
                    <span className="font-semibold text-[#1c1f1c]">{u.name}</span>
                    <span className="text-[#5f655f]">{u.email}</span>
                    <span className="ml-auto text-xs text-[#5f655f]">{timeAgo(u.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card p-5">
              <h2 className="font-bold text-[#1c1f1c] mb-3">Recent plans</h2>
              <ul className="space-y-2">
                {stats.recentPlans.map((p) => (
                  <li key={p.id} className="text-sm flex items-center gap-2">
                    <FileText size={14} className="shrink-0 text-[#5f655f]" />
                    <Link to={`/plans/${p.id}`} className="font-semibold text-[#1c1f1c] hover:text-[#059669] truncate">
                      {p.title}
                    </Link>
                    <span className="ml-auto text-xs text-[#5f655f]">{timeAgo(p.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card p-5">
              <h2 className="font-bold text-[#1c1f1c] mb-3">Recent comments</h2>
              <ul className="space-y-2">
                {stats.recentComments.map((c) => (
                  <li key={c.id} className="text-sm">
                    <span className="font-semibold text-[#1c1f1c]">{c.author?.name}</span>
                    <span className="text-[#5f655f]"> on </span>
                    <span className="font-medium text-[#1c1f1c]">{c.plan?.title}</span>
                    <p className="text-[#5f655f] text-xs line-clamp-1">{c.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}

      {!loading && tab === 'users' && (
        <div>
          <input value={userQ} onChange={(e) => setUserQ(e.target.value)} placeholder="Search users by name or email…" className="input w-full sm:w-96 mb-4" />
          <div className="card overflow-hidden">
            <ul className="divide-y divide-[#e4e4e0]">
              {users.length === 0 && <li className="p-5 text-sm text-[#5f655f]">No users found.</li>}
              {users.map((u) => {
                const isSelf = u.id === user?.id;
                return (
                  <li key={u.id} className="flex flex-wrap items-center gap-3 p-4">
                    <span className="shrink-0 w-9 h-9 rounded-full bg-[#b9ddf0] grid place-items-center font-bold text-[#1c1f1c]">
                      {u.name?.[0]?.toUpperCase() || '?'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1c1f1c]">{u.name}</span>
                        <span className={`chip ${u.role === 'admin' ? '!bg-[#f4d9a8] !text-[#1c1f1c]' : '!bg-[#e6f4ec] !text-[#047857]'}`}>
                          {u.role}
                        </span>
                        {isSelf && <span className="text-xs text-[#5f655f]">(you)</span>}
                      </div>
                      <div className="text-xs text-[#5f655f]">
                        {u.email} · joined {timeAgo(u.createdAt)}
                      </div>
                    </div>
                    <div className="text-xs text-[#5f655f] font-semibold">
                      {u.planCount} plans · {u.commentCount} comments · {u.saveCount} saved
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleRole(u)}
                        disabled={isSelf}
                        title={isSelf ? 'Cannot change your own role' : ''}
                        className="btn-ghost !py-1.5 !px-3 disabled:opacity-40"
                      >
                        {u.role === 'admin' ? (
                          <>
                            <UserMinus size={14} /> Demote
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} /> Promote
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => deleteUser(u)}
                        disabled={isSelf}
                        title={isSelf ? 'Cannot delete your own account' : ''}
                        className="btn-danger !py-1.5 !px-3 disabled:opacity-40"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {!loading && tab === 'plans' && (
        <div>
          <input value={planQ} onChange={(e) => setPlanQ(e.target.value)} placeholder="Search plans…" className="input w-full sm:w-96 mb-4" />
          <div className="grid sm:grid-cols-2 gap-4">
            {plans.length === 0 && <p className="text-sm text-[#5f655f]">No plans found.</p>}
            {plans.map((p) => (
              <div key={p.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="chip !bg-[#e6f4ec] !text-[#047857]">{p.productType}</span>
                    <Link to={`/plans/${p.id}`} className="block mt-2 font-bold text-[#1c1f1c] hover:text-[#059669]">
                      {p.title}
                    </Link>
                    <p className="text-xs text-[#5f655f] mt-1 line-clamp-2">{p.description}</p>
                    <p className="text-xs text-[#5f655f] mt-2">
                      by <span className="font-semibold text-[#1c1f1c]">{p.author?.name}</span> · {timeAgo(p.createdAt)} · {p.commentsCount} comments
                    </p>
                  </div>
                  <button onClick={() => deletePlan(p)} className="btn-danger !py-1.5 !px-3 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && tab === 'comments' && (
        <div>
          <div className="card overflow-hidden">
            <ul className="divide-y divide-[#e4e4e0]">
              {comments.length === 0 && <li className="p-5 text-sm text-[#5f655f]">No comments found.</li>}
              {comments.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 p-4">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-[#f0c4c4] grid place-items-center font-bold text-[#1c1f1c]">
                    {c.author?.name?.[0]?.toUpperCase() || '?'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">
                      <span className="font-bold text-[#1c1f1c]">{c.author?.name}</span>
                      <span className="text-[#5f655f]"> on </span>
                      {c.plan ? (
                        <Link to={`/plans/${c.plan.id || c.plan._id}`} className="font-semibold text-[#059669] hover:text-[#1c1f1c]">
                          {c.plan.title}
                        </Link>
                      ) : (
                        <span className="text-[#5f655f]">deleted plan</span>
                      )}
                      <span className="text-[#5f655f]"> · {timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-[#5f655f] line-clamp-2">{c.text}</p>
                  </div>
                  <button onClick={() => deleteComment(c)} className="btn-danger !py-1.5 !px-3">
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}