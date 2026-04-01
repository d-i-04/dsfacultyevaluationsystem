import Link from "next/link";

const features = [
  {
    icon: "📊",
    title: "Administrator Dashboard",
    body: "Manage evaluation periods, rubrics, user accounts, and evaluator assignments from one control center.",
    href: "/admin",
  },
  {
    icon: "🎓",
    title: "Faculty Dashboard",
    body: "View performance ratings, evaluation summaries, and student sentiment in a unified dashboard.",
    href: "/faculty",
  },
  {
    icon: "📝",
    title: "Student Evaluation",
    body: "Submit rubric-based evaluations and qualitative feedback for assigned faculty and sections.",
    href: "/student",
  },
];

const modules = [
  { title: "Login", desc: "Role-based authentication for admins, faculty, and students.", href: "/auth/login" },
  { title: "Student Dashboard", desc: "Submit evaluations and sentiment for assigned sections.", href: "/student" },
  { title: "Faculty Evaluation Form", desc: "Rubric scoring with category averages and comments.", href: "/faculty" },
  { title: "Performance Rating", desc: "Faculty performance indicators across rubric categories.", href: "/faculty" },
  { title: "Evaluation Summary", desc: "Rollup of submitted evaluations by rubric category and period.", href: "/faculty" },
  { title: "Sentiment Report", desc: "Student qualitative feedback layered beside scored evaluations.", href: "/faculty" },
  { title: "Data Graphs & Analysis", desc: "Charts and recommendation insights for informed decisions.", href: "/faculty" },
];

const stats = [
  { label: "Roles", value: "3", sub: "Admin, Faculty, Student" },
  { label: "Evaluation Categories", value: "4", sub: "Rubric-based scoring" },
  { label: "Reports", value: "4", sub: "Rating, Summary, Sentiment, Graphs" },
];

export default function HomePage() {
  return (
    <main className="bg-sand">
      {/* Hero */}
      <section className="relative overflow-hidden hero-bg text-white">
        <div className="absolute inset-0 opacity-20" aria-hidden>
          <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-accent/50 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-accent-light/30 blur-[80px]" />
          <div className="pointer-events-none absolute right-10 top-10 h-40 w-40 rounded-full bg-white/10 blur-[60px]" />
        </div>

        <div className="section-shell relative z-10 py-20">
          <div className="max-w-3xl space-y-6">
            <div className="badge">Faculty Evaluation System</div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Streamline your entire
              <span className="gradient-text"> evaluation cycle.</span>
            </h1>
            <p className="max-w-2xl text-lg text-slate-300">
              A modern platform for managing faculty evaluations, collecting student sentiment, and generating
              actionable performance insights — all in one place.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/auth/login" className="btn-primary">Get Started</Link>
              <Link href="/admin" className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30">Admin Console</Link>
              <Link href="/faculty" className="btn-ghost">Faculty Dashboard</Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 backdrop-blur">
                <div className="text-3xl font-bold text-white">{s.value}</div>
                <div className="text-sm font-semibold text-white/80">{s.label}</div>
                <div className="text-xs text-slate-400">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="section-shell -mt-8">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card group p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-2xl transition-colors group-hover:bg-accent/20">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.body}</p>
              <Link href={f.href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent transition-colors hover:text-accent-light">
                Open &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* System modules */}
      <section className="section-shell">
        <div className="mb-8 max-w-2xl">
          <div className="badge">System Modules</div>
          <h2 className="mt-3 text-3xl font-bold text-ink">Everything the system covers</h2>
          <p className="mt-2 text-muted">
            Each module is accessible from the sidebar or direct links. Sign in to explore.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <Link
              key={m.title}
              href={m.href}
              className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-accent/30 hover:shadow-glow"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-ink">{m.title}</div>
                <p className="mt-1 text-sm text-muted">{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section-shell pb-20">
        <div className="relative overflow-hidden rounded-3xl hero-bg p-10 text-center text-white sm:p-16">
          <div className="absolute inset-0 opacity-20" aria-hidden>
            <div className="pointer-events-none absolute left-1/4 top-0 h-40 w-40 rounded-full bg-accent/50 blur-[80px]" />
            <div className="pointer-events-none absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-accent-light/30 blur-[60px]" />
          </div>
          <div className="relative z-10 mx-auto max-w-xl space-y-4">
            <h2 className="text-3xl font-bold">Ready to get started?</h2>
            <p className="text-slate-300">Sign in to access your dashboard and begin the evaluation process.</p>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/auth/login" className="btn-primary">Sign In</Link>
              <Link href="/student" className="btn-ghost">Student Entry</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
