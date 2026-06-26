'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import TopHeader from '@/components/TopHeader'

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

const CHART_COLORS = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834']

function HoursChart({ subjectGroups }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!window.Chart || !canvasRef.current) return

    if (chartRef.current) chartRef.current.destroy()

    const labels = subjectGroups.map(g => `${g.subjectCode} (${g.batchName})`)
    const data   = subjectGroups.map(g => g.totalHours)
    const colors = subjectGroups.map((_, i) => CHART_COLORS[i % CHART_COLORS.length])

    chartRef.current = new window.Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Hours',
          data,
          backgroundColor: colors,
          borderRadius: 4,
          maxBarThickness: 28,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.x} hrs`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: { callback: (v) => `${v}h` }
          },
          y: {
            grid: { display: false }
          }
        }
      }
    })

    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [subjectGroups])

  const heightPx = Math.max(220, subjectGroups.length * 42 + 60)

  return (
    <div style={{ position: 'relative', width: '100%', height: `${heightPx}px` }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Bar chart of total lecture hours per subject and batch for this lecturer`}
      >
        {subjectGroups.map(g => `${g.subjectCode} (${g.batchName}): ${g.totalHours} hours`).join(', ')}
      </canvas>
    </div>
  )
}

// ── Printable certification document for ONE subject + ONE batch + ONE semester ──
function PrintReport({ lecturer, group }) {
  if (!group) return null
  return (
    <div className="hidden print:block p-10 font-serif text-black">
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
            <td colSpan={2} className="border border-black px-2 py-1.5 font-medium text-right">Total hours</td>
            <td colSpan={2} className="border border-black px-2 py-1.5 font-medium">{group.totalHours.toFixed(1)} hrs</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-8 leading-relaxed">
        I hereby certify that I have conducted the above lectures as per the above
        schedule and that I have not applied for the payment for the above lectures
        and I have not received any payment for the same.
      </p>

      <p className="mt-8">Date: ____________________</p>

      <div className="mt-16 flex justify-end">
        <div className="text-center">
          <p className="border-t border-black pt-1 px-10">
            Signature of the {lecturer.role === 'visiting_lecturer' ? 'visiting ' : ''}Lecturer
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LecturerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const lecturerId = params.id

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [printGroup, setPrintGroup] = useState(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    if (window.Chart) { setScriptLoaded(true); return }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    script.onload = () => setScriptLoaded(true)
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    if (!lecturerId) return
    setLoading(true)
    fetch(`/api/lecture-logs/lecturer/${lecturerId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d)
        else setError(d.message || 'Failed to load report')
      })
      .catch(() => setError('Could not reach the server'))
      .finally(() => setLoading(false))
  }, [lecturerId])

  function handlePrintGroup(group) {
    setPrintGroup(group)
    setTimeout(() => {
      window.print()
      setPrintGroup(null)
    }, 100)
  }

  if (loading) {
    return (
      <div>
        <TopHeader title="Lecturer report" subtitle="Loading..." />
        <div className="px-8 py-10 text-sm text-gray-400">Loading lecturer report...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        <TopHeader title="Lecturer report" subtitle="Something went wrong" />
        <div className="px-8 py-10">
          <p className="text-sm text-red-500 mb-4">{error || 'Lecturer not found'}</p>
          <button onClick={() => router.back()}
            className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  const { lecturer, subjectGroups, grandTotalHours, totalSessions } = data
  const uniqueBatches = new Set(subjectGroups.map(g => g.batchName)).size
  const uniqueSubjects = new Set(subjectGroups.map(g => g.subjectCode)).size

  return (
    <div>
      <div className="print:hidden">
        <TopHeader
          title={lecturer.name}
          subtitle={lecturer.email}
          action={
            <button onClick={() => router.back()}
              className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
              ← Back to lecturers
            </button>
          }
        />

        <div className="px-8 py-6">

          <div className="flex items-center gap-2 mb-6">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[lecturer.role]}`}>
              {ROLE_LABELS[lecturer.role] || lecturer.role}
            </span>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-4 gap-4 mb-6">
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
              <p className="text-2xl font-semibold text-gray-800">{uniqueSubjects}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Batches involved</p>
              <p className="text-2xl font-semibold text-gray-800">{uniqueBatches}</p>
            </div>
          </div>

          {subjectGroups.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
              <p className="text-sm text-gray-400">No lecture hours logged for this person yet</p>
            </div>
          ) : (
            <>
              {/* Chart */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-4">Hours by subject &amp; batch</p>
                {scriptLoaded ? (
                  <HoursChart subjectGroups={subjectGroups} />
                ) : (
                  <p className="text-sm text-gray-400">Loading chart...</p>
                )}
              </div>

              {/* Per subject+batch breakdown with individual report buttons */}
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Subjects taught — by batch
              </p>
              <div className="space-y-5">
                {subjectGroups.map((group, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {group.subjectCode} — {group.subjectName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {group.batchName} ({group.programme}) &nbsp;·&nbsp; Semester {group.semesterNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                          {group.totalHours.toFixed(1)} hrs &nbsp;·&nbsp; {group.sessions.length} sessions
                        </span>
                        <button onClick={() => handlePrintGroup(group)}
                          className="text-xs bg-blue-900 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 font-medium">
                          View report
                        </button>
                      </div>
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
            </>
          )}
        </div>
      </div>

      <PrintReport lecturer={lecturer} group={printGroup} />
    </div>
  )
}