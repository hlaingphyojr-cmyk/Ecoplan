import { Bookmark, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PlanCard from '../components/PlanCard';
import Spinner from '../components/Spinner';

export default function MyPlans() {
  const { refreshUser } = useAuth();
  const [tab, setTab] = useState('mine');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const path = tab === 'saved' ? '/plans/saved' : '/plans/mine';
        const data = await api.get(path);
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
  }, [tab]);

  async function handleToggleSave(planId, nowSaved) {
    if (tab === 'saved' && !nowSaved) {
      setPlans((ps) => ps.filter((p) => p.id !== planId));
    }
    await refreshUser();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-[#1c1f1c] font-display">My plans</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('mine')}
          className={tab === 'mine' ? 'btn-primary' : 'btn-ghost'}
        >
          Shared by me
        </button>
        <button
          onClick={() => setTab('saved')}
          className={tab === 'saved' ? 'btn-primary' : 'btn-ghost'}
        >
          <Bookmark size={16} className="inline-block fill-current align-text-bottom" /> Saved
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading && <Spinner />}

      {!loading && plans.length === 0 && (
        <div className="text-center py-16 text-[#5f655f]">
          {tab === 'saved' ? (
            <span className="inline-grid place-items-center w-20 h-20 rounded-full neu-raised mb-3">
              <Bookmark className="w-8 h-8 text-[#059669] fill-current" />
            </span>
          ) : (
            <span className="inline-grid place-items-center w-20 h-20 rounded-full neu-raised mb-3">
              <FileText className="w-8 h-8 text-[#059669]" />
            </span>
          )}
          <p className="font-semibold">{tab === 'saved' ? 'No saved plans yet.' : "You haven't shared any plans yet."}</p>
          {tab === 'mine' && (
            <Link to="/plans/new" className="inline-block mt-3 text-[#059669] hover:text-[#1c1f1c] font-bold text-sm">
              Share your first plan →
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