import { loadFacultyData } from "@/lib/faculty-data";

export const dynamic = "force-dynamic";

export default async function SummaryPage() {
  const { evaluations } = await loadFacultyData();

  // Group by period
  const byPeriod: Record<string, typeof evaluations> = {};
  for (const ev of evaluations) {
    const key = ev.periodName;
    if (!byPeriod[key]) byPeriod[key] = [];
    byPeriod[key].push(ev);
  }

  const periods = Object.entries(byPeriod).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="section-shell space-y-8 fade-in">
      <header className="space-y-1">
        <div className="badge">Summary</div>
        <h1 className="mt-2 text-2xl font-bold text-white">Evaluation Summary</h1>
        <p className="text-slate-400 text-sm">
          All evaluations received, grouped by evaluation period.
        </p>
      </header>

      {periods.length === 0 ? (
        <div className="stat-card p-8 text-center">
          <p className="text-slate-400">No evaluations found. They will appear here once submitted.</p>
        </div>
      ) : (
        periods.map(([periodName, evals]) => {
          const submitted = evals.filter((e) => e.status === "submitted");
          const draft = evals.filter((e) => e.status === "draft");

          return (
            <div key={periodName} className="card glass">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-white">{periodName}</h2>
                <div className="flex gap-2 text-xs">
                  <span className="pill bg-emerald-900/40 text-emerald-300">{submitted.length} submitted</span>
                  {draft.length > 0 && (
                    <span className="pill bg-amber-900/40 text-amber-300">{draft.length} draft</span>
                  )}
                </div>
              </div>
              <div className="card-body space-y-3">
                {evals.map((ev, idx) => {
                  const cats = Object.entries(ev.categoryAverages);
                  const overall =
                    cats.length > 0
                      ? Number((cats.reduce((s, [, v]) => s + v, 0) / cats.length).toFixed(2))
                      : 0;

                  return (
                    <details key={idx} className="group rounded-xl border border-white/10 bg-white/[0.04]">
                      <summary className="flex cursor-pointer items-center justify-between px-5 py-3 transition-colors hover:bg-white/[0.06]">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-white">{ev.evaluatorName}</span>
                          <span className="pill capitalize text-xs">{ev.role}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-sm font-bold ${
                              ev.status === "submitted" ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {ev.status === "submitted" ? `${overall} / 5` : "Draft"}
                          </span>
                          <svg
                            className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </summary>

                      <div className="border-t border-white/10 px-5 py-4 space-y-4">
                        {ev.submittedAt && (
                          <p className="text-xs text-slate-500">
                            Submitted: {new Date(ev.submittedAt).toLocaleString()}
                          </p>
                        )}

                        {cats.length > 0 && (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {cats.map(([label, avg]) => (
                              <div key={label} className="rounded-lg bg-white/[0.06] p-3">
                                <p className="text-xs font-medium text-slate-400">{label}</p>
                                <div className="mt-1 flex items-center gap-2">
                                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                                    <div
                                      className="h-full rounded-full bg-accent transition-all duration-500"
                                      style={{ width: `${(avg / 5) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-white">{avg}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {ev.overallComment && (
                          <div className="rounded-lg bg-white/[0.06] p-3">
                            <p className="text-xs font-medium text-slate-400 mb-1">Comment</p>
                            <p className="text-sm text-slate-300">{ev.overallComment}</p>
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
