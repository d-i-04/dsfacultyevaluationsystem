"use client";

import { FormEvent, useState } from "react";

type RubricItem = {
  id: string;
  prompt: string;
  max_score: number;
  order_index: number;
};

type RubricCategory = {
  id: string;
  label: string;
  description: string | null;
  order_index: number;
  rubric_items: RubricItem[];
};

type Props = {
  assignmentId: string;
  periodId: string;
  facultyName: string;
  evaluationRole: string;
  categories: RubricCategory[];
};

type ResponseData = {
  [itemId: string]: number;
};

export default function EvaluationForm({
  assignmentId,
  periodId,
  facultyName,
  evaluationRole,
  categories,
}: Props) {
  const [responses, setResponses] = useState<ResponseData>({});
  const [overallComment, setOverallComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleScoreChange = (itemId: string, score: number) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: score,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    // Validate all items have scores
    const totalItems = categories.reduce((sum, cat) => sum + cat.rubric_items.length, 0);
    const scoredItems = Object.keys(responses).length;

    if (scoredItems < totalItems) {
      setMessage(`Please score all ${totalItems} items (${scoredItems} completed)`);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          periodId,
          overallComment,
          responses,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`Error: ${data.error || "Failed to submit evaluation"}`);
        setIsSubmitting(false);
        return;
      }

      setMessage("✅ Evaluation submitted successfully!");
      setResponses({});
      setOverallComment("");
      
      // Refresh page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded bg-blue-50 p-3 text-sm text-blue-800">
        <p className="font-semibold">Faculty: {facultyName}</p>
        <p className="text-xs">Role: {evaluationRole.charAt(0).toUpperCase() + evaluationRole.slice(1)}</p>
      </div>

      {categories.map((category) => (
        <fieldset key={category.id} className="rounded border border-slate-300 p-4">
          <legend className="font-semibold text-slate-900">{category.label}</legend>
          {category.description && (
            <p className="mb-3 text-xs text-slate-600">{category.description}</p>
          )}

          <div className="space-y-3">
            {category.rubric_items.map((item) => (
              <div key={item.id} className="border-t border-slate-200 pt-3">
                <label className="block text-sm font-medium text-slate-800 mb-2">
                  {item.prompt}
                </label>
                <div className="flex gap-2">
                  {Array.from({ length: item.max_score }, (_, i) => i + 1).map((score) => (
                    <label key={score} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name={item.id}
                        value={score}
                        checked={responses[item.id] === score}
                        onChange={() => handleScoreChange(item.id, score)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-600">{score}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">
          Overall Comments (Optional)
        </label>
        <textarea
          value={overallComment}
          onChange={(e) => setOverallComment(e.target.value)}
          placeholder="Add any additional feedback or comments..."
          rows={4}
          className="input w-full"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Evaluation"}
        </button>
      </div>

      {message && (
        <div
          className={`rounded px-3 py-2 text-sm ${
            message.startsWith("✅")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      {Object.keys(responses).length > 0 && (
        <p className="text-xs text-slate-600">
          Progress: {Object.keys(responses).length} of{" "}
          {categories.reduce((sum, cat) => sum + cat.rubric_items.length, 0)} items scored
        </p>
      )}
    </form>
  );
}
