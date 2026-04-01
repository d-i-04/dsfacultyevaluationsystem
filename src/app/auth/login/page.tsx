import LoginForm from "./login-form";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const supabase = getSupabaseServerClient();
  const nextParam = searchParams?.next;
  const next = typeof nextParam === "string" && nextParam.startsWith("/") ? nextParam : "/student";

  const { data } = await supabase.auth.getUser();
  if (data?.user) {
    redirect(next);
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="relative hidden overflow-hidden hero-bg lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 opacity-20" aria-hidden>
          <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-accent/50 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-10 right-10 h-56 w-56 rounded-full bg-accent-light/30 blur-[80px]" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">F</div>
            <span className="text-lg font-semibold text-white">Faculty Evaluation System</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Welcome back.
          </h1>
          <p className="max-w-md text-lg text-slate-300">
            Sign in to manage evaluations, review faculty performance, or submit student sentiment.
          </p>

          <div className="space-y-4">
            {[
              { icon: "📊", title: "Admins", desc: "Manage periods, rubrics, assignments, and users" },
              { icon: "🎓", title: "Faculty", desc: "View scores, feedback, and sentiment insights" },
              { icon: "📝", title: "Students", desc: "Submit evaluations for assigned sections" },
            ].map((role) => (
              <div key={role.title} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur">
                <span className="mt-0.5 text-xl">{role.icon}</span>
                <div>
                  <div className="font-semibold text-white">{role.title}</div>
                  <p className="text-sm text-slate-400">{role.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Faculty Evaluation System
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex items-center justify-center bg-slate-50 p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 fade-in">
          <div className="lg:hidden">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">F</div>
              <span className="text-lg font-semibold text-ink">Faculty Evaluation System</span>
            </Link>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-ink">Sign in</h2>
            <p className="text-muted">Enter your credentials to access the portal.</p>
          </div>

          <LoginForm next={next} />

          <p className="text-center text-xs text-muted">
            <Link href="/" className="font-medium text-accent hover:text-accent-light transition-colors">
              &larr; Back to home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
