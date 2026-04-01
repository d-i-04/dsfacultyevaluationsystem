import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const supabase = getSupabaseServerClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    redirect("/auth/login?next=%2Fstudent");
  }

  const userId = userData.user.id;

  const [profileRes, evaluationsRes, sentimentsRes, periodsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, role").eq("id", userId).maybeSingle(),
    supabase
      .from("evaluations")
      .select("id, status, submitted_at, assignment:assignment_id ( role, faculty:faculty_id ( full_name ), period:evaluation_periods ( name ) )")
      .eq("assignment.evaluator_id", userId),
    supabase
      .from("student_sentiments")
      .select("id, sentiment, comments, created_at, faculty:faculty_id ( full_name )")
      .eq("student_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("evaluation_periods").select("id, name").eq("status", "open"),
  ]);

  const profile = profileRes.data;
  const evaluations = (evaluationsRes.data ?? []) as any[];
  const sentiments = (sentimentsRes.data ?? []) as any[];
  const openPeriods = periodsRes.data ?? [];

  const submitted = evaluations.filter((e) => e.status === "submitted").length;
  const draft = evaluations.filter((e) => e.status === "draft").length;
  const sentimentCounts = {
    positive: sentiments.filter((s: any) => s.sentiment === "positive").length,
    neutral: sentiments.filter((s: any) => s.sentiment === "neutral").length,
    negative: sentiments.filter((s: any) => s.sentiment === "negative").length,
  };

  return (
    <div className="section-shell space-y-8 fade-in">
      <header className="space-y-1">
        <div className="badge">Student</div>
        <h1 className="mt-2 text-2xl font-bold text-white">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="text-slate-400 text-sm">Your evaluation activity and sentiment submissions at a glance.</p>
      </header>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Submitted</p>
          <p className="mt-1 text-3xl font-bold text-emerald-400">{submitted}</p>
        </div>
        <div className="stat-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Drafts</p>
          <p className="mt-1 text-3xl font-bold text-amber-400">{draft}</p>
        </div>
        <div className="stat-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Sentiments Sent</p>
          <p className="mt-1 text-3xl font-bold text-white">{sentiments.length}</p>
        </div>
        <div className="stat-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Open Periods</p>
          <p className="mt-1 text-3xl font-bold text-accent">{openPeriods.length}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/student/evaluate" className="stat-card group p-5 hover:border-accent/40">
          <p className="text-sm font-semibold text-white group-hover:text-accent transition-colors">Evaluate Faculty</p>
          <p className="mt-1 text-xs text-slate-400">Submit a teaching effectiveness evaluation for a section</p>
        </Link>
        <Link href="/student/sentiment" className="stat-card group p-5 hover:border-accent/40">
          <p className="text-sm font-semibold text-white group-hover:text-accent transition-colors">Submit Sentiment</p>
          <p className="mt-1 text-xs text-slate-400">Share your sentiment feedback about a faculty member</p>
        </Link>
      </div>

      {/* Recent evaluations */}
      {evaluations.length > 0 && (
        <div className="card glass">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">Recent Evaluations</h2>
          </div>
          <div className="card-body bg-white/60 backdrop-blur">
            <div className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="table min-w-[480px]">
                <thead>
                  <tr>
                    <th>Faculty</th>
                    <th>Period</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.slice(0, 10).map((ev: any) => (
                    <tr key={ev.id}>
                      <td className="font-semibold text-slate-900">{ev.assignment?.faculty?.full_name ?? "—"}</td>
                      <td className="text-sm text-slate-600">{ev.assignment?.period?.name ?? "—"}</td>
                      <td><span className="pill capitalize text-xs">{ev.assignment?.role ?? "—"}</span></td>
                      <td>
                        <span className={`pill text-xs ${ev.status === "submitted" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {ev.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sentiment history */}
      {sentiments.length > 0 && (
        <div className="card glass">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">Your Sentiments</h2>
            <div className="flex gap-2 text-xs">
              <span className="pill bg-emerald-900/40 text-emerald-300">{sentimentCounts.positive} positive</span>
              <span className="pill bg-slate-700/40 text-slate-300">{sentimentCounts.neutral} neutral</span>
              <span className="pill bg-rose-900/40 text-rose-300">{sentimentCounts.negative} negative</span>
            </div>
          </div>
          <div className="card-body space-y-2 max-h-80 overflow-y-auto">
            {sentiments.map((s: any) => {
              const colorMap: Record<string, string> = {
                positive: "border-l-emerald-500 bg-emerald-500/10",
                neutral: "border-l-slate-400 bg-slate-500/10",
                negative: "border-l-rose-500 bg-rose-500/10",
              };
              return (
                <div key={s.id} className={`rounded-lg border-l-4 p-3 ${colorMap[s.sentiment] ?? ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{s.faculty?.full_name ?? "Faculty"}</span>
                    <span className="text-xs text-slate-500">{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs capitalize text-slate-400">{s.sentiment}</p>
                  {s.comments && <p className="mt-1 text-sm text-slate-300">{s.comments}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
