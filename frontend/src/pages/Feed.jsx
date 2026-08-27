import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PlanCard from '../components/PlanCard';
import Spinner from '../components/Spinner';

export default function Feed() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [types, setTypes] = useState([]);
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set('q', q.trim());
        if (type && type !== 'all') params.set('type', type);
        const data = await api.get(`/plans?${params.toString()}`);
        if (!cancelled) setPlans(data.plans);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q, type]);

  useEffect(() => {
    api.get('/plans/types').then((d) => setTypes(d.types)).catch(() => {});
  }, []);

  async function handleToggleSave() {
    await refreshUser();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f1c] font-display">Sustainable production feed</h1>
          <p className="text-sm text-[#5f655f] mt-1">
            Real plans optimized for lower CO₂, water, energy — and more recycled material.
          </p>
        </div>
        {user && (
          <Link to="/plans/new" className="btn-primary">
            + Share a plan
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search plans…"
          className="input flex-1"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input bg-white"
        >
          <option value="all">All products</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading && <Spinner />}

      {!loading && plans.length === 0 && (
        <div className="text-center py-16 text-[#5f655f]">
          <span className="inline-grid place-items-center w-20 h-20 rounded-full neu-raised mb-3">
            <Search className="w-8 h-8 text-[#059669]" />
          </span>
          <p className="font-semibold">No plans match your search.</p>
{user && user.role !== 'admin' && (
            <Link to="/plans/new" className="inline-block mt-3 text-[#059669] hover:text-[#1c1f1c] font-bold text-sm">
              Share the first one →
            </Link>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {plans.map((p) => (
          <PlanCard key={p.id} plan={p} onToggleSave={handleToggleSave} />
        ))}
      </div>
    </div>
  );
}