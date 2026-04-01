"use client";

import { FormEvent, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Period = { id: string; name: string };
type Section = { id: string; label: string };
type RubricItem = { id: string; prompt: string; orderIndex: number; maxScore: number };
type RubricCategory = { id: string; label: string; description: string | null; orderIndex: number; items: RubricItem[] };

type Props = {
  periods: Period[];
  sections: Section[];
  categories: RubricCategory[];
};

export default function SelfEvaluationForm({ periods, sections, categories }: Props) {
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
      setStatus({ kind: "error", message: userError?.message || "You must be signed in." });
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

    const userId = userData.user.id;

    // Look for existing self-evaluation assignment
    let { data: assignment, error: assignmentError } = await supabase
      .from("evaluator_assignments")
      .select("id")
      .eq("period_id", periodId)
      .eq("section_id", sectionId)
      .eq("faculty_id", userId)
      .eq("evaluator_id", userId)
      .eq("role", "self")
      .maybeSingle();

    if (assignmentError) {
      setStatus({ kind: "error", message: assignmentError.message });
      setIsSubmitting(false);
      return;
    }

    // Auto-create self assignment if it doesn't exist
    if (!assignment) {
      const { data: newAssignment, error: createErr } = await supabase
        .from("evaluator_assignments")
        .insert({
          period_id: periodId,
          section_id: sectionId,
          faculty_id: userId,
          evaluator_id: userId,
          role: "self",
        })
        .select("id")
        .single();

      if (createErr || !newAssignment) {
        setStatus({ kind: "error", message: createErr?.message || "Unable to create self-evaluation assignment." });
        setIsSubmitting(false);
        return;
      }
      assignment = newAssignment;
    }

    // Check for existing evaluation on this assignment
    const { data: existingEval } = await supabase
      .from("evaluations")
      .select("id")
      .eq("assignment_id", assignment.id)
      .maybeSingle();

    let evaluationId: string;

    if (existingEval) {
      // Update existing
      const { error: updateErr } = await supabase
        .from("evaluations")
        .update({ status: "submitted", overall_comment: overallComment || null, submitted_at: new Date().toISOString() })
        .eq("id", existingEval.id);

      if (updateErr) {
        setStatus({ kind: "error", message: updateErr.message });
        setIsSubmitting(false);
        return;
      }

      // Remove old responses
      await supabase.from("evaluation_responses").delete().eq("evaluation_id", existingEval.id);
      evaluationId = existingEval.id;
    } else {
      const { data: newEval, error: evalErr } = await supabase
        .from("evaluations")
        .insert({ assignment_id: assignment.id, status: "submitted", overall_comment: overallComment || null })
        .select("id")
        .single();

      if (evalErr || !newEval) {
        setStatus({ kind: "error", message: evalErr?.message || "Unable to create evaluation." });
        setIsSubmitting(false);
        return;
      }
      evaluationId = newEval.id;
    }

    const payload = categories.flatMap((cat) =>
      cat.items.map((item) => ({
        evaluation_id: evaluationId,
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

    setStatus({ kind: "success", message: "Self-evaluation submitted successfully!" });
    setScores({});
    setIsSubmitting(false);
    event.currentTarget.reset();
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {status.kind === "success" && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">{status.message}</div>
      )}
      {status.kind === "error" && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">{status.message}</div>
      )}

      {/* Self-evaluation notice */}
      <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-white p-5 text-sm text-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">Self</span>
          <p className="font-semibold text-ink">Self-Evaluation Instructions</p>
        </div>
        <p className="text-muted">
          Rate your own teaching performance honestly using the scale below. Self-evaluations help identify areas of strength and opportunities for growth.
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs font-semibold text-slate-700">
          <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
            <p>5</p><p className="text-[11px] font-normal text-muted">Outstanding</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
            <p>4</p><p className="text-[11px] font-normal text-muted">Very Satisfactory</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
            <p>3</p><p className="text-[11px] font-normal text-muted">Satisfactory</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
            <p>2</p><p className="text-[11px] font-normal text-muted">Fair</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
            <p>1</p><p className="text-[11px] font-normal text-muted">Poor</p>
          </div>
        </div>
      </div>

      {/* Period & Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          Evaluation Period
          <select name="periodId" required className="input" defaultValue="">
            <option value="">Select an open period</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Your Section
          <select name="sectionId" required className="input" defaultValue="">
            <option value="">Select a section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Rubric categories */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const totals = categoryTotals.find((c) => c.id === cat.id);
          return (
            <div key={cat.id} className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-base font-semibold text-ink">{cat.label}</p>
                  {cat.description && <p className="text-xs text-muted mt-0.5">{cat.description}</p>}
                </div>
                {totals && (
                  <div className="rounded-xl bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
                    Total: {totals.total} / {totals.max}
                  </div>
                )}
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
                              className="h-4 w-4 text-accent focus:ring-accent"
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

      {/* Comments */}
      <label className="space-y-1 text-sm font-medium">
        Self-Reflection Comments (optional)
        <textarea
          name="comments"
          rows={4}
          className="input"
          placeholder="Reflect on your teaching performance, challenges, and goals for improvement..."
        />
      </label>

      {/* Submit */}
      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Submitting...
            </span>
          ) : (
            "Submit Self-Evaluation"
          )}
        </button>
        <button type="reset" className="btn-secondary" disabled={isSubmitting} onClick={() => { setScores({}); setStatus({ kind: "idle" }); }}>
          Reset
        </button>
      </div>
    </form>
  );
}
