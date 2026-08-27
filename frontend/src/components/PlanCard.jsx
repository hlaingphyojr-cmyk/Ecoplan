import { Link } from 'react-router-dom';
import { Bookmark, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { METRIC_META, savingsSummary } from '../utils/metrics';

function MiniStat({ icon: Icon, label, value, tint }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className={`grid place-items-center w-7 h-7 rounded-lg ${tint}`}>
        <Icon className="w-3.5 h-3.5 text-[#1c1f1c]" />
      </span>
      <span className="text-[#5f655f]">{label}</span>
      <span className="font-bold text-[#059669]">{value}</span>
    </div>
  );
}

export default function PlanCard({ plan, onToggleSave }) {
  const { user } = useAuth();
  const isSaved = user?.savedPlans?.some((id) => id.toString() === plan.id) ?? false;
  const s = savingsSummary(plan);

  async function toggleSave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (isSaved) {
      await api.del(`/plans/${plan.id}/save`);
    } else {
      await api.post(`/plans/${plan.id}/save`);
    }
    onToggleSave?.(plan.id, !isSaved);
  }

  return (
    <div className="card p-5 transition-all hover:border-[#c9c9c4]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="chip !bg-[#e6f4ec] !text-[#047857] !border-transparent">{plan.productType}</span>
            {plan.commentsCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-[#5f655f] font-semibold">
                <MessageCircle size={13} className="inline-block" />
                {plan.commentsCount}
              </span>
            )}
          </div>
          <Link to={`/plans/${plan.id}`}>
            <h3 className="mt-2 text-lg font-bold text-[#1c1f1c] hover:text-[#059669] leading-snug font-display">
              {plan.title}
            </h3>
          </Link>
          <p className="mt-1 text-sm text-[#5f655f] line-clamp-2">{plan.description}</p>
        </div>
        <button
          onClick={toggleSave}
          title={isSaved ? 'Remove from saved' : 'Save plan'}
          className={`shrink-0 w-10 h-10 grid place-items-center rounded-xl transition-all ${
            isSaved
              ? 'bg-[#e6f4ec] text-[#047857]'
              : 'text-[#5f655f] neu-raised hover:text-[#059669]'
          }`}
        >
          <Bookmark size={18} className={isSaved ? 'fill-current' : ''} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        <MiniStat icon={METRIC_META.co2.icon} label="CO₂" value={`−${s.co2}%`} tint="bg-[#f4d9a8]" />
        <MiniStat icon={METRIC_META.water.icon} label="Water" value={`−${s.water}%`} tint="bg-[#b9ddf0]" />
        <MiniStat icon={METRIC_META.electricity.icon} label="Energy" value={`−${s.electricity}%`} tint="bg-[#f0c4c4]" />
        <MiniStat icon={METRIC_META.material.icon} label="Recycled" value={`${s.recycled}%`} tint="bg-[#cfe8b8]" />
      </div>

      <div className="mt-4 pt-3 border-t border-[#e4e4e0] flex items-center justify-between text-sm">
        <span className="text-[#5f655f]">
          by <span className="text-[#1c1f1c] font-bold">{plan.author?.name || 'unknown'}</span>
        </span>
        <Link
          to={`/plans/${plan.id}`}
          className="text-[#059669] hover:text-[#1c1f1c] font-bold"
        >
          View plan →
        </Link>
      </div>
    </div>
  );
}