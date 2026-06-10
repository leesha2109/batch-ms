'use client'

import { useState, useEffect } from 'react'
import { useBatches }     from '@/hooks/useBatches'
import { useAssignments } from '@/hooks/useAssignments'
import TopHeader from '@/components/TopHeader'

const DAYS    = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const TIMES   = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']
const COLORS  = [
  'bg-blue-100   text-blue-800',
  'bg-green-100  text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-orange-100 text-orange-800',
  'bg-pink-100   text-pink-800',
  'bg-teal-100   text-teal-800',
]

function SlotModal({ slot, assignments, onClose, onSave }) {
  const [form, setForm] = useState({
    subjectAssignmentId: slot?.subjectAssignmentId?._id || slot?.subjectAssignmentId || '',
    location:            slot?.location || '',
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
  const [selSemester, setSelSemester] = useState('')
  const [timetable,   setTimetable]   = useState(null)
  const [slots,       setSlots]       = useState([])
  const [editingSlot, setEditingSlot] = useState(null)
  const [editingDay,  setEditingDay]  = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)

  const selBatchObj = batches.find(b => b._id === selBatch)
  const semesters   = selBatchObj?.semesters || []
  const currentYear = new Date().getFullYear()

  const { assignments } = useAssignments(
    selBatch, selSemester ? Number(selSemester) : null
  )

  // color map per assignment
  const colorMap = {}
  assignments.forEach((a, i) => { colorMap[a._id] = COLORS[i % COLORS.length] })

  // load timetable when batch+semester selected
  useEffect(() => {
    if (!selBatch || !selSemester) return
    fetch(`/api/timetable?batchId=${selBatch}&semesterNumber=${selSemester}&year=${currentYear}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.timetable) {
          setTimetable(d.timetable)
          setSlots(d.timetable.slots || [])
        } else {
          setTimetable(null)
          setSlots([])
        }
      })
  }, [selBatch, selSemester])

  function getSlot(day, time) {
    return slots.find(s => s.day === day && s.startTime === time)
  }

  function getAssignment(slotOrId) {
    const id = slotOrId?.subjectAssignmentId?._id ||
               slotOrId?.subjectAssignmentId      ||
               slotOrId
    return assignments.find(a => a._id === id || a._id?.toString() === id?.toString())
  }

  function handleCellClick(day, time) {
    const existing = getSlot(day, time)
    setEditingDay(day)
    setEditingSlot(existing || { day, startTime: time })
  }

  function handleSaveSlot(form) {
    setSlots(prev => {
      // remove old slot for this day+time
      const filtered = prev.filter(
        s => !(s.day === editingDay && s.startTime === editingSlot.startTime)
      )
      if (!form.subjectAssignmentId) return filtered   // clearing the slot

      return [...filtered, {
        _id:                  editingSlot._id || `new-${Date.now()}`,
        day:                  editingDay,
        startTime:            form.startTime || editingSlot.startTime,
        endTime:              form.endTime,
        subjectAssignmentId:  form.subjectAssignmentId,
        location:             form.location,
      }]
    })
    setEditingSlot(null)
    setEditingDay(null)
  }

  async function handleSaveTimetable() {
    setSaving(true)
    const res = await fetch('/api/timetable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId:        selBatch,
        semesterNumber: Number(selSemester),
        year:           currentYear,
        slots
      })
    })
    const data = await res.json()
    if (data.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  return (
    <div>
      <TopHeader
        title="Timetable"
        subtitle="Build and manage weekly class schedules"
      />

      <div className="px-8 py-6">

        {/* Controls */}
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <select value={selBatch} onChange={e => { setSelBatch(e.target.value); setSelSemester('') }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="">— Select batch —</option>
            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>

          <select value={selSemester} onChange={e => setSelSemester(e.target.value)}
            disabled={!selBatch}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50">
            <option value="">— Select semester —</option>
            {semesters.map(s => (
              <option key={s._id} value={s.semesterNumber}>
                Semester {s.semesterNumber}
              </option>
            ))}
          </select>

          {selBatch && selSemester && (
            <button onClick={handleSaveTimetable} disabled={saving}
              className={`ml-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${saved
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-900 text-white hover:bg-gray-700'
                } disabled:opacity-50`}>
              {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save timetable'}
            </button>
          )}
        </div>

        {selBatch && selSemester ? (
          <>
            {/* Legend */}
            {assignments.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {assignments.map(a => (
                  <span key={a._id}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${colorMap[a._id]}`}>
                    {a.subjectId?.code} — {a.subjectId?.name}
                  </span>
                ))}
              </div>
            )}

            {/* Grid */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-xs text-gray-400 font-medium text-left w-20 border-b border-gray-100">
                        Time
                      </th>
                      {DAYS.map(d => (
                        <th key={d} className="px-3 py-3 text-xs text-gray-500 font-medium border-b border-gray-100 text-center">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIMES.map((time, ti) => (
                      <tr key={time} className={ti % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-2 text-xs text-gray-400 border-r border-gray-100 whitespace-nowrap">
                          {time}
                        </td>
                        {DAYS.map(day => {
                          const slot       = getSlot(day, time)
                          const assignment = slot ? getAssignment(slot) : null
                          const color      = assignment ? colorMap[assignment._id] : ''

                          return (
                            <td key={day}
                              onClick={() => handleCellClick(day, time)}
                              className="px-2 py-1.5 border border-gray-50 cursor-pointer hover:bg-blue-50 transition-colors text-center min-w-[110px]">
                              {assignment ? (
                                <div className={`rounded-lg px-2 py-1.5 text-xs ${color}`}>
                                  <div className="font-medium">{assignment.subjectId?.code}</div>
                                  {slot.location && (
                                    <div className="opacity-70 text-xs">{slot.location}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-200 text-xs hover:text-gray-400">+</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Click any cell to assign a subject. Click an assigned cell to change or clear it.
            </p>
          </>
        ) : (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">📅</p>
            <p className="text-sm text-gray-400">Select a batch and semester to view the timetable</p>
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