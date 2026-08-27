import { Droplets, Footprints, Recycle, Zap } from 'lucide-react';

export const METRIC_META = {
  co2: { label: 'CO₂ emissions', unit: 'kg CO₂e / unit', icon: Footprints },
  water: { label: 'Water usage', unit: 'L / unit', icon: Droplets },
  electricity: { label: 'Electricity', unit: 'kWh / unit', icon: Zap },
  material: { label: 'Material', unit: '% recycled', icon: Recycle },
};

export function improvementPct(baseline, optimized) {
  if (!baseline || baseline <= 0) return 0;
  return Math.round(((baseline - optimized) / baseline) * 100);
}

export function metricRow(key, baseline, optimized) {
  const meta = METRIC_META[key];
  const improvement =
    key === 'material' ? Math.round(optimized || 0) : improvementPct(baseline, optimized);
  return { key, ...meta, baseline, optimized, improvement };
}

export function allMetricRows(plan) {
  return ['co2', 'water', 'electricity', 'material'].map((k) =>
    metricRow(k, plan.baseline[k], plan.optimized[k])
  );
}

export function savingsSummary(plan) {
  return {
    co2: improvementPct(plan.baseline.co2, plan.optimized.co2),
    water: improvementPct(plan.baseline.water, plan.optimized.water),
    electricity: improvementPct(plan.baseline.electricity, plan.optimized.electricity),
    recycled: Math.round(plan.optimized.material || 0),
  };
}