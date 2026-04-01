"use client";

import { FormEvent, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type PeriodOption = {
  id: string;
  name: string;
};

type SectionOption = {
  id: string;
  label: string;
  facultyId: string | null;
};

type RubricItem = {
  id: string;
  prompt: string;
  orderIndex: number;
  maxScore: number;
};

type RubricCategory = {
  id: string;
  label: string;
  description: string | null;
  orderIndex: number;
  items: RubricItem[];
};

type Props = {
  periods: PeriodOption[];
  sections: SectionOption[];
  categories: RubricCategory[];
};

export default function StudentForm({ periods, sections, categories }: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [status, setStatus] = useState<{ kind: "idle" | "success" | "error"; message?: string }>({ kind: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});

  const categoryTotals = useMemo(() => {
    return categories.map((cat) => {
      const total = cat.items.reduce((sum, item) => sum + (scores[item.id] ?? 0), 0);
      const max = cat.items.reduce((sum, item) => sum + (item.maxScore ?? 5), 0);
      return { id: cat.id, total, max };
    });
  }, [categories, scores]);

  const handleScoreChange = (itemId: string, value: number) => {
    setScores((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ kind: "idle" });
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const periodId = (formData.get("periodId") as string) || null;
    const sectionId = (formData.get("sectionId") as string) || null;
    const overallComment = (formData.get("comments") as string) || "";

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setStatus({ kind: "error", message: userError?.message || "You must be signed in to submit." });
      setIsSubmitting(false);
      return;
    }

    if (!periodId || !sectionId) {
      setStatus({ kind: "error", message: "Period and section are required." });
      setIsSubmitting(false);
      return;
    }

    const missingItems = categories
      .flatMap((cat) => cat.items)
      .filter((item) => scores[item.id] === undefined || scores[item.id] === null);

    if (missingItems.length > 0) {
      setStatus({ kind: "error", message: "Please rate every criterion (scale 1-5)." });
      setIsSubmitting(false);
      return;
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from("evaluator_assignments")
      .select("id")
      .eq("period_id", periodId)
      .eq("section_id", sectionId)
      .eq("evaluator_id", userData.user.id)
      .maybeSingle();

    if (assignmentError) {
      setStatus({ kind: "error", message: assignmentError.message });
      setIsSubmitting(false);
      return;
    }

    if (!assignment) {
      setStatus({ kind: "error", message: "No evaluator assignment found for this period and section." });
      setIsSubmitting(false);
      return;
    }

    const { data: evaluation, error: evaluationError } = await supabase
      .from("evaluations")
      .insert({ assignment_id: assignment.id, status: "submitted", overall_comment: overallComment || null })
      .select("id")
      .single();

    if (evaluationError || !evaluation) {
      setStatus({ kind: "error", message: evaluationError?.message || "Unable to create evaluation." });
      setIsSubmitting(false);
      return;
    }

    const payload = categories.flatMap((cat) =>
      cat.items.map((item) => ({
        evaluation_id: evaluation.id,
        rubric_item_id: item.id,
        score: scores[item.id],
        comment: null,
      }))
    );

    const { error: responseError } = await supabase.from("evaluation_responses").insert(payload);

    if (responseError) {
      setStatus({ kind: "error", message: responseError.message });
      setIsSubmitting(false);
      return;
    }

    setStatus({ kind: "success", message: "Evaluation submitted." });
    setScores({});
    setIsSubmitting(false);
    event.currentTarget.reset();
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {status.kind === "success" ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">{status.message}</div>
      ) : null}
      {status.kind === "error" ? (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">{status.message}</div>
      ) : null}

      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-5 text-sm text-slate-800">
        <p className="font-semibold text-ink">Instructions</p>
        <p className="mt-1 text-muted">
          Please evaluate the faculty using the scale below. Select one rating per criterion. Scores are saved with the
          chosen period and section.
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs font-semibold text-slate-700">
          <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
            <p>5</p>
            <p className="text-[11px] font-normal text-muted">Outstanding</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
            <p>4</p>
            <p className="text-[11px] font-normal text-muted">Very Satisfactory</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
            <p>3</p>
            <p className="text-[11px] font-normal text-muted">Satisfactory</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
            <p>2</p>
            <p className="text-[11px] font-normal text-muted">Fair</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
            <p>1</p>
            <p className="text-[11px] font-normal text-muted">Poor</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          Period
          <select
            name="periodId"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
            defaultValue=""
          >
            <option value="">Select an open period</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Section
          <select
            name="sectionId"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
            defaultValue=""
          >
            <option value="">Select a section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-6">
        {categories.map((cat) => {
          const totals = categoryTotals.find((c) => c.id === cat.id);
          return (
            <div key={cat.id} className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-base font-semibold text-ink">{cat.label}</p>
                  {cat.description ? <p className="text-xs text-muted mt-0.5">{cat.description}</p> : null}
                </div>
                {totals ? (
                  <div className="rounded-xl bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
                    Total: {totals.total} / {totals.max}
                  </div>
                ) : null}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Criteria</th>
                      {[5, 4, 3, 2, 1].map((score) => (
                        <th key={score} className="px-2 py-2 text-center text-xs font-semibold">{score}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cat.items.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                        <td className="px-3 py-2 align-top text-slate-800">
                          <div className="flex gap-2">
                            <span className="text-xs font-semibold text-slate-500">{item.orderIndex ?? index + 1}.</span>
                            <span>{item.prompt}</span>
                          </div>
                        </td>
                        {[5, 4, 3, 2, 1].map((score, scoreIdx) => (
                          <td key={score} className="px-2 py-2 text-center">
                            <input
                              type="radio"
                              name={`score-${item.id}`}
                              value={score}
                              required={scoreIdx === 0}
                              onChange={() => handleScoreChange(item.id, score)}
                              className="h-4 w-4 text-ink focus:ring-ink"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <label className="space-y-1 text-sm font-medium">
        Comments (optional)
        <textarea
          name="comments"
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
          placeholder="Share observations about the faculty member"
        />
      </label>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit evaluation"}
        </button>
        <button type="reset" className="btn-secondary" disabled={isSubmitting}>
          Reset
        </button>
      </div>
    </form>
  );
}
