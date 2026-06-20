"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const hodLinks = [
  { label: "Dashboard", href: "/dashboard/hod", icon: "🏠" },
  { label: "Batches", href: "/dashboard/hod/batches", icon: "🎓" },
  { label: "Users", href: "/dashboard/hod/users", icon: "👥" },
  { label: "Timetable", href: "/dashboard/hod/timetable", icon: "📅" },
  { label: "Courses", href: "/dashboard/hod/subjects", icon: "📚" },
  { label: "Marks", href: "/dashboard/hod/marks", icon: "📝" },
  { label: "Exams", href: "/dashboard/hod/exams", icon: "📝" },
  { label: "Projects", href: "/dashboard/hod/projects", icon: "🔬" },
  { label: "Lecturers", href: "/dashboard/hod/lecturers", icon: "👨‍🏫" },
  { label: "Students", href: "/dashboard/hod/students", icon: "👨‍🎓" },
  { label: "Payments", href: "/dashboard/hod/payments", icon: "💰" },
  { label: "Settings", href: "/dashboard/hod/settings", icon: "⚙️" },
];

const coordinatorLinks = [
  { label: "Dashboard", href: "/dashboard/coordinator", icon: "🏠" },
  { label: "My Batches", href: "/dashboard/coordinator/batches", icon: "🎓" },
  { label: "Users", href: "/dashboard/coordinator/users", icon: "👥" },
  { label: "Timetable", href: "/dashboard/coordinator/timetable", icon: "📅" },
  { label: "Subjects", href: "/dashboard/coordinator/subjects", icon: "📚" },
  { label: "Marks", href: "/dashboard/coordinator/marks", icon: "📝" },
  { label: "Projects", href: "/dashboard/coordinator/projects", icon: "🔬" },
  { label: "Students", href: "/dashboard/coordinator/students", icon: "👨‍🎓" },
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

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const links = linksByRole[role] || [];

  return (
    <aside className="w-56 min-h-screen bg-blue-100 border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-blue-100">
        <span className="text-xl font-bold text-blue-900 text-center">
          🎓 BatchMS
        </span>
        <p className="text-md text-blue-400 mt-0.5 capitalize text-center">{role}</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-l transition-colors
                ${
                  isActive
                    ? "bg-blue-900 text-white font-semibold"
                    : "text-blue-600 hover:bg-blue-100 hover:text-blue-900"
                }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + sign out */}
      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-md font-medium text-gray-700 truncate">
          {session?.user?.name}
        </p>
        <p className="text-md text-gray-400 truncate mb-3">
          {session?.user?.email}
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-md bg-blue-100 hover:bg-blue-200 text-blue-900 py-2 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
