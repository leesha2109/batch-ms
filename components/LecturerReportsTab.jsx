'use client'

import { useState, useEffect } from 'react'

const ROLE_COLORS = {
  lecturer:          'bg-green-100 text-green-700',
  visiting_lecturer: 'bg-orange-100 text-orange-700',
}
const ROLE_LABELS = {
  lecturer: 'Permanent',
  visiting_lecturer: 'Visiting',
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Printable certification document, styled after the department's own template ──
function PrintReport({ lecturer, subjectGroups, grandTotalHours, dateRangeLabel }) {
  return (
    <div id="lecturer-print-area" className="hidden print:block">
      {subjectGroups.map((group, idx) => (
        <div key={idx} style={{ pageBreakAfter: idx < subjectGroups.length - 1 ? 'always' : 'auto' }} className="p-10 font-serif text-black">
          <table className="w-full border-collapse border border-black mb-0 text-sm">
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1 font-medium w-1/2">
                  {group.subjectCode} - {group.subjectName}
                </td>
                <td className="border border-black px-2 py-1 w-1/2">{lecturer.name}</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr>
                <th colSpan={4} className="border border-black bg-blue-100 px-2 py-1 font-medium">
                  {group.subjectCode} - {group.subjectName} &nbsp;·&nbsp; {group.batchName} &nbsp;·&nbsp; Semester {group.semesterNumber}
                </th>
              </tr>
              <tr className="bg-blue-100">
                <th className="border border-black px-2 py-1 font-medium w-24">Lecture No.</th>
                <th className="border border-black px-2 py-1 font-medium w-28">Date</th>
                <th className="border border-black px-2 py-1 font-medium">Time</th>
                <th className="border border-black px-2 py-1 font-medium w-32">Signature</th>
              </tr>
            </thead>
            <tbody>
              {group.sessions.map((s, i) => (
                <tr key={s._id}>
                  <td className="border border-black px-2 py-1.5 text-center">{i + 1}</td>
                  <td className="border border-black px-2 py-1.5 text-center">{formatDate(s.date)}</td>
                  <td className="border border-black px-2 py-1.5 text-center">{s.startTime} – {s.endTime}</td>
                  <td className="border border-black px-2 py-1.5"></td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 14 - group.sessions.length) }).map((_, i) => (
                <tr key={`blank-${i}`}>
                  <td className="border border-black px-2 py-1.5">&nbsp;</td>
                  <td className="border border-black px-2 py-1.5">&nbsp;</td>
                  <td className="border border-black px-2 py-1.5">&nbsp;</td>
                  <td className="border border-black px-2 py-1.5">&nbsp;</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} className="border border-black px-2 py-1.5 font-medium text-right">
                  Total hours
                </td>
                <td colSpan={2} className="border border-black px-2 py-1.5 font-medium">
                  {group.totalHours.toFixed(1)} hrs
                </td>
              </tr>
            </tbody>
          </table>

          <p className="mt-8 leading-relaxed">
            I hereby certify that I have conducted the above lectures as per the above
            schedule {dateRangeLabel ? `in the period of ${dateRangeLabel}` : ''} and that I have not
            applied for the payment for the above lectures and I have not received any
            payment for the same.
          </p>

          <p className="mt-8">Date: ____________________</p>

          <div className="mt-16 flex justify-end">
            <div className="text-center">
              <p className="border-t border-black pt-1 px-10">
                Signature of the {lecturer.role === 'visiting_lecturer' ? 'visiting' : ''} Lecturer
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LecturerDetail({ lecturerId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/lecture-logs/lecturer/${lecturerId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d)
        else setError(d.message)
      })
      .catch(() => setError('Failed to load report'))
      .finally(() => setLoading(false))
  }, [lecturerId])

  function handlePrint() {
    window.print()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 text-sm text-gray-400">Loading report...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8">
          <p className="text-sm text-red-500 mb-4">{error || 'Something went wrong'}</p>
          <button onClick={onClose} className="text-sm border border-gray-200 px-4 py-2 rounded-lg">Close</button>
        </div>
      </div>
    )
  }

  const { lecturer, subjectGroups, grandTotalHours, totalSessions } = data

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 print:hidden">
        <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">

          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
            <div>
              <h2 className="text-base font-semibold text-gray-800">{lecturer.name}</h2>
              <p className="text-xs text-gray-400">{lecturer.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint}
                className="text-sm bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
                Print report
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2">✕</button>
            </div>
          </div>

          <div className="px-6 py-5">

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs text-blue-500 mb-1">Total hours</p>
                <p className="text-2xl font-semibold text-blue-900">{grandTotalHours.toFixed(1)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Total sessions</p>
                <p className="text-2xl font-semibold text-gray-800">{totalSessions}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Subjects taught</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {new Set(subjectGroups.map(g => g.subjectCode)).size}
                </p>
              </div>
            </div>

            {subjectGroups.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400">No lecture hours logged for this person yet</p>
              </div>
            ) : (
              <div className="space-y-5">
                {subjectGroups.map((group, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {group.subjectCode} — {group.subjectName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {group.batchName} &nbsp;·&nbsp; Semester {group.semesterNumber}
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                        {group.totalHours.toFixed(1)} hrs &nbsp;·&nbsp; {group.sessions.length} sessions
                      </span>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Date</th>
                          <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Time</th>
                          <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Duration</th>
                          <th className="text-left px-4 py-2 text-xs text-gray-400 font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.sessions.map(s => (
                          <tr key={s._id} className="border-b border-gray-50">
                            <td className="px-4 py-2 text-gray-700">{formatDate(s.date)}</td>
                            <td className="px-4 py-2 text-gray-500">{s.startTime} – {s.endTime}</td>
                            <td className="px-4 py-2 text-gray-700 font-medium">{s.durationHours} hrs</td>
                            <td className="px-4 py-2 text-gray-400 italic">{s.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <PrintReport lecturer={lecturer} subjectGroups={subjectGroups} grandTotalHours={grandTotalHours} />
    </>
  )
}

export default function LecturerReportsTab() {
  const [lecturers, setLecturers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
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
      setLoading(false)
    }
    load()
  }, [])

  const filtered = lecturers.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase())
  )

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
                <tr key={l._id} className="border-b border-gray-50 hover:bg-gray-50">
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
                  <td className="px-5 py-3">
                    <button onClick={() => setActiveId(l._id)}
                      className="text-xs text-blue-700 hover:underline font-medium">
                      View report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeId && (
        <LecturerDetail lecturerId={activeId} onClose={() => setActiveId(null)} />
      )}
    </div>
  )
}