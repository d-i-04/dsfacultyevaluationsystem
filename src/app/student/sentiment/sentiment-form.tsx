"use client";

import { FormEvent, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Period = { id: string; name: string };
type Section = { id: string; label: string; facultyId: string | null; facultyName: string };

type Props = {
  periods: Period[];
  sections: Section[];
};

const sentimentOptions = [
  { value: "positive", label: "Positive", emoji: "😊", color: "border-emerald-500 bg-emerald-500/10 text-emerald-300", activeRing: "ring-emerald-500" },
  { value: "neutral", label: "Neutral", emoji: "😐", color: "border-slate-400 bg-slate-500/10 text-slate-300", activeRing: "ring-slate-400" },
  { value: "negative", label: "Negative", emoji: "😞", color: "border-rose-500 bg-rose-500/10 text-rose-300", activeRing: "ring-rose-500" },
];

export default function SentimentForm({ periods, sections }: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [status, setStatus] = useState<{ kind: "idle" | "success" | "error"; message?: string }>({ kind: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>("");

  const currentSection = sections.find((s) => s.id === selectedSection);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ kind: "idle" });
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const periodId = (formData.get("periodId") as string) || null;
    const sectionId = selectedSection || null;
    const comments = (formData.get("comments") as string) || "";

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setStatus({ kind: "error", message: "You must be signed in to submit sentiment." });
      setIsSubmitting(false);
      return;
    }

    if (!periodId) {
      setStatus({ kind: "error", message: "Please select an evaluation period." });
      setIsSubmitting(false);
      return;
    }

    if (!sectionId) {
      setStatus({ kind: "error", message: "Please select a section." });
      setIsSubmitting(false);
      return;
    }

    if (!selectedSentiment) {
      setStatus({ kind: "error", message: "Please select a sentiment (Positive, Neutral, or Negative)." });
      setIsSubmitting(false);
      return;
    }

    const facultyId = currentSection?.facultyId ?? null;
    if (!facultyId) {
      setStatus({ kind: "error", message: "No faculty assigned to this section." });
      setIsSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("student_sentiments").insert({
      period_id: periodId,
      section_id: sectionId,
      faculty_id: facultyId,
      student_id: userData.user.id,
      sentiment: selectedSentiment,
      comments: comments.trim() || null,
    });

    if (insertError) {
      setStatus({ kind: "error", message: insertError.message });
      setIsSubmitting(false);
      return;
    }

    setStatus({ kind: "success", message: "Sentiment submitted successfully! Thank you for your feedback." });
    setSelectedSentiment(null);
    setSelectedSection("");
    setIsSubmitting(false);
    event.currentTarget.reset();
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {status.kind === "success" && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
          {status.message}
        </div>
      )}
      {status.kind === "error" && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          {status.message}
        </div>
      )}

      {/* Period selection */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Evaluation Period</label>
        <select name="periodId" required className="input" defaultValue="">
          <option value="">Select an open period</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Section selection */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Section / Faculty</label>
        <select
          className="input"
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          required
        >
          <option value="">Select a section</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        {currentSection && (
          <p className="text-xs text-slate-500 mt-1">
            Faculty: <span className="font-semibold">{currentSection.facultyName}</span>
          </p>
        )}
      </div>

      {/* Sentiment selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Your Sentiment</label>
        <div className="grid grid-cols-3 gap-3">
          {sentimentOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedSentiment(opt.value)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
                selectedSentiment === opt.value
                  ? `${opt.color} ring-2 ${opt.activeRing}`
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="text-3xl">{opt.emoji}</span>
              <span className={`text-sm font-semibold ${
                selectedSentiment === opt.value ? "" : "text-slate-700"
              }`}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Comments (optional)</label>
        <textarea
          name="comments"
          rows={4}
          className="input"
          placeholder="Share your feedback about this faculty member..."
        />
        <p className="text-xs text-slate-400">
          Your comments help faculty understand specific areas of strength or improvement.
        </p>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Submitting...
            </span>
          ) : (
            "Submit Sentiment"
          )}
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={isSubmitting}
          onClick={() => {
            setSelectedSentiment(null);
            setSelectedSection("");
            setStatus({ kind: "idle" });
          }}
        >
          Reset
        </button>
      </div>
    </form>
  );
}
