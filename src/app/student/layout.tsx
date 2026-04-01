import type { ReactNode } from "react";
import Link from "next/link";
import StudentTabNav from "@/components/chrome/student-tab-nav";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/[0.06] bg-slate-950/90 backdrop-blur-xl">
        <div className="section-shell flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">
              F
            </Link>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Student Portal</p>
              <p className="text-sm font-semibold text-white">Evaluation System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="btn-ghost text-xs">Admin</Link>
            <Link href="/auth/login" className="btn-ghost text-xs">Sign out</Link>
          </div>
        </div>
        <div className="section-shell !py-0">
          <StudentTabNav />
        </div>
      </header>
      <main className="fade-in">{children}</main>
    </div>
  );
}
