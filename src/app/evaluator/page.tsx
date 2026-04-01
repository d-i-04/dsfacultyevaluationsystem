import { getSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import EvaluationForm from "@/components/evaluation-form";

export const dynamic = "force-dynamic";

type Assignment = {
  id: string;
  period_id: string;
  faculty_id: string;
  evaluator_id: string;
  role: string;
  section_id: string | null;
  created_at: string;
  period: {
    id: string;
    name: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
  };
  faculty: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  section: {
    id: string;
    term: string | null;
    course: { code: string; title: string } | null;
  } | null;
};

type RubricCategory = {
  id: string;
  label: string;
  description: string | null;
  order_index: number;
  rubric_items: Array<{
    id: string;
    prompt: string;
    max_score: number;
    order_index: number;
  }>;
};

type Evaluation = {
  id: string;
  assignment_id: string;
  status: string;
  submitted_at: string | null;
  overall_comment: string | null;
};

async function loadData() {
  const supabase = getSupabaseServerClient();

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    redirect("/auth/login?next=%2Fevaluator");
  }

  const userId = userData.user.id;

  // First, fetch assignments and categories in parallel
  const [assignmentsResult, categoriesResult] = await Promise.all([
    supabase
      .from("evaluator_assignments")
      .select(`
        id,
        period_id,
        faculty_id,
        evaluator_id,
        section_id,
        role,
        created_at,
        period:evaluation_periods ( id, name, status, start_date, end_date ),
        faculty:faculty_id ( id, full_name, email ),
        section:section_id ( id, term, course:course_id ( code, title ) )
      `)
      .eq("evaluator_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("rubric_categories")
      .select("id, label, description, order_index, rubric_items ( id, prompt, max_score, order_index )")
      .order("order_index", { ascending: true }),
  ]);

  const assignments: Assignment[] = (assignmentsResult.data ?? []).map((a: any) => ({
    id: a.id,
    period_id: a.period_id,
    faculty_id: a.faculty_id,
    evaluator_id: a.evaluator_id,
    section_id: a.section_id,
    role: a.role,
    created_at: a.created_at,
    period: Array.isArray(a.period) ? a.period[0] || a.period : a.period,
    faculty: Array.isArray(a.faculty) ? a.faculty[0] || a.faculty : a.faculty,
    section: Array.isArray(a.section) ? a.section[0] || a.section : a.section,
  }));
  const assignmentIds = assignments.map(a => a.id);

  // Then fetch evaluations based on assignment IDs
  const evaluationsResult = await supabase
    .from("evaluations")
    .select("id, assignment_id, status, submitted_at, overall_comment")
    .in("assignment_id", assignmentIds.length > 0 ? assignmentIds : ["00000000-0000-0000-0000-000000000000"]);

  const categories: RubricCategory[] = (categoriesResult.data ?? []).map((cat: any) => ({
    id: cat.id,
    label: cat.label,
    description: cat.description,
    order_index: cat.order_index,
    rubric_items: Array.isArray(cat.rubric_items) ? cat.rubric_items : [],
  }));
  const evaluations: Evaluation[] = evaluationsResult.data ?? [];

  const evaluationMap = new Map(evaluations.map(e => [e.assignment_id, e]));

  const assignmentsError = assignmentsResult.data ? null : assignmentsResult.error?.message;
  const categoriesError = categoriesResult.data ? null : categoriesResult.error?.message;

  return {
    assignments,
    categories,
    evaluationMap,
    errors: {
      assignments: assignmentsError,
      categories: categoriesError,
    },
  };
}

export default async function EvaluatorPage() {
  const { assignments, categories, evaluationMap, errors } = await loadData();

  const openAssignments = assignments.filter(a => a.period?.status === "open");
  const completedAssignments = assignments.filter(a => {
    const evaluation = evaluationMap.get(a.id);
    return evaluation && evaluation.status === "submitted";
  });

  return (
    <main className="section-shell space-y-6">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-wide text-slate-300">Evaluator</p>
        <h1 className="text-2xl font-bold text-white">My evaluations</h1>
        <p className="text-slate-200 text-sm">
          Complete evaluations for assigned faculty members during open periods.
        </p>
      </header>

      {Object.values(errors).some(e => e) && (
        <p className="rounded-lg bg-amber-900/40 px-3 py-2 text-sm text-amber-100">
          {Object.values(errors).filter(Boolean).join(" | ")}
        </p>
      )}

      {assignments.length === 0 ? (
        <div className="card glass">
          <div className="card-body bg-white/60 backdrop-blur text-center py-12">
            <p className="text-slate-600">No evaluations assigned yet</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card glass">
              <div className="card-header">
                <p className="text-sm font-semibold text-white">
                  {openAssignments.length} Open
                </p>
              </div>
              <div className="card-body bg-white/60 backdrop-blur">
                <p className="text-2xl font-bold text-slate-900">{openAssignments.length}</p>
              </div>
            </div>
            <div className="card glass">
              <div className="card-header">
                <p className="text-sm font-semibold text-white">
                  {completedAssignments.length} Completed
                </p>
              </div>
              <div className="card-body bg-white/60 backdrop-blur">
                <p className="text-2xl font-bold text-slate-900">{completedAssignments.length}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {openAssignments.map((assignment) => (
              <div key={assignment.id} className="card glass">
                <div className="card-header">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {assignment.faculty?.full_name}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {assignment.period?.name} • {assignment.role.charAt(0).toUpperCase() + assignment.role.slice(1)} Evaluation
                    </p>
                  </div>
                  <span className="badge bg-blue-600">{assignment.period?.status}</span>
                </div>
                <div className="card-body bg-white/60 backdrop-blur">
                  <details className="group">
                    <summary className="cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                      📋 Evaluation Form
                    </summary>
                    <div className="mt-4 space-y-4 border-t pt-4">
                      <EvaluationForm
                        assignmentId={assignment.id}
                        periodId={assignment.period_id}
                        facultyName={assignment.faculty?.full_name || ""}
                        evaluationRole={assignment.role}
                        categories={categories}
                      />
                    </div>
                  </details>
                </div>
              </div>
            ))}

            {completedAssignments.length > 0 && (
              <div className="mt-8 space-y-4">
                <h2 className="text-lg font-bold text-white">Completed Evaluations</h2>
                {completedAssignments.map((assignment) => {
                  const evaluation = evaluationMap.get(assignment.id);
                  return (
                    <div key={assignment.id} className="card glass opacity-75">
                      <div className="card-header">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {assignment.faculty?.full_name}
                          </h3>
                          <p className="text-xs text-slate-300">
                            {assignment.period?.name} • Submitted{" "}
                            {evaluation?.submitted_at
                              ? new Date(evaluation.submitted_at).toLocaleDateString()
                              : ""}
                          </p>
                        </div>
                        <span className="badge bg-green-600">Submitted</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <div className="mt-8 flex justify-between">
        <Link href="/" className="btn-secondary">
          ← Home
        </Link>
        {assignments.length > 0 && (
          <Link href="/faculty" className="btn-secondary">
            My Faculty Dashboard →
          </Link>
        )}
      </div>
    </main>
  );
}
