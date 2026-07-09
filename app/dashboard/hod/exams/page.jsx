'use client'

import { useState } from 'react'
import { useBatches }     from '@/hooks/useBatches'
import { useAssignments } from '@/hooks/useAssignments'
import TopHeader from '@/components/TopHeader'

const SEMESTER_OPTIONS = [1, 2]

// ── Inline editable cell ──────────────────────────────────────
function EditableCell({ value, onChange, placeholder, type = 'text' }) {
  const [editing, setEditing] = useState(false)
  const [local,   setLocal]   = useState(value || '')

  function handleBlur() {
    setEditing(false)
    onChange(local)
  }

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={e => { if (e.key === 'Enter') handleBlur() }}
        placeholder={placeholder}
        className="w-full border border-blue-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
      />
    )
  }

  return (
    <button
      onClick={() => { setLocal(value || ''); setEditing(true) }}
      className="text-left w-full group"
    >
      {value ? (
        <span className="text-sm text-blue-800">{value}</span>
      ) : (
        <span className="text-sm text-blue-300 group-hover:text-blue-500">
          {placeholder} ✎
        </span>
      )}
    </button>
  )
}

// ── Status select ─────────────────────────────────────────────
function StatusSelect({ value, onChange, options, colors }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-blue-900 ${colors[value] || colors.default}`}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export default function ExamsPage() {
  const { batches } = useBatches()
  const [tab,         setTab]         = useState('paper_settings')
  const [selBatch,    setSelBatch]    = useState('')
  const [selLevel,    setSelLevel]    = useState('')
  const [selSemester, setSelSemester] = useState('')
  const [busy,        setBusy]        = useState(null)

  // local overrides for editable fields (keyed by assignment _id)
  const [paperSettings, setPaperSettings] = useState({})
  const [paperMarkings, setPaperMarkings] = useState({})

  const selBatchObj = batches.find(b => b._id === selBatch)
  const levels = selBatchObj?.programme === 'BSc'
    ? [1, 2]
    : selBatchObj?.programme === 'BCS'
    ? [1]
    : []

  const semesterNumber = selLevel && selSemester
    ? (Number(selLevel) - 1) * 2 + Number(selSemester)
    : null

  const { assignments, refetch } = useAssignments(selBatch, semesterNumber)

  // ── helpers ──────────────────────────────────────────────────
  function getPaperSetting(id)  { return paperSettings[id] || {} }
  function getPaperMarking(id)  { return paperMarkings[id] || {} }

  async function patchAssignment(id, body) {
    setBusy(id)
    try {
      const res = await fetch(`/api/subject-assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save changes')
      }

      refetch()
    } catch (error) {
      console.error('Failed to save assignment update:', error)
      alert(error.message)
    } finally {
      setBusy(null)
    }
  }

  function updatePaperSetting(id, field, value) {
    setPaperSettings(prev => ({
      ...prev,
      [id]: { ...getPaperSetting(id), [field]: value }
    }))
    patchAssignment(id, {
      paperSetting: { [field]: value }
    })
  }

  function updatePaperMarking(id, field, value) {
    setPaperMarkings(prev => ({
      ...prev,
      [id]: { ...getPaperMarking(id), [field]: value }
    }))
    patchAssignment(id, {
      paperMarking: { [field]: value }
    })
  }

  // get live value: local state first, then server data
  function psVal(a, field) {
    return getPaperSetting(a._id)[field] ?? a.paperSetting?.[field] ?? ''
  }
  function pmVal(a, field) {
    return getPaperMarking(a._id)[field] ?? a.paperMarking?.[field] ?? ''
  }

  const PAPER_STATUS_OPTS = [
    { value: 'pending',   label: 'Pending' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved',  label: 'Approved' },
  ]
  const PAPER_STATUS_COLORS = {
    pending:   'bg-amber-100 text-amber-700',
    submitted: 'bg-blue-100  text-blue-700',
    approved:  'bg-green-100 text-green-700',
    default:   'bg-amber-100 text-amber-700',
  }
  const MODERATE_STATUS_OPTS = [
    { value: 'pending',    label: 'Pending' },
    { value: 'moderated',  label: 'Moderated' },
  ]
  const MODERATE_STATUS_COLORS = {
    pending:   'bg-amber-100 text-amber-700',
    moderated: 'bg-green-100 text-green-700',
    default:   'bg-amber-100 text-amber-700',
  }
  const MARKING_STATUS_OPTS = [
    { value: 'not_finished', label: 'Not Finished' },
    { value: 'finished',     label: 'Finished' },
  ]
  const MARKING_STATUS_COLORS = {
    not_finished: 'bg-amber-100 text-amber-700',
    finished:     'bg-green-100 text-green-700',
    default:      'bg-amber-100 text-amber-700',
  }

  const showTable = selBatch && selLevel && selSemester

  return (
    <div>
      <TopHeader
        title="Exams"
        subtitle="Manage paper settings and marking for each subject"
      />

      <div className="px-8 py-6">

        {/* ── Selectors ── */}
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <select value={selBatch}
            onChange={e => { setSelBatch(e.target.value); setSelLevel(''); setSelSemester('') }}
            className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
            <option value="">— Select batch —</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>

          <select value={selLevel}
            onChange={e => { setSelLevel(e.target.value); setSelSemester('') }}
            disabled={!selBatch}
            className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-50">
            <option value="">— Select level —</option>
            {levels.map(l => (
              <option key={l} value={l}>Level {l}</option>
            ))}
          </select>

          <select value={selSemester}
            onChange={e => setSelSemester(e.target.value)}
            disabled={!selLevel}
            className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-50">
            <option value="">— Select semester —</option>
            {SEMESTER_OPTIONS.map(n => (
              <option key={n} value={n}>Semester {n}</option>
            ))}
          </select>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0 border-b border-blue-100 mb-6">
          {[
            { key: 'paper_settings', label: 'Paper Settings' },
            { key: 'paper_marking',  label: 'Paper Marking'  },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 text-sm border-b-2 -mb-px transition-colors
                ${tab === t.key
                  ? 'border-blue-900 text-blue-900 font-medium'
                  : 'border-transparent text-blue-400 hover:text-blue-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {!showTable ? (
          <div className="bg-white border border-dashed border-blue-200 rounded-xl p-10 text-center">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm text-blue-400">Select a batch, level and semester to view exams</p>
          </div>
        ) : (

          /* ── PAPER SETTINGS TAB ── */
          tab === 'paper_settings' ? (
            <div className="bg-white rounded-xl border border-blue-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-100 bg-blue-50">
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">Subject</th>
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">Lecturer</th>
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">Paper Setting Status</th>
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">Moderator Name</th>
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">Moderator Email</th>
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">Moderate Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-blue-400">
                        No subjects assigned to this semester yet
                      </td>
                    </tr>
                  ) : assignments.map(a => (
                    <tr key={a._id}
                      className={`border-b border-blue-50 hover:bg-blue-50 ${busy === a._id ? 'opacity-60' : ''}`}>

                      {/* Subject */}
                      <td className="px-5 py-3">
                        <p className="text-xs font-mono text-blue-400">{a.subjectId?.code}</p>
                        <p className="text-sm font-medium text-blue-800">{a.subjectId?.name}</p>
                      </td>

                      {/* Lecturer */}
                      <td className="px-5 py-3 text-blue-600 text-sm">
                        {a.lecturerId?.name || <span className="text-amber-500 text-xs">⚠ Not assigned</span>}
                      </td>

                      {/* Paper Setting Status */}
                      <td className="px-5 py-3">
                        <StatusSelect
                          value={psVal(a, 'status') || 'pending'}
                          onChange={v => updatePaperSetting(a._id, 'status', v)}
                          options={PAPER_STATUS_OPTS}
                          colors={PAPER_STATUS_COLORS}
                        />
                      </td>

                      {/* Moderator Name */}
                      <td className="px-5 py-3 min-w-[160px]">
                        <EditableCell
                          value={psVal(a, 'moderatorName')}
                          onChange={v => updatePaperSetting(a._id, 'moderatorName', v)}
                          placeholder="Add moderator"
                        />
                      </td>

                      {/* Moderator Email */}
                      <td className="px-5 py-3 min-w-[180px]">
                        <EditableCell
                          value={psVal(a, 'moderatorEmail')}
                          onChange={v => updatePaperSetting(a._id, 'moderatorEmail', v)}
                          placeholder="Add email"
                          type="email"
                        />
                      </td>

                      {/* Moderate Status */}
                      <td className="px-5 py-3">
                        <StatusSelect
                          value={psVal(a, 'moderateStatus') || 'pending'}
                          onChange={v => updatePaperSetting(a._id, 'moderateStatus', v)}
                          options={MODERATE_STATUS_OPTS}
                          colors={MODERATE_STATUS_COLORS}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          ) : (

            /* ── PAPER MARKING TAB ── */
            <div className="bg-white rounded-xl border border-blue-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-100 bg-blue-50">
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">Subject</th>
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">First Marker (Lecturer)</th>
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">First Marking Status</th>
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">Second Marker</th>
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">Second Marker Email</th>
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">Second Marking Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-blue-400">
                        No subjects assigned to this semester yet
                      </td>
                    </tr>
                  ) : assignments.map(a => (
                    <tr key={a._id}
                      className={`border-b border-blue-50 hover:bg-blue-50 ${busy === a._id ? 'opacity-60' : ''}`}>

                      {/* Subject */}
                      <td className="px-5 py-3">
                        <p className="text-xs font-mono text-blue-400">{a.subjectId?.code}</p>
                        <p className="text-sm font-medium text-blue-800">{a.subjectId?.name}</p>
                      </td>

                      {/* First Marker — the assigned lecturer */}
                      <td className="px-5 py-3">
                        <p className="text-sm text-blue-700">
                          {a.lecturerId?.name || <span className="text-amber-500 text-xs">⚠ Not assigned</span>}
                        </p>
                        {a.lecturerId?.email && (
                          <p className="text-xs text-blue-400">{a.lecturerId.email}</p>
                        )}
                      </td>

                      {/* First Marking Status */}
                      <td className="px-5 py-3">
                        <StatusSelect
                          value={pmVal(a, 'firstMarkingStatus') || 'not_finished'}
                          onChange={v => updatePaperMarking(a._id, 'firstMarkingStatus', v)}
                          options={MARKING_STATUS_OPTS}
                          colors={MARKING_STATUS_COLORS}
                        />
                      </td>

                      {/* Second Marker Name */}
                      <td className="px-5 py-3 min-w-[160px]">
                        <EditableCell
                          value={pmVal(a, 'secondMarkerName')}
                          onChange={v => updatePaperMarking(a._id, 'secondMarkerName', v)}
                          placeholder="Add second marker"
                        />
                      </td>

                      {/* Second Marker Email */}
                      <td className="px-5 py-3 min-w-[180px]">
                        <EditableCell
                          value={pmVal(a, 'secondMarkerEmail')}
                          onChange={v => updatePaperMarking(a._id, 'secondMarkerEmail', v)}
                          placeholder="Add email"
                          type="email"
                        />
                      </td>

                      {/* Second Marking Status */}
                      <td className="px-5 py-3">
                        <StatusSelect
                          value={pmVal(a, 'secondMarkingStatus') || 'not_finished'}
                          onChange={v => updatePaperMarking(a._id, 'secondMarkingStatus', v)}
                          options={MARKING_STATUS_OPTS}
                          colors={MARKING_STATUS_COLORS}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}