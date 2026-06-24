"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const hodLinks = [
  { label: "Dashboard", href: "/dashboard/hod", icon: "🏠" },
  { section: "Academic" },
  { label: "Batches", href: "/dashboard/hod/batches", icon: "🎓" },
  { label: "Timetable", href: "/dashboard/hod/timetable", icon: "📅" },
  { label: "Courses", href: "/dashboard/hod/subjects", icon: "📚" },
  { label: "Marks", href: "/dashboard/hod/marks", icon: "📊" },
  { label: "Exams", href: "/dashboard/hod/exams", icon: "📝" },
  { label: "Projects", href: "/dashboard/hod/projects", icon: "🔬" },
  { section: "People" },
  { label: "Users", href: "/dashboard/hod/users", icon: "👥" },
  { label: "Lecturers", href: "/dashboard/hod/lecturers", icon: "👨‍🏫" },
  { label: "Students", href: "/dashboard/hod/students", icon: "👨‍🎓" },
  { section: "Administration" },
  { label: "Payments", href: "/dashboard/hod/payments", icon: "💰" },
  { label: "Settings", href: "/dashboard/hod/settings", icon: "⚙️" },
];

const coordinatorLinks = [
  { label: "Dashboard", href: "/dashboard/coordinator", icon: "🏠" },
  { section: "Academic" },
  { label: "My Batches", href: "/dashboard/coordinator/batches", icon: "🎓" },
  { label: "Timetable", href: "/dashboard/coordinator/timetable", icon: "📅" },
  { label: "Subjects", href: "/dashboard/coordinator/subjects", icon: "📚" },
  { label: "Marks", href: "/dashboard/coordinator/marks", icon: "📝" },
  { label: "Projects", href: "/dashboard/coordinator/projects", icon: "🔬" },
  { section: "People" },
  { label: "Users", href: "/dashboard/coordinator/users", icon: "👥" },
  { label: "Students", href: "/dashboard/coordinator/students", icon: "👨‍🎓" },
  { section: "Finance" },
  { label: "Payments", href: "/dashboard/coordinator/payments", icon: "💰" },
];

const lecturerLinks = [
  { label: "Dashboard", href: "/dashboard/lecturer", icon: "🏠" },
  { label: "My Subjects", href: "/dashboard/lecturer/subjects", icon: "📚" },
  { label: "Marks", href: "/dashboard/lecturer/marks", icon: "📝" },
];

const studentLinks = [
  { label: "Dashboard", href: "/dashboard/student", icon: "🏠" },
  { label: "My Marks", href: "/dashboard/student/marks", icon: "📝" },
  { label: "Subjects", href: "/dashboard/student/subjects", icon: "📚" },
  { label: "Projects", href: "/dashboard/student/projects", icon: "🔬" },
  { label: "Transcript", href: "/dashboard/student/transcript", icon: "📄" },
];

const linksByRole = {
  hod: hodLinks,
  coordinator: coordinatorLinks,
  lecturer: lecturerLinks,
  visiting_lecturer: lecturerLinks,
  student: studentLinks,
};

const ROLE_LABELS = {
  hod: "Head of Department",
  coordinator: "Batch Coordinator",
  lecturer: "Lecturer",
  visiting_lecturer: "Visiting Lecturer",
  student: "Student",
};

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const links = linksByRole[role] || [];
  const initial = session?.user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-[#0a1f3d] via-[#0c2549] to-[#081a33] flex flex-col relative">
      {/* subtle top glow accent */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="relative px-5 pt-7 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-2xl bg-blue-950 flex items-center justify-center shrink-0">
            <Image
              src="/bms.png"
              alt="BMS logo"
              width={200}
              height={200}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-tight tracking-tight">
              BMS
            </p>
            <p className="text-[11px] text-blue-300/80 leading-tight font-medium">
              Batch Management
            </p>
          </div>
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          <span className="text-[11px] text-blue-200 uppercase tracking-wide font-semibold">
            {ROLE_LABELS[role] || role}
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="relative flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map((item, idx) => {
          if (item.section) {
            return (
              <p
                key={`section-${idx}`}
                className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400/60 first:pt-1"
              >
                {item.section}
              </p>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all relative
                ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium shadow-md shadow-blue-900/40"
                    : "text-blue-200/80 hover:bg-white/[0.06] hover:text-white"
                }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-full" />
              )}
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + sign out */}
      <div className="relative px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-sm font-semibold shrink-0 ring-2 ring-blue-400/20">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs text-blue-300/70 truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-sm bg-white/5 hover:bg-white/10 text-blue-100 py-2.5 rounded-xl transition-colors border border-white/5"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}