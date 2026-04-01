"use client";

import { FormEvent, useState } from "react";

type DepartmentOption = { id: string; name: string };

type Props = {
  departments: DepartmentOption[];
  defaultRole?: "admin" | "faculty" | "student" | "evaluator";
};

export default function AddUserForm({ departments, defaultRole = "faculty" }: Props) {
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState(defaultRole);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const fullName = (form.get("full_name") as string)?.trim();
    const email = (form.get("email") as string)?.trim();
    const password = (form.get("password") as string) ?? "";
    const departmentId = (form.get("department_id") as string) || null;

    if (!fullName) {
      setMessage({ kind: "error", text: "Name is required." });
      setIsSubmitting(false);
      return;
    }

    if (!email) {
      setMessage({ kind: "error", text: "Email is required." });
      setIsSubmitting(false);
      return;
    }

    if (!password) {
      setMessage({ kind: "error", text: "Password is required." });
      setIsSubmitting(false);
      return;
    }
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email, password, role, department_id: departmentId || null }),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage({ kind: "error", text: payload.error ?? "Unable to create user." });
      setIsSubmitting(false);
      return;
    }

    setMessage({ kind: "success", text: `${role} added.` });
    setIsSubmitting(false);
    event.currentTarget.reset();
    setRole(defaultRole);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {message ? (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            message.kind === "success" ? "bg-green-900/30 text-green-100" : "bg-rose-900/30 text-rose-100"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          Full name
          <input
            required
            name="full_name"
            className="input w-full"
            placeholder="Jane Doe"
            disabled={isSubmitting}
          />
        </label>

        <label className="space-y-1 text-sm font-medium">
          Email
          <input
            type="email"
            name="email"
            className="input w-full"
            placeholder="jane@example.edu"
            disabled={isSubmitting}
          />
        </label>
      </div>

      <label className="space-y-1 text-sm font-medium">
        Password
        <input
          type="password"
          name="password"
          className="input w-full"
          placeholder="Set a temporary password"
          disabled={isSubmitting}
          required
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1 text-sm font-medium">
          Role
          <select
            name="role"
            className="input w-full"
            value={role}
            onChange={(e) => setRole(e.target.value as typeof defaultRole)}
            disabled={isSubmitting}
          >
            <option value="admin">Admin</option>
            <option value="faculty">Faculty</option>
            <option value="student">Student</option>
            <option value="evaluator">Evaluator</option>
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium md:col-span-2">
          Department (optional)
          <select name="department_id" className="input w-full" defaultValue="" disabled={isSubmitting}>
            <option value="">Unassigned</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Add user"}
        </button>
        <button type="reset" className="btn-secondary" disabled={isSubmitting}>
          Reset
        </button>
      </div>
    </form>
  );
}