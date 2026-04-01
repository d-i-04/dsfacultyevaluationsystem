"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
  icon: string;
  role?: string;
  section?: string;
};

const managedRoles = new Set(["faculty", "student"]);

const links: NavLink[] = [
  { href: "/admin", label: "Dashboard", icon: "📊", section: "Management" },
  { href: "/admin/assignments", label: "Assignments", icon: "🎯" },
  { href: "/admin/records", label: "Records", icon: "📚" },
  { href: "/admin/users", label: "Users", icon: "👥", section: "People" },
  { href: "/admin/users?role=faculty", label: "Faculty", icon: "🎓", role: "faculty" },
  { href: "/admin/users?role=student", label: "Students", icon: "🧑‍🎓", role: "student" },
  { href: "/faculty", label: "My Dashboard", icon: "🏫", section: "Personal" },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRole = searchParams?.get("role") ?? null;

  let lastSection = "";

  return (
    <nav className="space-y-1 text-sm">
      {links.map((link) => {
        const linkPath = link.href.split("?")[0];
        const pathMatch = pathname === linkPath || pathname.startsWith(`${linkPath}/`);
        const roleMatch = link.role
          ? currentRole === link.role
          : !managedRoles.has(currentRole ?? "");
        const active = pathMatch && roleMatch;

        const showSection = link.section && link.section !== lastSection;
        if (link.section) lastSection = link.section;

        return (
          <div key={link.href}>
            {showSection && (
              <div className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 first:mt-0">
                {link.section}
              </div>
            )}
            <Link
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 ${
                active
                  ? "bg-accent/15 text-accent font-semibold shadow-sm"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
