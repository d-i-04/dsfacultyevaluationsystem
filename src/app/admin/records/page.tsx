import { getSupabaseServerClient } from "@/lib/supabase-server";
import AddSectionForm from "@/components/admin/add-section-form";
import SectionScoresCard from "@/components/admin/section-scores-card";

export const dynamic = "force-dynamic";

type Course = { id: string; code: string; title: string };
type Section = {
  id: string;
  term: string | null;
  academic_year: string | null;
  schedule: string | null;
  course?: { code: string; title: string } | null;
  faculty?: { full_name: string | null } | null;
};

type Sentiment = {
  id: string;
  sentiment: string;
  created_at: string;
  faculty?: { full_name: string | null } | null;
  section?: { term: string | null; academic_year: string | null } | null;
};

type SectionScore = {
  sectionId: string;
  courseLabel: string;
  facultyName: string;
  term: string;
  schedule: string;
  average: number;
  responses: number;
};

export default async function RecordsPage() {
  const supabase = getSupabaseServerClient();

  const [coursesRes, sectionsRes, sentimentsRes, facultyRes, responsesRes] = await Promise.all([
    supabase.from("courses").select("id, code, title").order("code").limit(100),
    supabase
      .from("sections")
      .select("id, term, academic_year, schedule, course:course_id ( code, title ), faculty:faculty_id ( full_name )")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("student_sentiments")
      .select("id, sentiment, created_at, faculty:faculty_id ( full_name ), section:section_id ( term, academic_year )")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "faculty")
      .order("full_name", { ascending: true })
      .limit(200),
    supabase
      .from("evaluation_responses")
      .select(
        `score, evaluation:evaluation_id (
          assignment:assignment_id (
            section:section_id (
              id, term, academic_year, schedule,
              course:course_id ( code, title ),
              faculty:faculty_id ( full_name )
            )
          )
        )`
      )
      .limit(1000),
  ]);

  const courses: Course[] = coursesRes.data ?? [];
  const sections: Section[] = (sectionsRes.data ?? []).map((section) => ({
    ...section,
    // Supabase can return related records as arrays; normalize to single objects for rendering.
    course: Array.isArray(section.course) ? section.course[0] ?? null : section.course ?? null,
    faculty: Array.isArray(section.faculty) ? section.faculty[0] ?? null : section.faculty ?? null,
  }));
  const sentiments: Sentiment[] = (sentimentsRes.data ?? []).map((sentiment) => ({
    ...sentiment,
    faculty: Array.isArray(sentiment.faculty) ? sentiment.faculty[0] ?? null : sentiment.faculty ?? null,
    section: Array.isArray(sentiment.section) ? sentiment.section[0] ?? null : sentiment.section ?? null,
  }));

  const sectionScores: SectionScore[] = (() => {
    const bucket = new Map<string, { total: number; count: number; meta: SectionScore }>();

    (responsesRes.data ?? []).forEach((row: any) => {
      const section = row?.evaluation?.assignment?.section;
      if (!section?.id) return;
      const key = section.id as string;
      const existing = bucket.get(key) ?? {
        total: 0,
        count: 0,
        meta: {
          sectionId: section.id,
          courseLabel: section.course ? `${section.course.code} ${section.course.title}` : "Section",
          facultyName: section.faculty?.full_name ?? "(no faculty)",
          term: [section.term, section.academic_year].filter(Boolean).join(" "),
          schedule: section.schedule ?? "",
          average: 0,
          responses: 0,
        },
      };
      const score = Number(row.score ?? 0);
      const nextTotal = existing.total + score;
      const nextCount = existing.count + 1;
      bucket.set(key, { ...existing, total: nextTotal, count: nextCount });
    });

    return Array.from(bucket.values()).map(({ total, count, meta }) => ({
      ...meta,
      average: count > 0 ? Number((total / count).toFixed(2)) : 0,
      responses: count,
    }));
  })();

  const courseOptions = courses.map((c) => ({ id: c.id, label: `${c.code} ${c.title}` }));
  const facultyOptions = (facultyRes.data ?? []).map((f) => ({ id: f.id, name: f.full_name ?? "(no name)" }));

  return (
    <main className="section-shell space-y-8">
      <header className="space-y-1">
        <div className="badge">Admin</div>
        <h1 className="mt-2 text-2xl font-bold text-white">Records overview</h1>
        <p className="text-slate-400 text-sm">Courses, sections, and student sentiments.</p>
      </header>

      <div className="card glass">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-white">Create section</h2>
        </div>
        <div className="card-body bg-white/60 backdrop-blur">
          <AddSectionForm courses={courseOptions} faculty={facultyOptions} />
        </div>
      </div>

      <div className="card glass">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-white">Courses</h2>
        </div>
        <div className="card-body bg-white/60 backdrop-blur">
          <div className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="table min-w-[520px]">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td className="py-4 text-sm text-slate-600" colSpan={2}>
                      No courses.
                    </td>
                  </tr>
                ) : (
                  courses.map((c) => (
                    <tr key={c.id}>
                      <td className="font-semibold text-slate-900">{c.code}</td>
                      <td className="text-slate-700">{c.title}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card glass">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-white">Sections</h2>
        </div>
        <div className="card-body bg-white/60 backdrop-blur">
          <div className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="table min-w-[720px]">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Faculty</th>
                  <th>Term</th>
                  <th>Schedule</th>
                </tr>
              </thead>
              <tbody>
                {sections.length === 0 ? (
                  <tr>
                    <td className="py-4 text-sm text-slate-600" colSpan={4}>
                      No sections.
                    </td>
                  </tr>
                ) : (
                  sections.map((s) => (
                    <tr key={s.id}>
                      <td className="font-semibold text-slate-900">
                        {s.course ? `${s.course.code} ${s.course.title}` : "—"}
                      </td>
                      <td className="text-slate-700">{s.faculty?.full_name ?? "—"}</td>
                      <td className="text-slate-600 text-sm">{s.term ?? ""} {s.academic_year ?? ""}</td>
                      <td className="text-slate-600 text-sm">{s.schedule ?? ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card glass">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-white">Student Sentiments</h2>
        </div>
        <div className="card-body bg-white/60 backdrop-blur">
          <div className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="table min-w-[680px]">
              <thead>
                <tr>
                  <th>Sentiment</th>
                  <th>Faculty</th>
                  <th>Section</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {sentiments.length === 0 ? (
                  <tr>
                    <td className="py-4 text-sm text-slate-600" colSpan={4}>
                      No sentiments yet.
                    </td>
                  </tr>
                ) : (
                  sentiments.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span className="pill">{s.sentiment}</span>
                      </td>
                      <td className="text-slate-700">{s.faculty?.full_name ?? "—"}</td>
                      <td className="text-slate-600 text-sm">
                        {s.section ? `${s.section.term ?? ""} ${s.section.academic_year ?? ""}` : "—"}
                      </td>
                      <td className="text-slate-600 text-sm">{new Date(s.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SectionScoresCard scores={sectionScores} />
    </main>
  );
}
