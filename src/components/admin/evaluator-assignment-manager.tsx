"use client";

import { useState, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

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

type Props = {
  initialAssignments: Assignment[];
  faculty: Faculty[];
  periods: Period[];
  sections: Section[];
};

const evaluationRoles = ["self", "peer", "supervisor", "student"];

export default function EvaluatorAssignmentManager({
  initialAssignments,
  faculty,
  periods,
  sections,
}: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [message, setMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    period_id: "",
    faculty_id: "",
    evaluator_id: "",
    role: "peer",
    section_id: "",
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setIsCreating(true);

    if (!formData.period_id || !formData.faculty_id || !formData.evaluator_id) {
      setMessage("Please select period, faculty, and evaluator");
      setIsCreating(false);
      return;
    }

    const { error } = await supabase.from("evaluator_assignments").insert({
      period_id: formData.period_id,
      faculty_id: formData.faculty_id,
      evaluator_id: formData.evaluator_id,
      role: formData.role,
      section_id: formData.section_id || null,
    });

    setIsCreating(false);

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    setMessage("Assignment created successfully");
    setFormData({
      period_id: "",
      faculty_id: "",
      evaluator_id: "",
      role: "peer",
      section_id: "",
    });

    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this assignment?")) return;

    setMessage(null);
    const { error } = await supabase.from("evaluator_assignments").delete().eq("id", id);

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    setAssignments(assignments.filter(a => a.id !== id));
    setMessage("Assignment deleted");
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white/40 p-4">
        <h3 className="font-semibold text-slate-900">Create New Assignment</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <select
            required
            value={formData.period_id}
            onChange={(e) => setFormData({ ...formData, period_id: e.target.value })}
            className="input"
          >
            <option value="">Select Period</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>

          <select
            required
            value={formData.faculty_id}
            onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
            className="input"
          >
            <option value="">Select Faculty (to be evaluated)</option>
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.full_name} ({f.email})
              </option>
            ))}
          </select>

          <select
            required
            value={formData.evaluator_id}
            onChange={(e) => setFormData({ ...formData, evaluator_id: e.target.value })}
            className="input"
          >
            <option value="">Select Evaluator</option>
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.full_name} ({f.email})
              </option>
            ))}
          </select>

          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="input"
          >
            {evaluationRoles.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={formData.section_id}
            onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
            className="input"
          >
            <option value="">Select Section (optional)</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.course?.code} - {s.term}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={isCreating}
            className="btn-primary disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create Assignment"}
          </button>
        </div>

        {message && (
          <p className={`rounded px-2 py-1 text-sm ${message.includes("Error") ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"}`}>
            {message}
          </p>
        )}
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-slate-900">
          <thead className="border-b border-slate-300 bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-left">Period</th>
              <th className="px-4 py-2 text-left">Faculty</th>
              <th className="px-4 py-2 text-left">Evaluator</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Section</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-3 text-center text-slate-600">
                  No assignments yet
                </td>
              </tr>
            ) : (
              assignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium">{assignment.period?.name}</td>
                  <td className="px-4 py-2">{assignment.faculty?.full_name}</td>
                  <td className="px-4 py-2">{assignment.evaluator?.full_name}</td>
                  <td className="px-4 py-2 capitalize">{assignment.role}</td>
                  <td className="px-4 py-2 text-xs">
                    {assignment.section?.course?.code}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
