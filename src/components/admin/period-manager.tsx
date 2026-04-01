"use client";

import { useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Period = {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
};

type Props = {
  initialPeriods: Period[];
  error?: string;
};

type FormState = {
  name: string;
  start_date: string;
  end_date: string;
  status: string;
};

export default function PeriodManager({ initialPeriods, error }: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [periods, setPeriods] = useState<Period[]>(initialPeriods);
  const [form, setForm] = useState<FormState>({ name: "", start_date: "", end_date: "", status: "draft" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      name: form.name,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
      rubric_version: "v1",
    };

    const { data, error: insertError } = await supabase
      .from("evaluation_periods")
      .insert(payload)
      .select("id, name, status, start_date, end_date")
      .single();

    if (insertError) {
      setMessage(insertError.message);
      setSaving(false);
      return;
    }

    if (data) {
      setPeriods((prev) => [data, ...prev]);
      setForm({ name: "", start_date: "", end_date: "", status: "draft" });
      router.refresh();
    }

    setSaving(false);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setMessage(null);
    const { error: updateError } = await supabase
      .from("evaluation_periods")
      .update({ status })
      .eq("id", id);

    if (updateError) {
      setMessage(updateError.message);
      return;
    }

    setPeriods((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    setMessage(null);
    const { error: deleteError } = await supabase.from("evaluation_periods").delete().eq("id", id);
    if (deleteError) {
      setMessage(deleteError.message);
      return;
    }
    setPeriods((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="text-sm text-rose-700">{message}</p> : null}

      <form className="grid gap-3 md:grid-cols-5" onSubmit={handleCreate}>
        <input
          required
          className="input"
          placeholder="Period name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          type="date"
          className="input"
          value={form.start_date}
          onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
        />
        <input
          type="date"
          className="input"
          value={form.end_date}
          onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
        />
        <select
          className="input"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="draft">Draft</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving" : "Add period"}
        </button>
      </form>

      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {periods.length === 0 ? (
          <p className="p-4 text-sm text-slate-600">No periods yet.</p>
        ) : (
          periods.map((period) => (
            <div key={period.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{period.name}</p>
                <p className="text-xs text-slate-500">
                  {period.start_date ?? ""} {period.end_date ? `→ ${period.end_date}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="input w-32"
                  value={period.status}
                  onChange={(e) => handleUpdateStatus(period.id, e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
                <button className="btn-secondary" onClick={() => handleDelete(period.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
