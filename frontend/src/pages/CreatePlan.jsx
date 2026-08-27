import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import Spinner from '../components/Spinner';

const emptyMetrics = () => ({ co2: '', water: '', electricity: '', material: '' });

export default function CreatePlan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [productType, setProductType] = useState('');
  const [description, setDescription] = useState('');
  const [materials, setMaterials] = useState('');
  const [steps, setSteps] = useState('');
  const [baseline, setBaseline] = useState(emptyMetrics());
  const [optimized, setOptimized] = useState(emptyMetrics());

  const [loadingInit, setLoadingInit] = useState(isEdit);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const data = await api.get(`/plans/${id}`);
        const p = data.plan;
        setTitle(p.title);
        setProductType(p.productType);
        setDescription(p.description);
        setMaterials(p.materials.join(', '));
        setSteps(p.steps.join('\n'));
        setBaseline({ ...p.baseline });
        setOptimized({ ...p.optimized });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingInit(false);
      }
    })();
  }, [id, isEdit]);

  function setMetric(side, key, value) {
    const setter = side === 'baseline' ? setBaseline : setOptimized;
    setter((m) => ({ ...m, [key]: value }));
  }

  function fillFromAI(plan) {
    setTitle(plan.title);
    setProductType(plan.productType);
    setDescription(plan.description);
    setMaterials(plan.materials.join(', '));
    setSteps(plan.steps.join('\n'));
    setBaseline({ ...plan.baseline });
    setOptimized({ ...plan.optimized });
  }

  async function generateWithAI() {
    if (!productType.trim()) {
      setError('Enter a product type first (e.g. "shoes", "tyres", "cans").');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const data = await api.post('/ai/optimize', {
        productType: productType.trim(),
        materials: materials.split(',').map((s) => s.trim()).filter(Boolean),
      });
      fillFromAI(data.plan);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  function buildPayload() {
    return {
      title,
      productType,
      description,
      materials: materials.split(',').map((s) => s.trim()).filter(Boolean),
      steps: steps.split('\n').map((s) => s.trim()).filter(Boolean),
      baseline: {
        co2: Number(baseline.co2),
        water: Number(baseline.water),
        electricity: Number(baseline.electricity),
        material: Number(baseline.material),
      },
      optimized: {
        co2: Number(optimized.co2),
        water: Number(optimized.water),
        electricity: Number(optimized.electricity),
        material: Number(optimized.material),
      },
    };
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = buildPayload();
      if (isEdit) await api.put(`/plans/${id}`, payload);
      else await api.post('/plans', payload);
      navigate(isEdit ? `/plans/${id}` : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInit) return <Spinner />;

  const numInput = 'input w-full';

  function metricGrid(side, label) {
    return (
      <div>
        <h3 className="font-semibold text-stone-700 text-sm mb-2">{label}</h3>
        <div className="grid grid-cols-2 gap-3">
          {['co2', 'water', 'electricity', 'material'].map((k) => (
            <div key={k}>
              <label className="block text-xs text-[#5f655f] mb-1 capitalize">
                {k === 'material'
                  ? side === 'baseline'
                    ? 'Virgin material (%)'
                    : 'Recycled material (%)'
                  : `${k}${side === 'baseline' ? ' (conventional)' : ' (optimized)'}`}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={baseline[k]}
                onChange={(e) => setMetric('baseline', k, e.target.value)}
                placeholder="0"
                className={numInput}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1 text-[#1c1f1c] font-display">{isEdit ? 'Edit plan' : 'Share a production plan'}</h1>
      <p className="text-sm text-[#5f655f] mb-6">
        Describe how you cut emissions, saved water and energy, or increased recycled content.
      </p>

      <form onSubmit={submit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[#1c1f1c] mb-1">Product type</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="shoes, tyres, cans, …"
              className="input flex-1"
            />
            <button
              type="button"
              onClick={generateWithAI}
              disabled={generating}
              className="btn-dark"
            >
              {generating ? (
                'Thinking…'
              ) : (
                <>
                  <Sparkles size={16} className="inline-block align-text-bottom" /> Generate with AI
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-[#5f655f] mt-1">
            The AI drafts a full optimized plan with steps and metrics you can tweak.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1c1f1c] mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Closed-loop recycled rubber tyre"
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1c1f1c] mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            placeholder="Summarize the optimized approach…"
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1c1f1c] mb-1">Materials (comma separated)</label>
          <input
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            placeholder="recycled rubber, silica, bio-based additives"
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1c1f1c] mb-1">Production steps (one per line)</label>
          <textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            rows={4}
            placeholder={'Collect end-of-life tyres\nBlend recycled crumb…'}
            className="input w-full"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {metricGrid('baseline', 'Conventional process')}
          {metricGrid('optimized', 'Your optimized process')}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button disabled={submitting} className="btn-primary w-full !py-2.5">
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Publish plan'}
        </button>
      </form>
    </div>
  );
}