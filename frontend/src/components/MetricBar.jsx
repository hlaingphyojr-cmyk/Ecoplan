import { metricRow } from '../utils/metrics';

const fillColors = {
  co2: 'bg-[#f4d9a8]',
  water: 'bg-[#b9ddf0]',
  electricity: 'bg-[#f0c4c4]',
  material: 'bg-[#cfe8b8]',
};

export default function MetricBar({ plan }) {
  const rows = ['co2', 'water', 'electricity', 'material'].map((k) =>
    metricRow(k, plan.baseline[k], plan.optimized[k])
  );

  return (
    <div className="space-y-5">
      {rows.map((r) => {
        const pct = r.improvement;
        return (
          <div key={r.key}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-[#1c1f1c]">
                <r.icon className="w-4 h-4 text-[#5f655f]" />
                {r.label}
              </span>
              <span className="text-sm font-bold text-[#059669]">
                {r.key === 'material' ? `${r.optimized}% recycled` : `−${pct}%`}
              </span>
            </div>

            {r.key === 'material' ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-4 rounded-full bg-[#ececea] overflow-hidden">
                  <div
                    className={`h-full ${fillColors[r.key]}`}
                    style={{ width: `${Math.min(100, r.optimized)}%` }}
                  />
                </div>
                <span className="text-xs text-[#5f655f] font-semibold w-24 text-right tabular-nums">
                  {r.optimized}% recycled
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-4 rounded-full bg-[#ececea] overflow-hidden">
                  <div
                    className={`h-full ${fillColors[r.key]}`}
                    style={{ width: `${Math.max(0, Math.min(100, 100 - pct))}%` }}
                  />
                </div>
                <span className="text-xs text-[#5f655f] font-semibold w-24 text-right tabular-nums">
                  {r.baseline} → {r.optimized} {r.unit.split('/')[0].trim()}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}