"use client";

import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const roles = ["admin", "faculty", "student", "evaluator"];

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  department_id: string | null;
};

type Props = {
  initialProfiles: Profile[];
  error?: string;
};

export default function UsersTable({ initialProfiles, error }: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [message, setMessage] = useState<string | null>(error ?? null);

  const updateRole = async (id: string, role: string) => {
    setMessage(null);
    const { error: updateError } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (updateError) {
      setMessage(updateError.message);
      return;
    }
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
  };

  return (
    <div className="space-y-3">
      {message ? <p className="text-sm text-rose-700">{message}</p> : null}

      <div className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="table min-w-[640px]">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td className="py-4 text-sm text-slate-600" colSpan={5}>
                  No users found.
                </td>
              </tr>
            ) : (
              profiles.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold text-slate-900">{p.full_name ?? "(no name)"}</td>
                  <td className="text-slate-700">{p.email ?? ""}</td>
                  <td>
                    <select
                      className="input w-32"
                      value={p.role}
                      onChange={(e) => updateRole(p.id, e.target.value)}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-slate-600 text-sm">{p.department_id ?? "—"}</td>
                  <td className="text-right text-sm text-slate-500">Role change saves instantly</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
