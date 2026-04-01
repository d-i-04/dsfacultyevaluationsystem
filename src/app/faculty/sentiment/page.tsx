import { loadFacultyData } from "@/lib/faculty-data";

export const dynamic = "force-dynamic";

export default async function SentimentPage() {
  const { sentiments } = await loadFacultyData();

  const total = sentiments.length;
  const positive = sentiments.filter((s) => s.sentiment === "positive");
  const neutral = sentiments.filter((s) => s.sentiment === "neutral");
  const negative = sentiments.filter((s) => s.sentiment === "negative");

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const withComments = sentiments.filter((s) => s.comments);

  return (
    <div className="section-shell space-y-8 fade-in">
      <header className="space-y-1">
        <div className="badge">Sentiment</div>
        <h1 className="mt-2 text-2xl font-bold text-white">Sentiment Report</h1>
        <p className="text-slate-400 text-sm">
          Student sentiment feedback across all evaluation periods.
        </p>
      </header>

      {total === 0 ? (
        <div className="stat-card p-8 text-center">
          <p className="text-slate-400">No student sentiments submitted yet.</p>
        </div>
      ) : (
        <>
          {/* Distribution cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="stat-card p-5 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">Positive</p>
              <p className="mt-1 text-4xl font-extrabold text-white">{positive.length}</p>
              <p className="text-sm text-slate-400">{pct(positive.length)}%</p>
            </div>
            <div className="stat-card p-5 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Neutral</p>
              <p className="mt-1 text-4xl font-extrabold text-white">{neutral.length}</p>
              <p className="text-sm text-slate-400">{pct(neutral.length)}%</p>
            </div>
            <div className="stat-card p-5 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-rose-400">Negative</p>
              <p className="mt-1 text-4xl font-extrabold text-white">{negative.length}</p>
              <p className="text-sm text-slate-400">{pct(negative.length)}%</p>
            </div>
          </div>

          {/* Visual bar */}
          <div className="stat-card p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">Distribution</p>
            <div className="flex h-6 w-full overflow-hidden rounded-full">
              {positive.length > 0 && (
                <div
                  className="bg-emerald-500 transition-all duration-700"
                  style={{ width: `${pct(positive.length)}%` }}
                  title={`Positive: ${pct(positive.length)}%`}
                />
              )}
              {neutral.length > 0 && (
                <div
                  className="bg-slate-400 transition-all duration-700"
                  style={{ width: `${pct(neutral.length)}%` }}
                  title={`Neutral: ${pct(neutral.length)}%`}
                />
              )}
              {negative.length > 0 && (
                <div
                  className="bg-rose-500 transition-all duration-700"
                  style={{ width: `${pct(negative.length)}%` }}
                  title={`Negative: ${pct(negative.length)}%`}
                />
              )}
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>{pct(positive.length)}% Positive</span>
              <span>{pct(neutral.length)}% Neutral</span>
              <span>{pct(negative.length)}% Negative</span>
            </div>
          </div>

          {/* Comments list */}
          {withComments.length > 0 && (
            <div className="card glass">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-white">Student Comments</h2>
                <span className="text-xs text-slate-400">{withComments.length} comment{withComments.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="card-body space-y-2 max-h-[500px] overflow-y-auto">
                {withComments.map((s) => {
                  const colorMap: Record<string, string> = {
                    positive: "border-l-emerald-500 bg-emerald-500/10",
                    neutral: "border-l-slate-400 bg-slate-500/10",
                    negative: "border-l-rose-500 bg-rose-500/10",
                  };
                  const labelColor: Record<string, string> = {
                    positive: "text-emerald-400",
                    neutral: "text-slate-400",
                    negative: "text-rose-400",
                  };
                  return (
                    <div
                      key={s.id}
                      className={`rounded-lg border-l-4 p-3 ${colorMap[s.sentiment] ?? ""}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold capitalize ${labelColor[s.sentiment] ?? ""}`}>
                          {s.sentiment}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(s.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200">{s.comments}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
