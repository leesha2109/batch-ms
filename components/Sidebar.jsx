'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

const hodLinks = [
  { label: 'Dashboard',   href: '/dashboard/hod',                icon: '🏠' },
  { label: 'Batches',     href: '/dashboard/hod/batches',        icon: '🎓' },
  { label: 'Users',      href: '/dashboard/hod/users',    icon: '👥' },
  { label: 'Subjects',    href: '/dashboard/hod/subjects',       icon: '📚' },
  { label: 'Marks',       href: '/dashboard/hod/marks',          icon: '📝' },
  { label: 'Projects',    href: '/dashboard/hod/projects',       icon: '🔬' },
  { label: 'Lecturers',   href: '/dashboard/hod/lecturers',      icon: '👨‍🏫' },
  { label: 'Students',    href: '/dashboard/hod/students',       icon: '👨‍🎓' },
  { label: 'Payments',    href: '/dashboard/hod/payments',       icon: '💰' },
  { label: 'Settings',    href: '/dashboard/hod/settings',       icon: '⚙️' },
]

const coordinatorLinks = [
  { label: 'Dashboard',   href: '/dashboard/coordinator',              icon: '🏠' },
  { label: 'My Batch',    href: '/dashboard/coordinator/batch',        icon: '🎓' },
  { label: 'Timetable',   href: '/dashboard/coordinator/timetable',   icon: '📅' },
  { label: 'Marks',       href: '/dashboard/coordinator/marks',       icon: '📝' },
  { label: 'Students',    href: '/dashboard/coordinator/students',    icon: '👨‍🎓' },
  { label: 'Payments',    href: '/dashboard/coordinator/payments',    icon: '💰' },
]

const lecturerLinks = [
  { label: 'Dashboard',   href: '/dashboard/lecturer',                icon: '🏠' },
  { label: 'My Subjects', href: '/dashboard/lecturer/subjects',       icon: '📚' },
  { label: 'Marks',       href: '/dashboard/lecturer/marks',          icon: '📝' },
]

const studentLinks = [
  { label: 'Dashboard',   href: '/dashboard/student',                 icon: '🏠' },
  { label: 'My Marks',    href: '/dashboard/student/marks',           icon: '📝' },
  { label: 'Subjects',    href: '/dashboard/student/subjects',        icon: '📚' },
  { label: 'Projects',    href: '/dashboard/student/projects',        icon: '🔬' },
  { label: 'Transcript',  href: '/dashboard/student/transcript',      icon: '📄' },
]

const linksByRole = {
  hod:               hodLinks,
  coordinator:       coordinatorLinks,
  lecturer:          lecturerLinks,
  visiting_lecturer: lecturerLinks,
  student:           studentLinks,
}

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role     = session?.user?.role
  const links    = linksByRole[role] || []

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="text-base font-semibold text-gray-800">🎓 BatchMS</span>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">{role}</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(link => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${isActive
                  ? 'bg-gray-900 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* User info + sign out */}
      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-700 truncate">{session?.user?.name}</p>
        <p className="text-xs text-gray-400 truncate mb-3">{session?.user?.email}</p>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 py-2 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>

  

    </aside>
  )
}