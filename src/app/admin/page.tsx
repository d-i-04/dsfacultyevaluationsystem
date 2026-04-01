import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import PeriodManager from "@/components/admin/period-manager";
import RubricManager from "@/components/admin/rubric-manager";

export const dynamic = "force-dynamic";

type Period = {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
};

type Category = {
  id: string;
  label: string;
  description: string | null;
  items: { id: string; prompt: string; order_index: number }[];
};

type Metrics = {
  periods: number;
  rubricItems: number;
  sentiments: number;
  sections: number;
};

async function loadData() {
  const supabase = getSupabaseServerClient();

  const [periodsResult, categoriesResult, periodCount, itemCount, sentimentCount, sectionCount] = await Promise.all([
    supabase
      .from("evaluation_periods")
      .select("id, name, status, start_date, end_date")
      .order("start_date", { ascending: false })
      .limit(50),
    supabase
      .from("rubric_categories")
      .select("id, label, description, order_index, rubric_items ( id, prompt, order_index )")
      .order("order_index", { ascending: true }),
    supabase.from("evaluation_periods").select("id", { count: "exact", head: true }),
    supabase.from("rubric_items").select("id", { count: "exact", head: true }),
    supabase.from("student_sentiments").select("id", { count: "exact", head: true }),
    supabase.from("sections").select("id", { count: "exact", head: true }),
  ]);

  const periods: Period[] = periodsResult.data ?? [];
  const categories: Category[] = (categoriesResult.data ?? []).map((cat: any) => ({
    id: cat.id,
    label: cat.label,
    description: cat.description,
    items: Array.isArray(cat.rubric_items)
      ? cat.rubric_items.map((item: any) => ({ id: item.id, prompt: item.prompt, order_index: item.order_index }))
      : [],
  }));

  const metrics: Metrics = {
    periods: periodCount.count ?? 0,
    rubricItems: itemCount.count ?? 0,
    sentiments: sentimentCount.count ?? 0,
    sections: sectionCount.count ?? 0,
  };

  return {
    periods,
    categories,
    metrics,
    errors: {
      periods: periodsResult.error?.message,
      categories: categoriesResult.error?.message,
    },
  };
}

export default async function AdminPage() {
  const { periods, categories, metrics, errors } = await loadData();

  return (
    <main className="dashboard-bg min-h-screen">
      <div className="section-shell space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="badge">Dashboard</div>
            <h1 className="mt-2 text-3xl font-bold text-white">Faculty evaluation control center</h1>
            <p className="text-slate-400 text-sm mt-1">
              Track evaluation periods, manage rubrics, and review data at a glance.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard title="Periods" value={metrics.periods} tone="blue" />
          <StatCard title="Rubric Items" value={metrics.rubricItems} tone="green" />
          <StatCard title="Sections" value={metrics.sections} tone="purple" />
          <StatCard title="Sentiments" value={metrics.sentiments} tone="amber" />
        </section>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="card glass lg:col-span-12">
            <div className="card-header">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Timeline</p>
                <h2 className="text-lg font-semibold text-white">Evaluation periods</h2>
              </div>
              <span className="badge">Manage</span>
            </div>
            <div className="card-body bg-white/60 backdrop-blur">
              <PeriodManager initialPeriods={periods} error={errors.periods} />
            </div>
          </div>
          </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="card glass lg:col-span-12">
            <div className="card-header">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Rubric</p>
                <h2 className="text-lg font-semibold text-white">Categories & items</h2>
              </div>
            </div>
            <div className="card-body bg-white/60 backdrop-blur">
              <RubricManager initialCategories={categories} error={errors.categories} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

type StatProps = {
  title: string;
  value: number;
  tone: "blue" | "green" | "purple" | "amber";
};

function StatCard({ title, value, tone }: StatProps) {
  const toneClasses: Record<string, string> = {
    blue: "from-indigo-500/20 to-indigo-600/30 text-indigo-300",
    green: "from-emerald-500/20 to-emerald-600/30 text-emerald-300",
    purple: "from-violet-500/20 to-violet-600/30 text-violet-300",
    amber: "from-amber-500/20 to-amber-600/30 text-amber-300",
  };

  return (
    <div className="stat-card">
      <div className={`rounded-2xl bg-gradient-to-br ${toneClasses[tone]} p-5`}>
        <p className="text-xs font-medium uppercase tracking-wider text-white/60">{title}</p>
        <p className="mt-1 text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
