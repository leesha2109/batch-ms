'use client'

import { useState, useEffect, useRef } from 'react'
import { useBatches }     from '@/hooks/useBatches'
import { useAssignments } from '@/hooks/useAssignments'
import TopHeader from '@/components/TopHeader'

const DAYS    = ['Monday','Tuesday','Wednesday','Thursday','Friday']
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

function SlotModal({ slot, assignments, onClose, onSave }) {
  const [form, setForm] = useState({
    subjectAssignmentId: slot?.subjectAssignmentId?._id || slot?.subjectAssignmentId || '',
    location:            slot?.location  || '',
    startTime:           slot?.startTime || '',
    endTime:             slot?.endTime   || '',
  })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold">Edit slot</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Subject</label>
            <select value={form.subjectAssignmentId}
              onChange={e => setForm(p => ({ ...p, subjectAssignmentId: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
              <option value="">— Select subject —</option>
              {assignments.map(a => (
                <option key={a._id} value={a._id}>
                  {a.subjectId?.code} — {a.subjectId?.name}
                  {a.lecturerId?.name ? ` (${a.lecturerId.name})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Start time</label>
              <select value={form.startTime}
                onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">—</option>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">End time</label>
              <select value={form.endTime}
                onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">—</option>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Location (room / lab)</label>
            <input value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              placeholder="e.g. Lab 01"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">
              Cancel
            </button>
            <button onClick={() => onSave(form)}
              className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm">
              Save slot
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TimetablePage() {
  const { batches }             = useBatches()
  const [selBatch,    setSelBatch]    = useState('')
  const [selLevel,    setSelLevel]    = useState('')
  const [selSemester, setSelSemester] = useState('')
  const [timetable,   setTimetable]   = useState(null)
  const [slots,       setSlots]       = useState([])
  const [editingSlot, setEditingSlot] = useState(null)
  const [editingDay,  setEditingDay]  = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const timetableRef = useRef(null)

  const selBatchObj = batches.find(b => b._id === selBatch)

  const levels = selBatchObj?.programme === 'BSc'
    ? [1, 2]
    : selBatchObj?.programme === 'BCS'
    ? [1]
    : []

  const semesterNumber = selLevel && selSemester
    ? (Number(selLevel) - 1) * 2 + Number(selSemester)
    : null

  const currentYear = new Date().getFullYear()

  const { assignments } = useAssignments(selBatch, semesterNumber)

  const colorMap = {}
  assignments.forEach((a, i) => { colorMap[a._id] = COLORS[i % COLORS.length] })

  useEffect(() => {
    if (!selBatch || !semesterNumber) return
    fetch(`/api/timetable?batchId=${selBatch}&semesterNumber=${semesterNumber}&year=${currentYear}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.timetable) {
          setTimetable(d.timetable)
          const normalized = (d.timetable.slots || []).map(s => ({
            ...s,
            subjectAssignmentId: s.subjectAssignmentId?._id || s.subjectAssignmentId,
          }))
          setSlots(normalized)
        } else {
          setTimetable(null)
          setSlots([])
        }
      })
  }, [selBatch, semesterNumber])

  function getSlot(day, time) {
    return slots.find(s => s.day === day && s.startTime === time)
  }

  function getAssignment(slotOrId) {
    const id = slotOrId?.subjectAssignmentId?._id ||
               slotOrId?.subjectAssignmentId      ||
               slotOrId
    return assignments.find(
      a => a._id === id || a._id?.toString() === id?.toString()
    )
  }

  function handleCellClick(day, time) {
    const existing = getSlot(day, time)
    setEditingDay(day)
    setEditingSlot(existing || { day, startTime: time })
  }

  function handleSaveSlot(form) {
    setSlots(prev => {
      const filtered = prev.filter(
        s => !(s.day === editingDay && s.startTime === editingSlot.startTime)
      )
      if (!form.subjectAssignmentId) return filtered
      return [...filtered, {
        day:                 editingDay,
        startTime:           form.startTime || editingSlot.startTime,
        endTime:             form.endTime,
        subjectAssignmentId: form.subjectAssignmentId,
        location:            form.location,
      }]
    })
    setEditingSlot(null)
    setEditingDay(null)
  }

  async function handleSaveTimetable() {
    setSaving(true)
    const cleanSlots = slots.map(s => ({
      day:                 s.day,
      startTime:           s.startTime,
      endTime:             s.endTime,
      location:            s.location || '',
      subjectAssignmentId: s.subjectAssignmentId?._id || s.subjectAssignmentId,
    }))
    const res = await fetch('/api/timetable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId:        selBatch,
        semesterNumber: semesterNumber,
        year:           currentYear,
        slots:          cleanSlots,
      })
    })
    const data = await res.json()
    if (data.success) {
      fetch(`/api/timetable?batchId=${selBatch}&semesterNumber=${semesterNumber}&year=${currentYear}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.timetable) {
            const normalized = (d.timetable.slots || []).map(s => ({
              ...s,
              subjectAssignmentId: s.subjectAssignmentId?._id || s.subjectAssignmentId,
            }))
            setSlots(normalized)
          }
        })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  function getMergedSlots() {
    const merged = []
    const used = new Set()
    slots.forEach(slot => {
      if (used.has(`${slot.day}-${slot.startTime}`)) return
      let endTime = slot.endTime
      let next = slots.find(
        s =>
          s.day === slot.day &&
          s.startTime === endTime &&
          (s.subjectAssignmentId?._id || s.subjectAssignmentId) ===
            (slot.subjectAssignmentId?._id || slot.subjectAssignmentId)
      )
      while (next) {
        used.add(`${next.day}-${next.startTime}`)
        endTime = next.endTime
        next = slots.find(
          s =>
            s.day === slot.day &&
            s.startTime === endTime &&
            (s.subjectAssignmentId?._id || s.subjectAssignmentId) ===
              (slot.subjectAssignmentId?._id || slot.subjectAssignmentId)
        )
      }
      used.add(`${slot.day}-${slot.startTime}`)
      merged.push({ ...slot, endTime })
    })
    return merged
  }

  // Print-based download — opens new tab and triggers browser print/save as PDF
  function handleDownload() {
    const printContent = timetableRef.current
    if (!printContent) return

    // Build inline color styles since Tailwind won't load in the print window
    const colorStyleMap = {
      'bg-blue-100   text-blue-800':   { bg: '#dbeafe', text: '#1e40af' },
      'bg-green-100  text-green-800':  { bg: '#dcfce7', text: '#166534' },
      'bg-purple-100 text-purple-800': { bg: '#f3e8ff', text: '#6b21a8' },
      'bg-orange-100 text-orange-800': { bg: '#ffedd5', text: '#9a3412' },
      'bg-pink-100   text-pink-800':   { bg: '#fce7f3', text: '#9d174d' },
      'bg-teal-100   text-teal-800':   { bg: '#ccfbf1', text: '#115e59' },
    }

    // Build slot rows for print table
    const slotsByDay = {}
    DAYS.forEach(d => { slotsByDay[d] = [] })
    getMergedSlots().forEach(slot => {
      if (slotsByDay[slot.day]) slotsByDay[slot.day].push(slot)
    })

    const assignmentRows = assignments.map((a, i) => {
      const colors = colorStyleMap[COLORS[i % COLORS.length]] || { bg: '#f3f4f6', text: '#111827' }
      const slotsList = getMergedSlots()
        .filter(s =>
          (s.subjectAssignmentId?._id || s.subjectAssignmentId) === a._id
        )
        .map(s => `${s.day} ${s.startTime}–${s.endTime}${s.location ? ' @ ' + s.location : ''}`)
        .join(', ')

      return `
        <tr>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;">
            <span style="background:${colors.bg};color:${colors.text};padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;">
              ${a.subjectId?.code}
            </span>
          </td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:12px;">${a.subjectId?.name || ''}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:12px;">${a.lecturerId?.name || '—'}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:12px;">${slotsList || '—'}</td>
        </tr>
      `
    }).join('')

    // Build timetable grid for print
    const gridRows = TIMES.slice(0, -1).map(time => {
      const cells = DAYS.map(day => {
        const slot = getMergedSlots().find(s => s.day === day && s.startTime === time)
        if (!slot) return `<td style="padding:6px;border:1px solid #e5e7eb;min-width:100px;height:40px;"></td>`

        // check if this time is covered by a slot starting earlier
        const isCovered = getMergedSlots().some(s =>
          s.day === day &&
          TIMES.indexOf(s.startTime) < TIMES.indexOf(time) &&
          TIMES.indexOf(s.endTime) > TIMES.indexOf(time)
        )
        if (isCovered) return ''

        const assignment = assignments.find(a =>
          a._id === (slot.subjectAssignmentId?._id || slot.subjectAssignmentId) ||
          a._id?.toString() === (slot.subjectAssignmentId?._id || slot.subjectAssignmentId)?.toString()
        )
        const assignIdx = assignments.indexOf(assignment)
        const colors = colorStyleMap[COLORS[assignIdx % COLORS.length]] || { bg: '#f3f4f6', text: '#111827' }
        const span = Math.max(1, TIMES.indexOf(slot.endTime) - TIMES.indexOf(slot.startTime))

        return `
          <td rowspan="${span}" style="padding:6px;border:1px solid #e5e7eb;min-width:100px;vertical-align:top;">
            <div style="background:${colors.bg};color:${colors.text};border-radius:6px;padding:4px 6px;font-size:11px;">
              <div style="font-weight:700;">${assignment?.subjectId?.code || ''}</div>
              <div style="font-size:10px;">${slot.startTime}–${slot.endTime}</div>
              ${assignment?.lecturerId?.name ? `<div style="font-size:10px;font-weight:600;">${assignment.lecturerId.name}</div>` : ''}
              ${slot.location ? `<div style="font-size:10px;opacity:0.7;">${slot.location}</div>` : ''}
            </div>
          </td>
        `
      }).join('')
      return `
        <tr>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280;white-space:nowrap;font-weight:500;">${time}</td>
          ${cells}
        </tr>
      `
    }).join('')

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Timetable — ${selBatchObj?.name} · Level ${selLevel} · Semester ${selSemester}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
            p  { font-size: 13px; color: #6b7280; margin-bottom: 20px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 28px; }
            th { background: #f9fafb; padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 12px; text-align: left; }
            @media print {
              body { padding: 12px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${selBatchObj?.name}</h1>
          <p>Level ${selLevel} · Semester ${selSemester} · ${currentYear}</p>

          <!-- Timetable grid -->
          <table>
            <thead>
              <tr>
                <th style="width:60px;">Time</th>
                ${DAYS.map(d => `<th>${d}</th>`).join('')}
              </tr>
            </thead>
            <tbody>${gridRows}</tbody>
          </table>

          <!-- Subject summary -->
          <h2 style="font-size:14px;font-weight:600;margin-bottom:10px;">Subject Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject</th>
                <th>Lecturer</th>
                <th>Slots</th>
              </tr>
            </thead>
            <tbody>${assignmentRows}</tbody>
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
        title="Timetable"
        subtitle="Build and manage weekly class schedules"
      />

      <div className="px-8 py-6">

        {/* Controls */}
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <select value={selBatch}
            onChange={e => { setSelBatch(e.target.value); setSelLevel(''); setSelSemester('') }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="">— Select batch —</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>

          <select value={selLevel}
            onChange={e => { setSelLevel(e.target.value); setSelSemester('') }}
            disabled={!selBatch}
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

          {selBatch && selLevel && selSemester && (
            <div className="ml-auto flex gap-2">
              <button onClick={handleDownload}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">
                ⬇ Download timetable
              </button>
              <button onClick={handleSaveTimetable} disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${saved
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-900 text-white hover:bg-blue-800'
                  } disabled:opacity-50`}>
                {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save timetable'}
              </button>
            </div>
          )}
        </div>

        {selBatch && selLevel && selSemester ? (
          <>
            <div ref={timetableRef} className="bg-white p-4 rounded-xl">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-800">{selBatchObj?.name}</h2>
                <p className="text-sm text-gray-500">Level {selLevel} · Semester {selSemester}</p>
              </div>

              {/* Legend */}
              {assignments.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-4">
                  {assignments.map(a => (
                    <span key={a._id}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${colorMap[a._id]}`}>
                      {a.subjectId?.code} — {a.subjectId?.name}
                      {a.lecturerId?.name ? ` · ${a.lecturerId.name}` : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Timeline grid */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[760px]">

                    {/* Day header row */}
                    <div className="grid grid-cols-[64px_repeat(5,1fr)] bg-gray-50 border-b border-gray-300">
                      <div className="px-2 py-3" />
                      {DAYS.map(d => (
                        <div key={d}
                          className="px-3 py-3 text-xs text-gray-600 font-semibold text-center border-l border-gray-200">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Time axis + day columns */}
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

                      {/* Day columns */}
                      {DAYS.map(day => (
                        <div key={day}
                          className="relative border-l border-gray-200"
                          style={{ height: timelineHeight }}>

                          {/* hour gridlines */}
                          {TIMES.map((t, i) => (
                            <div key={t}
                              className="absolute left-0 right-0 border-t border-gray-300"
                              style={{ top: i * ROW_HEIGHT }}
                            />
                          ))}

                          {/* clickable empty cells */}
                          {TIMES.slice(0, -1).map((t, i) => {
                            const covered = mergedSlots.some(s =>
                              s.day === day &&
                              TIMES.indexOf(s.startTime) <= i &&
                              TIMES.indexOf(s.endTime)   > i
                            )
                            if (covered) return null
                            return (
                              <div key={t}
                                onClick={() => handleCellClick(day, t)}
                                className="absolute left-0 right-0 cursor-pointer hover:bg-blue-50/70 transition-colors group"
                                style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}>
                                <span className="hidden group-hover:flex items-center justify-center h-full text-gray-300 text-xs">+</span>
                              </div>
                            )
                          })}

                          {/* slot blocks */}
                          {mergedSlots.filter(s => s.day === day).map(slot => {
                            const assignment = getAssignment(slot)
                            const startIdx = TIMES.indexOf(slot.startTime)
                            const endIdx   = TIMES.indexOf(slot.endTime)
                            const span     = Math.max(1, endIdx - startIdx)
                            const top      = startIdx * ROW_HEIGHT
                            const height   = span * ROW_HEIGHT
                            const color    = assignment ? colorMap[assignment._id] : 'bg-gray-100 text-gray-700'
                            const isShort  = span <= 1

                            return (
                              <div key={`${day}-${slot.startTime}`}
                                onClick={() => handleCellClick(day, slot.startTime)}
                                className={`absolute left-1 right-1 rounded-lg px-2 cursor-pointer ${color} flex flex-col justify-center overflow-hidden shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow ${isShort ? 'py-1' : 'py-2 gap-0.5'}`}
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
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Click any empty slot to assign a subject. Click a colored block to change or clear it.
            </p>
          </>
        ) : (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">📅</p>
            <p className="text-sm text-gray-400">
              Select a batch, level and semester to view the timetable
            </p>
          </div>
        )}
      </div>

      {editingSlot && (
        <SlotModal
          slot={editingSlot}
          assignments={assignments}
          onClose={() => { setEditingSlot(null); setEditingDay(null) }}
          onSave={handleSaveSlot}
        />
      )}
    </div>
  )
}