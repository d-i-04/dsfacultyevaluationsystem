import { getSupabaseServerClient } from "@/lib/supabase-server";
import EvaluatorAssignmentManager from "@/components/admin/evaluator-assignment-manager";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Faculty = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type Period = {
  id: string;
  name: string;
  status: string;
};

type Section = {
  id: string;
  term: string | null;
  course: { code: string; title: string } | null;
};

type Assignment = {
  id: string;
  period_id: string;
  faculty_id: string;
  evaluator_id: string;
  role: string;
  section_id: string | null;
  period: Period;
  faculty: Faculty;
  evaluator: Faculty;
  section: Section | null;
};

async function loadData() {
  const supabase = getSupabaseServerClient();

  const [facultyResult, periodsResult, sectionsResult, assignmentsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "faculty")
      .order("full_name", { ascending: true }),
    supabase
      .from("evaluation_periods")
      .select("id, name, status")
      .order("start_date", { ascending: false }),
    supabase
      .from("sections")
      .select("id, term, course:course_id ( code, title )")
      .order("term", { ascending: false }),
    supabase
      .from("evaluator_assignments")
      .select(`
        id,
        period_id,
        faculty_id,
        evaluator_id,
        section_id,
        role,
        period:evaluation_periods ( id, name, status ),
        faculty:faculty_id ( id, full_name, email ),
        evaluator:evaluator_id ( id, full_name, email ),
        section:section_id ( id, term, course:course_id ( code, title ) )
      `)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  // Normalize assignments to ensure single objects instead of arrays
  const assignments: Assignment[] = (assignmentsResult.data ?? []).map((a: any) => ({
    id: a.id,
    period_id: a.period_id,
    faculty_id: a.faculty_id,
    evaluator_id: a.evaluator_id,
    section_id: a.section_id,
    role: a.role,
    period: Array.isArray(a.period) ? a.period[0] || a.period : a.period,
    faculty: Array.isArray(a.faculty) ? a.faculty[0] || a.faculty : a.faculty,
    evaluator: Array.isArray(a.evaluator) ? a.evaluator[0] || a.evaluator : a.evaluator,
    section: Array.isArray(a.section) ? a.section[0] || a.section : a.section,
  }));

  return {
    faculty: facultyResult.data ?? [],
    periods: periodsResult.data ?? [],
    sections: (sectionsResult.data ?? []).map((s: any) => ({
      ...s,
      course: Array.isArray(s.course) ? s.course[0] || null : s.course,
    })),
    assignments,
    errors: {
      faculty: facultyResult.error?.message,
      periods: periodsResult.error?.message,
      sections: sectionsResult.error?.message,
      assignments: assignmentsResult.error?.message,
    },
  };
}

export default async function AssignmentsPage() {
  const { faculty, periods, sections, assignments, errors } = await loadData();

  return (
    <main className="dashboard-bg min-h-screen">
      <div className="section-shell space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="badge">Management</div>
            <h1 className="mt-2 text-3xl font-bold text-white">Evaluator assignments</h1>
            <p className="text-slate-400 text-sm mt-1">Assign evaluators to faculty members for specific evaluation periods.</p>
          </div>
          <Link href="/admin" className="btn-secondary w-fit">
            &larr; Back to Admin
          </Link>
        </header>

        {Object.values(errors).some(e => e) && (
          <p className="rounded-lg bg-amber-900/40 px-3 py-2 text-sm text-amber-100">
            {Object.values(errors).filter(Boolean).join(" | ")}
          </p>
        )}

        <div className="card glass">
          <div className="card-header">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Assignments</p>
              <h2 className="text-lg font-semibold text-white">Manage evaluator assignments</h2>
            </div>
          </div>
          <div className="card-body bg-white/60 backdrop-blur">
            <EvaluatorAssignmentManager
              initialAssignments={assignments}
              faculty={faculty}
              periods={periods}
              sections={sections}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
