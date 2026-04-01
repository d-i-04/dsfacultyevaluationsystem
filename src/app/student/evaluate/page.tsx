import StudentForm from "../student-form";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PeriodOption = { id: string; name: string };
type SectionOption = { id: string; label: string; facultyId: string | null };
type RubricItem = { id: string; prompt: string; orderIndex: number; maxScore: number };
type RubricCategory = { id: string; label: string; description: string | null; orderIndex: number; items: RubricItem[] };

export default async function EvaluatePage() {
  const supabase = getSupabaseServerClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    redirect("/auth/login?next=%2Fstudent%2Fevaluate");
  }

  const [periodsResult, sectionsResult, categoriesResult] = await Promise.all([
    supabase
      .from("evaluation_periods")
      .select("id, name, status, start_date")
      .eq("status", "open")
      .order("start_date", { ascending: true }),
    supabase
      .from("sections")
      .select("id, term, academic_year, schedule, course:course_id ( code, title ), faculty:faculty_id ( id, full_name )")
      .limit(50),
    supabase
      .from("rubric_categories")
      .select("id, label, description, order_index, rubric_items ( id, prompt, order_index, max_score )")
      .order("order_index", { ascending: true })
      .order("order_index", { ascending: true, foreignTable: "rubric_items" }),
  ]);

  const periods: PeriodOption[] = (periodsResult.data ?? []).map((p) => ({ id: p.id, name: p.name }));

  const sections: SectionOption[] = (sectionsResult.data ?? []).map((s: any) => {
    const course = s.course ? `${s.course.code} ${s.course.title}` : "Section";
    const term = s.term ? ` • ${s.term}` : "";
    const schedule = s.schedule ? ` • ${s.schedule}` : "";
    const faculty = s.faculty?.full_name ? ` • ${s.faculty.full_name}` : "";
    return { id: s.id, label: `${course}${term}${schedule}${faculty}`, facultyId: s.faculty ? s.faculty.id : null };
  });

  const categories: RubricCategory[] = (categoriesResult.data ?? []).map((cat: any) => ({
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

  const error = [periodsResult.error?.message, sectionsResult.error?.message, categoriesResult.error?.message]
    .filter(Boolean)
    .join(" | ")
    .trim() || null;

  return (
    <div className="section-shell space-y-6 fade-in">
      <header className="space-y-1">
        <div className="badge">Evaluate</div>
        <h1 className="mt-2 text-2xl font-bold text-white">Faculty Teaching Effectiveness</h1>
        <p className="text-slate-400 text-sm">
          Rate each criterion for the selected section and period. All ratings are required.
        </p>
      </header>

      <div className="card">
        <div className="card-body space-y-4">
          {error && <p className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">{error}</p>}
          <StudentForm periods={periods} sections={sections} categories={categories} />
        </div>
      </div>
    </div>
  );
}
