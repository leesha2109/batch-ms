'use client'

import { useState, useEffect, useRef } from 'react'
import TopHeader from '@/components/TopHeader'

const DAYS    = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const TIMES   = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00']
const COLORS  = [
  'bg-blue-100   text-blue-800',
  'bg-green-100  text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-orange-100 text-orange-800',
  'bg-pink-100   text-pink-800',
  'bg-teal-100   text-teal-800',
]
const SEMESTER_OPTIONS = [1, 2]
const ROW_HEIGHT = 76

export default function StudentDashboard() {
  const [batch,       setBatch]       = useState(null)
  const [selLevel,    setSelLevel]    = useState('')
  const [selSemester, setSelSemester] = useState('')
  const [slots,       setSlots]       = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading,     setLoading]     = useState(false)
  const timetableRef = useRef(null)

  const currentYear = new Date().getFullYear()

  const levels = batch?.programme === 'BSc' ? [1, 2]
               : batch?.programme === 'BCS' ? [1]
               : []

  const semesterNumber = selLevel && selSemester
    ? (Number(selLevel) - 1) * 2 + Number(selSemester)
    : null

  // Load timetable when level+semester selected
  useEffect(() => {
    if (!semesterNumber) {
      // still fetch to get batch info
      fetch('/api/student/timetable', { credentials: 'include' })
        .then(r => r.json())
        .then(d => { if (d.success && d.batch) setBatch(d.batch) })
      return
    }

    setLoading(true)
    fetch(
      `/api/student/timetable?semesterNumber=${semesterNumber}&year=${currentYear}`,
      { credentials: 'include' }
    )
      .then(r => r.json())
      .then(d => {
        if (d.batch) setBatch(d.batch)
        if (d.success && d.timetable) {
          const normalized = (d.timetable.slots || []).map(s => ({
            ...s,
            subjectAssignmentId: s.subjectAssignmentId?._id || s.subjectAssignmentId,
          }))
          setSlots(normalized)

          // Build assignments list from populated slots
          const seen = new Set()
          const list = []
          d.timetable.slots.forEach(s => {
            const a = s.subjectAssignmentId
            if (a && a._id && !seen.has(String(a._id))) {
              seen.add(String(a._id))
              list.push(a)
            }
          })
          setAssignments(list)
        } else {
          setSlots([])
          setAssignments([])
        }
      })
      .finally(() => setLoading(false))
  }, [semesterNumber])

  // Color map
  const colorMap = {}
  assignments.forEach((a, i) => { colorMap[String(a._id)] = COLORS[i % COLORS.length] })

  function getAssignment(slot) {
    const id = String(slot?.subjectAssignmentId?._id || slot?.subjectAssignmentId || '')
    return assignments.find(a => String(a._id) === id)
  }

  // Merge consecutive same-subject slots
  function getMergedSlots() {
    const merged = []
    const used = new Set()
    slots.forEach(slot => {
      const key = `${slot.day}-${slot.startTime}`
      if (used.has(key)) return
      let endTime = slot.endTime
      const slotId = String(slot.subjectAssignmentId?._id || slot.subjectAssignmentId || '')
      let next = slots.find(s =>
        s.day === slot.day &&
        s.startTime === endTime &&
        String(s.subjectAssignmentId?._id || s.subjectAssignmentId || '') === slotId
      )
      while (next) {
        used.add(`${next.day}-${next.startTime}`)
        endTime = next.endTime
        next = slots.find(s =>
          s.day === slot.day &&
          s.startTime === endTime &&
          String(s.subjectAssignmentId?._id || s.subjectAssignmentId || '') === slotId
        )
      }
      used.add(key)
      merged.push({ ...slot, endTime })
    })
    return merged
  }

  // Print-based download
  function handleDownload() {
    const mergedSlots = getMergedSlots()
    const colorStyleMap = {
      'bg-blue-100   text-blue-800':   { bg: '#dbeafe', text: '#1e40af' },
      'bg-green-100  text-green-800':  { bg: '#dcfce7', text: '#166534' },
      'bg-purple-100 text-purple-800': { bg: '#f3e8ff', text: '#6b21a8' },
      'bg-orange-100 text-orange-800': { bg: '#ffedd5', text: '#9a3412' },
      'bg-pink-100   text-pink-800':   { bg: '#fce7f3', text: '#9d174d' },
      'bg-teal-100   text-teal-800':   { bg: '#ccfbf1', text: '#115e59' },
    }

    const gridRows = TIMES.slice(0, -1).map(time => {
      const cells = DAYS.map(day => {
        const isCovered = mergedSlots.some(s =>
          s.day === day &&
          TIMES.indexOf(s.startTime) < TIMES.indexOf(time) &&
          TIMES.indexOf(s.endTime)   > TIMES.indexOf(time)
        )
        if (isCovered) return ''

        const slot = mergedSlots.find(s => s.day === day && s.startTime === time)
        if (!slot) return `<td style="padding:6px;border:1px solid #e5e7eb;min-width:100px;height:40px;"></td>`

        const assignment = getAssignment(slot)
        const assignIdx  = assignments.indexOf(assignment)
        const colors     = colorStyleMap[COLORS[assignIdx % COLORS.length]] || { bg: '#f3f4f6', text: '#111827' }
        const span       = Math.max(1, TIMES.indexOf(slot.endTime) - TIMES.indexOf(slot.startTime))

        return `
          <td rowspan="${span}" style="padding:6px;border:1px solid #e5e7eb;min-width:100px;vertical-align:top;">
            <div style="background:${colors.bg};color:${colors.text};border-radius:6px;padding:4px 6px;font-size:11px;">
              <div style="font-weight:700;">${assignment?.subjectId?.code || ''}</div>
              <div style="font-size:10px;">${slot.startTime}–${slot.endTime}</div>
              ${assignment?.lecturerId?.name ? `<div style="font-size:10px;font-weight:600;">${assignment.lecturerId.name}</div>` : ''}
              ${slot.location ? `<div style="font-size:10px;opacity:0.7;">${slot.location}</div>` : ''}
            </div>
          </td>`
      }).join('')

      return `
        <tr>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280;white-space:nowrap;">${time}</td>
          ${cells}
        </tr>`
    }).join('')

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Timetable — ${batch?.name} · Level ${selLevel} · Semester ${selSemester}</title>
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
            p  { font-size: 13px; color: #6b7280; margin-bottom: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th { background:#f9fafb; padding:8px 12px; border:1px solid #e5e7eb; font-size:12px; text-align:left; }
            @media print { button { display:none; } }
          </style>
        </head>
        <body>
          <h1>${batch?.name || 'My Timetable'}</h1>
          <p>Level ${selLevel} · Semester ${selSemester} · ${currentYear}</p>
          <table>
            <thead>
              <tr>
                <th style="width:60px;">Time</th>
                ${DAYS.map(d => `<th>${d}</th>`).join('')}
              </tr>
            </thead>
            <tbody>${gridRows}</tbody>
          </table>
          <script>
            window.onload = function() {
              window.print()
              window.onafterprint = function() { window.close() }
            }
          <\/script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const mergedSlots = getMergedSlots()
  const timelineHeight = (TIMES.length - 1) * ROW_HEIGHT

  return (
    <div>
      <TopHeader
        title="My Timetable"
        subtitle={batch ? `${batch.name} · ${batch.programme}` : 'Loading...'}
      />

      <div className="px-8 py-6">

        {/* Controls */}
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <select value={selLevel}
            onChange={e => { setSelLevel(e.target.value); setSelSemester('') }}
            disabled={!batch}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50">
            <option value="">— Select level —</option>
            {levels.map(lvl => (
              <option key={lvl} value={lvl}>Level {lvl}</option>
            ))}
          </select>

          <select value={selSemester} onChange={e => setSelSemester(e.target.value)}
            disabled={!selLevel}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50">
            <option value="">— Select semester —</option>
            {SEMESTER_OPTIONS.map(num => (
              <option key={num} value={num}>Semester {num}</option>
            ))}
          </select>

          {selLevel && selSemester && slots.length > 0 && (
            <button onClick={handleDownload}
              className="ml-auto px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">
              ⬇ Download timetable
            </button>
          )}
        </div>

        {!batch ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">📅</p>
            <p className="text-sm text-gray-400">No batch assigned to your account yet.</p>
          </div>
        ) : !selLevel || !selSemester ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">📅</p>
            <p className="text-sm text-gray-400">Select a level and semester to view your timetable.</p>
          </div>
        ) : loading ? (
          <p className="text-sm text-gray-400">Loading timetable...</p>
        ) : slots.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">📅</p>
            <p className="text-sm text-gray-400">No timetable published yet for this semester.</p>
          </div>
        ) : (
          <div ref={timetableRef} className="bg-white p-4 rounded-xl">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-800">{batch?.name}</h2>
              <p className="text-sm text-gray-500">Level {selLevel} · Semester {selSemester}</p>
            </div>

            {/* Legend */}
            {assignments.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {assignments.map(a => (
                  <span key={a._id}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${colorMap[String(a._id)]}`}>
                    {a.subjectId?.code} — {a.subjectId?.name}
                    {a.lecturerId?.name ? ` · ${a.lecturerId.name}` : ''}
                  </span>
                ))}
              </div>
            )}

            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[760px]">

                  {/* Day header */}
                  <div className="grid grid-cols-[64px_repeat(5,1fr)] bg-gray-50 border-b border-gray-300">
                    <div className="px-2 py-3" />
                    {DAYS.map(d => (
                      <div key={d}
                        className="px-3 py-3 text-xs text-gray-600 font-semibold text-center border-l border-gray-200">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Time axis + columns */}
                  <div className="grid grid-cols-[64px_repeat(5,1fr)]">

                    {/* Time gutter */}
                    <div className="relative" style={{ height: timelineHeight }}>
                      {TIMES.map((t, i) => (
                        <div key={t}
                          className="absolute left-0 right-1 text-right text-xs font-medium text-gray-500"
                          style={{ top: i * ROW_HEIGHT - 7 }}>
                          {t}
                        </div>
                      ))}
                    </div>

                    {/* Day columns — read only */}
                    {DAYS.map(day => (
                      <div key={day}
                        className="relative border-l border-gray-200"
                        style={{ height: timelineHeight }}>

                        {/* Hour gridlines */}
                        {TIMES.map((t, i) => (
                          <div key={t}
                            className="absolute left-0 right-0 border-t border-gray-300"
                            style={{ top: i * ROW_HEIGHT }} />
                        ))}

                        {/* Slot blocks — no click handler */}
                        {mergedSlots.filter(s => s.day === day).map(slot => {
                          const assignment = getAssignment(slot)
                          const startIdx   = TIMES.indexOf(slot.startTime)
                          const endIdx     = TIMES.indexOf(slot.endTime)
                          const span       = Math.max(1, endIdx - startIdx)
                          const top        = startIdx * ROW_HEIGHT
                          const height     = span * ROW_HEIGHT
                          const color      = assignment ? colorMap[String(assignment._id)] : 'bg-gray-100 text-gray-700'
                          const isShort    = span <= 1

                          return (
                            <div key={`${day}-${slot.startTime}`}
                              className={`absolute left-1 right-1 rounded-lg px-2 ${color} flex flex-col justify-center overflow-hidden shadow-sm ring-1 ring-black/5 ${isShort ? 'py-1' : 'py-2 gap-0.5'}`}
                              style={{ top: top + 2, height: height - 4 }}>
                              <div className={`font-bold leading-tight truncate ${isShort ? 'text-xs' : 'text-sm'}`}>
                                {assignment?.subjectId?.code}
                              </div>
                              <div className={`font-medium leading-tight truncate ${isShort ? 'text-[10px]' : 'text-xs'}`}>
                                {assignment?.subjectId?.name}
                              </div>
                              <div className={`leading-tight ${isShort ? 'text-[10px]' : 'text-xs'}`}>
                                {slot.startTime}–{slot.endTime}
                              </div>
                              {!isShort && assignment?.lecturerId?.name && (
                                <div className="text-xs font-medium leading-tight truncate">
                                  {assignment.lecturerId.name}
                                </div>
                              )}
                              {!isShort && slot.location && (
                                <div className="text-xs leading-tight truncate opacity-70">
                                  {slot.location}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Contact your coordinator if you notice any errors in the timetable.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}