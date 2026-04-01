import { loadFacultyData } from "@/lib/faculty-data";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const { evaluations } = await loadFacultyData();

  const submitted = evaluations.filter((e) => e.status === "submitted");

  // Aggregate category scores across all submitted evaluations
  const categoryTotals: Record<string, { sum: number; count: number }> = {};
  for (const ev of submitted) {
    for (const [cat, avg] of Object.entries(ev.categoryAverages)) {
      if (!categoryTotals[cat]) categoryTotals[cat] = { sum: 0, count: 0 };
      categoryTotals[cat].sum += avg;
      categoryTotals[cat].count += 1;
    }
  }

  const categories = Object.entries(categoryTotals)
    .map(([label, { sum, count }]) => ({
      label,
      avg: Number((sum / count).toFixed(2)),
      count,
    }))
    .sort((a, b) => b.avg - a.avg);

  const overallAvg =
    categories.length > 0
      ? Number((categories.reduce((s, c) => s + c.avg, 0) / categories.length).toFixed(2))
      : 0;

  // Per-evaluator breakdown
  const byEvaluator = submitted.map((ev) => ({
    name: ev.evaluatorName,
    role: ev.role,
    period: ev.periodName,
    categories: ev.categoryAverages,
    overall:
      Object.values(ev.categoryAverages).length > 0
        ? Number(
            (
              Object.values(ev.categoryAverages).reduce((a, b) => a + b, 0) /
              Object.values(ev.categoryAverages).length
            ).toFixed(2)
          )
        : 0,
  }));

  function ratingColor(avg: number) {
    if (avg >= 4) return "text-emerald-400";
    if (avg >= 3) return "text-amber-400";
    return "text-rose-400";
  }

  function barColor(avg: number) {
    if (avg >= 4) return "from-emerald-500 to-emerald-400";
    if (avg >= 3) return "from-amber-500 to-amber-400";
    return "from-rose-500 to-rose-400";
  }

  return (
    <div className="section-shell space-y-8 fade-in">
      <header className="space-y-1">
        <div className="badge">Performance</div>
        <h1 className="mt-2 text-2xl font-bold text-white">Performance Rating</h1>
        <p className="text-slate-400 text-sm">
          Aggregated scores across {submitted.length} submitted evaluation{submitted.length !== 1 ? "s" : ""}.
        </p>
      </header>

      {categories.length === 0 ? (
        <div className="stat-card p-8 text-center">
          <p className="text-slate-400">No submitted evaluations yet. Ratings will appear here once evaluations are completed.</p>
        </div>
      ) : (
        <>
          {/* Overall rating */}
          <div className="stat-card p-6 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Overall Performance Rating</p>
            <p className={`mt-2 text-5xl font-extrabold ${ratingColor(overallAvg)}`}>
              {overallAvg} <span className="text-lg font-normal text-slate-500">/ 5</span>
            </p>
          </div>

          {/* Category breakdown */}
          <div className="card glass">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-white">Category Averages</h2>
            </div>
            <div className="card-body space-y-5">
              {categories.map((cat) => (
                <div key={cat.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-200">{cat.label}</span>
                    <span className={`text-sm font-bold ${ratingColor(cat.avg)}`}>{cat.avg} / 5</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${barColor(cat.avg)} transition-all duration-500`}
                      style={{ width: `${(cat.avg / 5) * 100}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">Based on {cat.count} evaluation{cat.count !== 1 ? "s" : ""}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Per-evaluator table */}
          <div className="card glass">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-white">Evaluator Breakdown</h2>
            </div>
            <div className="card-body bg-white/60 backdrop-blur">
              <div className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="table min-w-[600px]">
                  <thead>
                    <tr>
                      <th>Evaluator</th>
                      <th>Role</th>
                      <th>Period</th>
                      <th className="text-right">Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byEvaluator.map((ev, i) => (
                      <tr key={i}>
                        <td className="font-semibold text-slate-900">{ev.name}</td>
                        <td>
                          <span className="pill capitalize">{ev.role}</span>
                        </td>
                        <td className="text-sm text-slate-600">{ev.period}</td>
                        <td className="text-right font-bold text-slate-900">{ev.overall} / 5</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
