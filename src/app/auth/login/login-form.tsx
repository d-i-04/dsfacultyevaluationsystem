"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Props = {
  next: string;
};

export default function LoginForm({ next }: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [status, setStatus] = useState<{ kind: "idle" | "error"; message?: string }>({ kind: "idle" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        router.replace(next);
      }
    });
    return () => {
      mounted = false;
    };
  }, [next, router, supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ kind: "idle" });
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string) || "";
    const password = (formData.get("password") as string) || "";

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus({ kind: "error", message: error.message });
      setLoading(false);
      return;
    }

    router.replace(next);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {status.kind === "error" ? (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">{status.message}</div>
      ) : null}

      <label className="block space-y-1.5 text-sm font-medium text-slate-700">
        Email
        <input
          name="email"
          type="email"
          required
          className="input"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </label>

      <label className="block space-y-1.5 text-sm font-medium text-slate-700">
        Password
        <input
          name="password"
          type="password"
          required
          className="input"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </label>

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Signing in...
          </span>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
