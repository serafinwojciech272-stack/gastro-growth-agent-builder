type Measurement = { kpi: string; before_value: number | null; after_value: number | null; delta: number | null; confidence: number };
type Props = { measurements: Measurement[] };

export default function GrowthROI({ measurements }: Props) {
  const measured = measurements.filter((m) => m.before_value !== null && m.after_value !== null);
  const wins = measured.filter((m) => (m.delta ?? 0) > 0).length;
  const avgDelta = measured.length ? measured.reduce((sum, m) => sum + (m.delta ?? 0), 0) / measured.length : null;
  const confidence = measured.length ? measured.reduce((sum, m) => sum + m.confidence, 0) / measured.length : null;
  return <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg sm:p-6">
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">Business impact</p><h2 className="mt-1 text-xl font-extrabold text-white">Growth ROI signal</h2><p className="mt-1 text-sm text-slate-500">Outcome data from completed growth measurements.</p></div><span className="text-xs text-slate-500">{measured.length} measured KPIs</span></div>
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Winning KPIs" value={String(wins)} /><Metric label="Avg. delta" value={avgDelta === null ? "--" : formatDelta(avgDelta)} /><Metric label="Confidence" value={confidence === null ? "--" : `${Math.round(confidence * 100)}%`} /><Metric label="Evidence" value={measured.length >= 3 ? "Strong" : measured.length ? "Early" : "None"} /></div>
  </section>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/5 bg-black/20 p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-xl font-black text-white">{value}</p></div>; }
function formatDelta(value: number) { return `${value > 0 ? "+" : ""}${Number.isInteger(value) ? value : value.toFixed(1)}`; }
