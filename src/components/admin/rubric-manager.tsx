"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Item = { id: string; prompt: string; order_index: number };
type Category = { id: string; label: string; description: string | null; items: Item[] };

type Props = {
  initialCategories: Category[];
  error?: string;
};

export default function RubricManager({ initialCategories, error }: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [catForm, setCatForm] = useState({ label: "", description: "" });
  const [message, setMessage] = useState<string | null>(null);

  const createCategory = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const { data, error: insertError } = await supabase
      .from("rubric_categories")
      .insert({ label: catForm.label, description: catForm.description, order_index: categories.length })
      .select("id, label, description, order_index")
      .single();

    if (insertError) {
      setMessage(insertError.message);
      return;
    }

    if (data) {
      setCategories((prev) => [...prev, { ...data, items: [] }]);
      setCatForm({ label: "", description: "" });
      router.refresh();
    }
  };

  const deleteCategory = async (id: string) => {
    setMessage(null);
    const { error: deleteError } = await supabase.from("rubric_categories").delete().eq("id", id);
    if (deleteError) {
      setMessage(deleteError.message);
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  };

  const addItem = async (categoryId: string, prompt: string) => {
    setMessage(null);
    const cat = categories.find((c) => c.id === categoryId);
    const nextOrder = cat ? cat.items.length + 1 : 1;

    const { data, error: insertError } = await supabase
      .from("rubric_items")
      .insert({ category_id: categoryId, prompt, order_index: nextOrder })
      .select("id, prompt, order_index")
      .single();

    if (insertError) {
      setMessage(insertError.message);
      return;
    }

    if (data) {
      setCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, items: [...c.items, data].sort((a, b) => a.order_index - b.order_index) } : c))
      );
      router.refresh();
    }
  };

  const deleteItem = async (id: string, categoryId: string) => {
    setMessage(null);
    const { error: deleteError } = await supabase.from("rubric_items").delete().eq("id", id);
    if (deleteError) {
      setMessage(deleteError.message);
      return;
    }
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, items: c.items.filter((i) => i.id !== id) } : c)));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="text-sm text-rose-700">{message}</p> : null}

      <form className="grid gap-3" onSubmit={createCategory}>
        <div className="grid gap-2">
          <input
            required
            className="input"
            placeholder="Add category"
            value={catForm.label}
            onChange={(e) => setCatForm((f) => ({ ...f, label: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Description (optional)"
            value={catForm.description}
            onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <button className="btn-primary" type="submit">Add category</button>
      </form>

      <div className="space-y-3">
        {categories.length === 0 ? (
          <p className="text-sm text-slate-600">No categories yet.</p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{cat.label}</p>
                  {cat.description ? <p className="text-xs text-slate-500">{cat.description}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary" onClick={() => deleteCategory(cat.id)}>
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {cat.items.length === 0 ? (
                  <p className="text-xs text-slate-500">No items</p>
                ) : (
                  cat.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 p-2">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="text-xs font-semibold text-slate-500">{item.order_index}.</span>
                        <span>{item.prompt}</span>
                      </div>
                      <button className="text-xs font-semibold text-rose-600" onClick={() => deleteItem(item.id, cat.id)}>
                        Remove
                      </button>
                    </div>
                  ))
                )}

                <AddItemInline onAdd={(prompt) => addItem(cat.id, prompt)} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

type AddItemProps = { onAdd: (prompt: string) => void };

function AddItemInline({ onAdd }: AddItemProps) {
  const [prompt, setPrompt] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!prompt.trim()) return;
    setSaving(true);
    await onAdd(prompt.trim());
    setPrompt("");
    setSaving(false);
  };

  return (
    <form className="flex gap-2" onSubmit={submit}>
      <input
        className="input flex-1"
        placeholder="Add rubric item"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? "Saving" : "Add"}
      </button>
    </form>
  );
}
