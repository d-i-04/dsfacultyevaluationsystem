import Link from "next/link";
import { loadFacultyData } from "@/lib/faculty-data";

export const dynamic = "force-dynamic";

export default async function FacultyPage() {
  const { profile, sections, sentiments, evaluations, errorMessage } = await loadFacultyData();

  const submitted = evaluations.filter((e) => e.status === "submitted").length;
  const totalSentiments = sentiments.length;
  const positivePct = totalSentiments > 0
    ? Math.round((sentiments.filter((s) => s.sentiment === "positive").length / totalSentiments) * 100)
    : 0;

  // overall average across all categories of all submitted evaluations
  const allAvgs = evaluations
    .filter((e) => e.status === "submitted")
    .flatMap((e) => Object.values(e.categoryAverages));
  const overallRating = allAvgs.length > 0
    ? Number((allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(2))
    : 0;

  return (
    <div className="section-shell space-y-8 fade-in">
      <header className="space-y-1">
        <div className="badge">Faculty</div>
        <h1 className="mt-2 text-2xl font-bold text-white">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="text-slate-400 text-sm">Overview of your teaching portfolio, evaluations, and feedback.</p>
      </header>

      {errorMessage && (
        <p className="rounded-lg bg-amber-900/40 px-3 py-2 text-sm text-amber-100 shadow-sm">{errorMessage}</p>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Sections</p>
          <p className="mt-1 text-3xl font-bold text-white">{sections.length}</p>
        </div>
        <div className="stat-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Evaluations</p>
          <p className="mt-1 text-3xl font-bold text-white">{submitted}</p>
        </div>
        <div className="stat-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Overall Rating</p>
          <p className="mt-1 text-3xl font-bold text-accent">{overallRating > 0 ? `${overallRating} / 5` : "—"}</p>
        </div>
        <div className="stat-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Positive Sentiment</p>
          <p className="mt-1 text-3xl font-bold text-emerald-400">{positivePct}%</p>
        </div>
      </div>

      {/* Quick-access cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/faculty/self-evaluation" className="stat-card group p-5 hover:border-amber-500/40">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">Self Evaluation</p>
            <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 ring-1 ring-inset ring-amber-500/30">Self</span>
          </div>
          <p className="text-xs text-slate-400">Evaluate your own teaching performance</p>
        </Link>
        <Link href="/faculty/performance" className="stat-card group p-5 hover:border-accent/40">
          <p className="text-sm font-semibold text-white group-hover:text-accent transition-colors">Performance Rating</p>
          <p className="mt-1 text-xs text-slate-400">Category averages and score breakdowns</p>
        </Link>
        <Link href="/faculty/summary" className="stat-card group p-5 hover:border-accent/40">
          <p className="text-sm font-semibold text-white group-hover:text-accent transition-colors">Evaluation Summary</p>
          <p className="mt-1 text-xs text-slate-400">All evaluations received by period</p>
        </Link>
        <Link href="/faculty/sentiment" className="stat-card group p-5 hover:border-accent/40">
          <p className="text-sm font-semibold text-white group-hover:text-accent transition-colors">Sentiment Report</p>
          <p className="mt-1 text-xs text-slate-400">Student feedback distribution and comments</p>
        </Link>
        <Link href="/faculty/analytics" className="stat-card group p-5 hover:border-accent/40 sm:col-span-2 lg:col-span-3">
          <p className="text-sm font-semibold text-white group-hover:text-accent transition-colors">Data Graphs &amp; Recommendation</p>
          <p className="mt-1 text-xs text-slate-400">Visual analytics with charts, trends, and AI-driven recommendations</p>
        </Link>
      </div>

      {/* Sections table */}
      <div className="card glass">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-white">My Sections</h2>
        </div>
        <div className="card-body bg-white/60 backdrop-blur">
          <div className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="table min-w-[520px]">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Term</th>
                  <th>Schedule</th>
                </tr>
              </thead>
              <tbody>
                {sections.length === 0 ? (
                  <tr>
                    <td className="py-4 text-sm text-slate-600" colSpan={3}>No sections assigned yet.</td>
                  </tr>
                ) : (
                  sections.map((s) => (
                    <tr key={s.id}>
                      <td className="font-semibold text-slate-900">
                        {s.course ? `${s.course.code} ${s.course.title}` : "—"}
                      </td>
                      <td className="text-slate-600 text-sm">{[s.term, s.academic_year].filter(Boolean).join(" ")}</td>
                      <td className="text-slate-600 text-sm">{s.schedule ?? ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
