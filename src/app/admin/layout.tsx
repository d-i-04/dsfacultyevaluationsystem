import type { ReactNode } from "react";
import SidebarNav from "@/components/chrome/sidebar-nav";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex">
        <aside className="sidebar">
          <div className="flex flex-col h-full px-5 py-6">
            <Link href="/" className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">F</div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Faculty Eval</p>
                <p className="text-sm font-semibold text-white">Academy</p>
              </div>
            </Link>
            <SidebarNav />
            <div className="mt-auto pt-8 border-t border-white/[0.06]">
              <Link href="/auth/login" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/[0.06] hover:text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <header className="topbar">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  className="input w-full !rounded-xl border-white/[0.08] bg-white/[0.04] text-white placeholder:text-slate-500 focus:border-accent/40 focus:ring-accent/10"
                  placeholder="Search..."
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-500">⌘K</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">A</div>
              </div>
            </div>
          </header>

          <main className="pb-12 pt-4 fade-in">{children}</main>
        </div>
      </div>
    </div>
  );
}