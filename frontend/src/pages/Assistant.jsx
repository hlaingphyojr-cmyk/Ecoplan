import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import AIChat from '../components/AIChat';
import { allMetricRows } from '../utils/metrics';

const suggested = ['shoes', 'tyres', 'beverage cans', 'electronics casing', 'plastic bottles'];

export default function Assistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [productType, setProductType] = useState('');
  const [constraints, setConstraints] = useState('');
  const [draft, setDraft] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  async function generate(e) {
    e.preventDefault();
    if (!productType.trim()) return;
    setGenerating(true);
    setError('');
    setDraft(null);
    try {
      const data = await api.post('/ai/optimize', {
        productType: productType.trim(),
        constraints: constraints.trim() || undefined,
      });
      setDraft(data.plan);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function publish() {
    setPublishing(true);
    setError('');
    try {
      const data = await api.post('/plans', draft);
      navigate(`/plans/${data.plan.id}`);
    } catch (err) {
      setError(err.message);
      setPublishing(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <section>
        <h1 className="text-2xl font-bold text-[#1c1f1c] font-display">AI Assistant</h1>
        <p className="text-sm text-[#5f655f] mt-1 mb-4">
          Chat with the AI about any production or sustainability question.
        </p>
        <AIChat className="h-[60vh] min-h-[360px]" />
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#1c1f1c] font-display">Generate an optimized plan</h2>
        <p className="text-sm text-[#5f655f] mt-1 mb-4">
          Describe a product and get a ready-to-publish eco-optimized plan.
        </p>

        <form onSubmit={generate} className="card p-5 space-y-3">
          <div>
            <label className="block text-sm font-semibold text-[#1c1f1c] mb-1">Product type</label>
            <input
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="e.g. sneakers, aluminium cans"
              className="input w-full"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggested.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setProductType(s)}
                  className="text-xs bg-[#f2f2f0] border border-[#e4e4e0] rounded-full px-2.5 py-1 font-semibold text-[#1c1f1c] hover:border-[#059669] hover:text-[#059669]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1c1f1c] mb-1">Constraints (optional)</label>
            <textarea
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              rows={2}
              placeholder="e.g. under $5/kg, 50k units/day, no virgin plastic"
              className="input w-full"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={!productType.trim() || generating}
            className="btn-dark w-full !py-2.5 disabled:opacity-40"
          >
            {generating ? (
              'Generating…'
            ) : (
              <>
                <Sparkles size={16} className="inline-block align-text-bottom" /> Generate plan
              </>
            )}
          </button>
        </form>

        {draft && (
          <div className="mt-4 bg-[#faf9f7] border border-[#e4e4e0] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="chip !bg-[#f4d9a8] !text-[#1c1f1c]">{draft.productType}</span>
              {user && (
                <button onClick={publish} disabled={publishing} className="btn-primary !py-1.5 !px-3">
                  {publishing ? 'Publishing…' : 'Publish this plan'}
                </button>
              )}
            </div>
            <h3 className="font-bold text-[#1c1f1c] font-display">{draft.title}</h3>
            <p className="text-sm text-[#5f655f] mt-1">{draft.description}</p>

            <div className="mt-3 space-y-1.5">
              {allMetricRows(draft).map((r) => (
                <div key={r.key} className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-[#5f655f] font-semibold">
                    <r.icon className="w-4 h-4" />
                    {r.label}
                  </span>
                  <span className="font-bold text-[#059669]">
                    {r.key === 'material'
                      ? `${r.optimized}% recycled`
                      : `${r.baseline} → ${r.optimized} (−${r.improvement}%)`}
                  </span>
                </div>
              ))}
            </div>

            {draft.steps?.length > 0 && (
              <ol className="mt-3 space-y-1">
                {draft.steps.map((s, i) => (
                  <li key={i} className="text-xs text-[#5f655f] flex gap-2">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#f4d9a8] text-[#1c1f1c] grid place-items-center text-[9px] font-bold">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            )}

            {!user && (
              <p className="text-xs text-[#5f655f] mt-3">
                Log in to publish this plan to the community.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}