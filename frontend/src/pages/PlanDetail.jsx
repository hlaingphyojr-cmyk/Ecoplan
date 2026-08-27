import { Bookmark, Bot, Leaf } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import MetricBar from '../components/MetricBar';
import CommentSection from '../components/CommentSection';
import AIChat from '../components/AIChat';
import Spinner from '../components/Spinner';

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function PlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [plan, setPlan] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.get(`/plans/${id}`);
        if (!cancelled) {
          setPlan(data.plan);
          setComments(data.comments);
          setSaved(
            user?.savedPlans?.some((p) => p?.toString?.() === data.plan.id) ?? false
          );
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleSave() {
    if (!user) return;
    if (saved) await api.del(`/plans/${id}/save`);
    else await api.post(`/plans/${id}/save`);
    setSaved(!saved);
    await refreshUser();
  }

  async function removePlan() {
    if (!window.confirm('Delete this plan? This cannot be undone.')) return;
    await api.del(`/plans/${id}`);
    navigate('/');
  }

  if (loading) return <Spinner />;
  if (error)
    return (
      <div className="text-center py-16 text-[#5f655f]">
        <span className="inline-grid place-items-center w-20 h-20 rounded-full neu-raised mb-3">
          <Leaf className="w-8 h-8 text-[#059669]" />
        </span>
        <p className="font-semibold">{error}</p>
        <Link to="/" className="inline-block mt-3 text-[#059669] hover:text-[#1c1f1c] font-bold text-sm">
          Back to feed
        </Link>
      </div>
    );

  const isOwner = user && plan.author?.id === user.id;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-bold text-[#059669] hover:text-[#1c1f1c]">
        ← Back to feed
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="chip !bg-[#e6f4ec] !text-[#047857] !border-transparent">{plan.productType}</span>
        {isOwner && <span className="text-xs text-[#5f655f] font-semibold">Your plan</span>}
      </div>

      <h1 className="mt-2 text-3xl font-bold text-[#1c1f1c] font-display">{plan.title}</h1>
      <p className="mt-1 text-sm text-[#5f655f]">
        by <span className="font-bold text-[#1c1f1c]">{plan.author?.name}</span> · {timeAgo(plan.createdAt)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={toggleSave} className={saved ? 'btn-primary' : 'btn-ghost'}>
          <Bookmark size={16} className={`inline-block align-text-bottom ${saved ? 'fill-current' : ''}`} />
          {saved ? ' Saved' : ' Save plan'}
        </button>
        <button onClick={() => setShowAI((v) => !v)} className={showAI ? 'btn-dark' : 'btn-ghost'}>
          <Bot size={16} className="inline-block align-text-bottom" /> Ask AI about this plan
        </button>
        {isOwner && (
          <>
            <Link to={`/plans/${plan.id}/edit`} className="btn-ghost">
              Edit
            </Link>
            <button onClick={removePlan} className="btn-danger">
              Delete
            </button>
          </>
        )}
      </div>

      {showAI && (
        <div className="mt-4">
          <AIChat planId={plan.id} className="h-96" placeholder={`Ask about "${plan.title}"…`} />
        </div>
      )}

      <section className="mt-6 card p-6">
        <h2 className="font-bold text-[#1c1f1c] mb-2">Summary</h2>
        <p className="text-[#5f655f] leading-relaxed">{plan.description}</p>
      </section>

      <section className="mt-4 card p-6">
        <h2 className="font-bold text-[#1c1f1c] mb-4">Environmental impact vs. conventional</h2>
        <MetricBar plan={plan} />
      </section>

      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <section className="card p-6">
          <h2 className="font-bold text-[#1c1f1c] mb-3">Materials</h2>
          {plan.materials?.length ? (
            <div className="flex flex-wrap gap-2">
              {plan.materials.map((m, i) => (
                <span key={i} className="text-sm bg-[#f2f2f0] border border-[#e4e4e0] rounded-full px-3 py-1 font-semibold text-[#1c1f1c]">
                  {m}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#5f655f]">Not specified</p>
          )}
        </section>

        <section className="card p-6">
          <h2 className="font-bold text-[#1c1f1c] mb-3">Production steps</h2>
          {plan.steps?.length ? (
            <ol className="space-y-2">
              {plan.steps.map((s, i) => (
                <li key={i} className="text-sm text-[#5f655f] flex gap-2">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#f4d9a8] text-[#1c1f1c] grid place-items-center text-[10px] font-bold">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-[#5f655f]">Not specified</p>
          )}
        </section>
      </div>

      <section className="mt-4 bg-[#faf9f7] border border-[#e4e4e0] rounded-2xl p-6">
        <CommentSection planId={plan.id} initial={comments} />
      </section>
    </div>
  );
}