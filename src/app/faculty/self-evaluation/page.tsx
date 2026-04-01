import { getSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import SelfEvaluationForm from "./self-evaluation-form";

export const dynamic = "force-dynamic";

export default async function SelfEvaluationPage() {
  const supabase = getSupabaseServerClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    redirect("/auth/login?next=%2Ffaculty%2Fself-evaluation");
  }

  const userId = userData.user.id;

  const [periodsResult, sectionsResult, categoriesResult] = await Promise.all([
    supabase
      .from("evaluation_periods")
      .select("id, name, status, start_date")
      .eq("status", "open")
      .order("start_date", { ascending: true }),
    supabase
      .from("sections")
      .select("id, term, academic_year, schedule, course:course_id ( code, title )")
      .eq("faculty_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("rubric_categories")
      .select("id, label, description, order_index, rubric_items ( id, prompt, order_index, max_score )")
      .order("order_index", { ascending: true })
      .order("order_index", { ascending: true, foreignTable: "rubric_items" }),
  ]);

  const periods = (periodsResult.data ?? []).map((p: any) => ({ id: p.id, name: p.name }));

  const sections = (sectionsResult.data ?? []).map((s: any) => {
    const course = s.course
      ? Array.isArray(s.course)
        ? s.course[0] ? `${s.course[0].code} ${s.course[0].title}` : "Section"
        : `${s.course.code} ${s.course.title}`
      : "Section";
    const term = s.term ? ` • ${s.term}` : "";
    const schedule = s.schedule ? ` • ${s.schedule}` : "";
    return { id: s.id, label: `${course}${term}${schedule}` };
  });

  const categories = (categoriesResult.data ?? []).map((cat: any) => ({
    id: cat.id,
    label: cat.label,
    description: cat.description,
    orderIndex: cat.order_index ?? 0,
    items: Array.isArray(cat.rubric_items)
      ? cat.rubric_items.map((item: any) => ({
          id: item.id,
          prompt: item.prompt,
          orderIndex: item.order_index ?? 0,
          maxScore: item.max_score ?? 5,
        }))
      : [],
  }));

  const error =
    [periodsResult.error?.message, sectionsResult.error?.message, categoriesResult.error?.message]
      .filter(Boolean)
      .join(" | ")
      .trim() || null;

  return (
    <div className="section-shell space-y-6 fade-in">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="badge">Self Evaluation</div>
          <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/30">
            Self
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-white">Self Evaluation Form</h1>
        <p className="text-slate-400 text-sm">
          Evaluate your own teaching performance. Select one of your sections and an open evaluation period, then rate each criterion honestly.
        </p>
      </header>

      <div className="card">
        <div className="card-body space-y-4">
          {error && <p className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">{error}</p>}
          {sections.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No sections assigned to you. Self-evaluation requires at least one section.</p>
          ) : periods.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No open evaluation periods available.</p>
          ) : (
            <SelfEvaluationForm periods={periods} sections={sections} categories={categories} />
          )}
        </div>
      </div>
    </div>
  );
}
