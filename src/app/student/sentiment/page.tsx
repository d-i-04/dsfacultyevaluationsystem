import { getSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import SentimentForm from "./sentiment-form";

export const dynamic = "force-dynamic";

export default async function SentimentPage() {
  const supabase = getSupabaseServerClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    redirect("/auth/login?next=%2Fstudent%2Fsentiment");
  }

  // Load open periods, sections (so student can pick one), and faculty list
  const [periodsRes, sectionsRes] = await Promise.all([
    supabase
      .from("evaluation_periods")
      .select("id, name")
      .eq("status", "open")
      .order("start_date", { ascending: true }),
    supabase
      .from("sections")
      .select("id, term, academic_year, schedule, course:course_id ( code, title ), faculty:faculty_id ( id, full_name )")
      .limit(100),
  ]);

  const periods = (periodsRes.data ?? []).map((p: any) => ({ id: p.id, name: p.name }));

  const sections = (sectionsRes.data ?? []).map((s: any) => {
    const course = s.course ? `${s.course.code} ${s.course.title}` : "Section";
    const faculty = s.faculty?.full_name ?? "Unknown Faculty";
    const term = s.term ?? "";
    return {
      id: s.id,
      label: `${course} • ${faculty}${term ? ` • ${term}` : ""}`,
      facultyId: s.faculty?.id ?? null,
      facultyName: faculty,
    };
  });

  const error = [periodsRes.error?.message, sectionsRes.error?.message].filter(Boolean).join(" | ").trim() || null;

  return (
    <div className="section-shell space-y-6 fade-in">
      <header className="space-y-1">
        <div className="badge">Sentiment</div>
        <h1 className="mt-2 text-2xl font-bold text-white">Submit Sentiment</h1>
        <p className="text-slate-400 text-sm">
          Share your sentiment about a faculty member. Your feedback helps improve teaching quality.
        </p>
      </header>

      <div className="card">
        <div className="card-body space-y-4">
          {error && <p className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">{error}</p>}
          <SentimentForm periods={periods} sections={sections} />
        </div>
      </div>
    </div>
  );
}
