'use client'

import { useState } from 'react'
import { useBatches } from '@/hooks/useBatches'
import { useAssignments } from '@/hooks/useAssignments'
import TopHeader from '@/components/TopHeader'

const TYPE_COLORS = {
  theory:     'bg-blue-100   text-blue-700',
  practical:  'bg-green-100  text-green-700',
  project:    'bg-purple-100 text-purple-700',
}

const EXAM_COLORS = {
  held:     'bg-green-100 text-green-700',
  not_held: 'bg-amber-100 text-amber-700',
}

const RESULT_COLORS = {
  released: 'bg-blue-100  text-blue-700',
  pending:  'bg-amber-100 text-amber-700',
}

export default function ResultsPage() {
  const { batches } = useBatches()
  const [selBatch,    setSelBatch]    = useState('')
  const [selSemester, setSelSemester] = useState('')
  const [busyId,      setBusyId]      = useState(null)

  const selBatchObj = batches.find(b => b._id === selBatch)

  // BCS only has Semester 1-2, BSc has Semester 1-4
  const semesters = selBatchObj?.programme === 'BSc'
    ? [1, 2, 3, 4]
    : selBatchObj?.programme === 'BCS'
    ? [1, 2]
    : []

  const { assignments, refetch } = useAssignments(
    selBatch, selSemester ? Number(selSemester) : null
  )

  const examHeldCount        = assignments.filter(a => a.examHeld).length
  const resultsReleasedCount = assignments.filter(a => a.resultsReleased).length

  async function patchAssignment(id, body) {
    setBusyId(id)
    try {
      await fetch(`/api/subject-assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      refetch()
    } finally {
      setBusyId(null)
    }
  }

  function handleExamChange(a, value) {
    const held = value === 'held'
    // un-marking exam as held also forces results back to pending
    patchAssignment(a._id, held
      ? { examHeld: true }
      : { examHeld: false, resultsReleased: false }
    )
  }

  function handleResultsChange(a, value) {
    if (!a.examHeld) return // can't release results before exam is held
    patchAssignment(a._id, { resultsReleased: value === 'released' })
  }

  return (
    <div>
      <TopHeader
        title="Results"
        subtitle="Track exam status and result release per subject"
      />

      <div className="px-8 py-6">

        {/* Controls */}
        <div className="flex gap-3 mb-5 flex-wrap items-center">
          <select value={selBatch} onChange={e => { setSelBatch(e.target.value); setSelSemester('') }}
            className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
            <option value="">— Select batch —</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>

          <select value={selSemester} onChange={e => setSelSemester(e.target.value)}
            disabled={!selBatch}
            className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-50">
            <option value="">— Select semester —</option>
            {semesters.map(num => (
              <option key={num} value={num}>
                Semester {num}
              </option>
            ))}
          </select>

          {selBatch && selSemester && assignments.length > 0 && (
            <div className="flex gap-2 ml-auto">
              <span className="text-xs px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-medium">
                {examHeldCount}/{assignments.length} exams held
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                {resultsReleasedCount}/{assignments.length} results released
              </span>
            </div>
          )}
        </div>

        {selBatch && selSemester ? (
          <div className="bg-white rounded-xl border border-blue-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-100 bg-blue-50">
                  <th className="text-left px-5 py-3 text-s text-blue-400 font-medium">Code</th>
                  <th className="text-left px-5 py-3 text-s text-blue-400 font-medium">Subject</th>
                  <th className="text-left px-5 py-3 text-s text-blue-400 font-medium">Type</th>
                  <th className="text-left px-5 py-3 text-s text-blue-400 font-medium">Lecturer</th>
                  <th className="text-left px-5 py-3 text-s text-blue-400 font-medium">Exam status</th>
                  <th className="text-left px-5 py-3 text-s text-blue-400 font-medium">Results status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-blue-400">
                    No subjects assigned to this semester yet
                  </td></tr>
                ) : assignments.map(a => {
                  const examHeld = !!a.examHeld
                  const released = !!a.resultsReleased

                  return (
                    <tr key={a._id} className="border-b border-blue-50 hover:bg-blue-50">
                      <td className="px-5 py-3 font-mono font-medium text-blue-800">
                        {a.subjectId?.code}
                      </td>
                      <td className="px-5 py-3 text-blue-700">{a.subjectId?.name}</td>
                      <td className="px-5 py-3">
                        <span className={`text-s px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[a.subjectId?.type]}`}>
                          {a.subjectId?.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-blue-500">
                        {a.lecturerId?.name || <span className="text-amber-500 text-s">⚠ Not assigned</span>}
                      </td>

                      {/* Exam status — dropdown */}
                      <td className="px-5 py-3">
                        <select
                          value={examHeld ? 'held' : 'not_held'}
                          disabled={busyId === a._id}
                          onChange={e => handleExamChange(a, e.target.value)}
                          className={`text-s px-2 py-1 rounded-full font-medium border-0 cursor-pointer
                            focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-50
                            ${EXAM_COLORS[examHeld ? 'held' : 'not_held']}`}>
                          <option value="not_held">Not held</option>
                          <option value="held">Held</option>
                        </select>
                      </td>

                      {/* Results status — dropdown */}
                      <td className="px-5 py-3">
                        <select
                          value={released ? 'released' : 'pending'}
                          disabled={busyId === a._id || !examHeld}
                          title={!examHeld ? 'Exam must be held first' : ''}
                          onChange={e => handleResultsChange(a, e.target.value)}
                          className={`text-s px-2 py-1 rounded-full font-medium border-0 cursor-pointer
                            focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:opacity-50
                            ${RESULT_COLORS[released ? 'released' : 'pending']}`}>
                          <option value="pending">Pending</option>
                          <option value="released">Released</option>
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-blue-200 rounded-xl p-10 text-center">
            <p className="text-2xl mb-2">📝</p>
            <p className="text-sm text-blue-400">Select a batch and semester to view exam &amp; results status</p>
          </div>
        )}
      </div>
    </div>
  )
}