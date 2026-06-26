'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const ROLE_COLORS = {
  lecturer:          'bg-green-100 text-green-700',
  visiting_lecturer: 'bg-orange-100 text-orange-700',
}
const ROLE_LABELS = {
  lecturer: 'Permanent',
  visiting_lecturer: 'Visiting',
}

export default function LecturerListTab() {
  const router = useRouter()
  const pathname = usePathname() // e.g. /dashboard/hod/lecture-hours

  const [lecturers, setLecturers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [res1, res2] = await Promise.all([
          fetch('/api/users?role=lecturer'),
          fetch('/api/users?role=visiting_lecturer'),
        ])
        const [d1, d2] = await Promise.all([res1.json(), res2.json()])
        const all = [
          ...(d1.success ? d1.users : []),
          ...(d2.success ? d2.users : []),
        ]
        setLecturers(all)
      } catch (err) {
        console.error('Failed to load lecturers', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = lecturers.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase())
  )

  function goToLecturer(id) {
    router.push(`${pathname}/lecturer/${id}`)
  }

  return (
    <div>
      <div className="mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search lecturer by name or email..."
          className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"/>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading lecturers...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Lecturer</th>
                <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Type</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-400">No lecturers found</td></tr>
              ) : filtered.map(l => (
                <tr key={l._id}
                  onClick={() => goToLecturer(l._id)}
                  className="border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                        {l.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{l.name}</p>
                        <p className="text-xs text-gray-400">{l.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[l.role]}`}>
                      {ROLE_LABELS[l.role]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-xs text-blue-700 font-medium">View details →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}