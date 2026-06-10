'use client'

import { useState } from 'react'
import { useSubjects } from '@/hooks/useSubjects'
import { useUsers }    from '@/hooks/useUsers'
import { useBatches }  from '@/hooks/useBatches'
import { useAssignments } from '@/hooks/useAssignments'
import TopHeader from '@/components/TopHeader'

const TYPE_COLORS = {
  theory:     'bg-blue-100   text-blue-700',
  practical:  'bg-green-100  text-green-700',
  project:    'bg-purple-100 text-purple-700',
}

const PROG_COLORS = {
  BSc:  'bg-purple-100 text-purple-700',
  BCS:  'bg-orange-100 text-orange-700',
  Both: 'bg-gray-100   text-gray-600',
}

// ── inline modal ──────────────────────────────────────────────
function SubjectFormModal({ subject, onClose, onSaved }) {
  const isEditing = !!subject
  const [form, setForm] = useState({
    code:        subject?.code        || '',
    name:        subject?.name        || '',
    credits:     subject?.credits     || 3,
    type:        subject?.type        || 'theory',
    programme:   subject?.programme   || 'Both',
    description: subject?.description || '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    setLoading(true)
    try {
      const url    = isEditing ? `/api/subjects/${subject._id}` : '/api/subjects'
      const method = isEditing ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!data.success) { setError(data.message); return }
      onSaved(); onClose()
    } catch { setError('Something went wrong') }
    finally  { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold">
            {isEditing ? 'Edit subject' : 'Add new subject'}
          </h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Subject code</label>
              <input name="code" value={form.code} onChange={handleChange} required
                placeholder="e.g. CS101"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Credits</label>
              <input name="credits" type="number" value={form.credits} onChange={handleChange}
                required min="1" max="6"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Subject name</label>
            <input name="name" value={form.name} onChange={handleChange} required
              placeholder="e.g. Data Structures and Algorithms"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Type</label>
              <select name="type" value={form.type} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="theory">Theory</option>
                <option value="practical">Practical</option>
                <option value="project">Project</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Programme</label>
              <select name="programme" value={form.programme} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="Both">Both</option>
                <option value="BSc">BSc only</option>
                <option value="BCS">BCS only</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Description (optional)</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={2} placeholder="Brief description..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"/>
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50">
              {loading ? 'Saving...' : isEditing ? 'Save changes' : 'Create subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── assign subject modal ──────────────────────────────────────
function AssignModal({ batchId, semesterNumber, year, onClose, onSaved }) {
  const { subjects } = useSubjects()
  const { users: lecturers } = useUsers('lecturer')
  const { users: visiting  } = useUsers('visiting_lecturer')
  const allLecturers = [...lecturers, ...visiting]

  const [form, setForm] = useState({
    subjectId:  '',
    lecturerId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/subject-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId:      form.subjectId,
          lecturerId:     form.lecturerId || null,
          batchId, semesterNumber, year
        })
      })
      const data = await res.json()
      if (!data.success) { setError(data.message); return }
      onSaved(); onClose()
    } catch { setError('Something went wrong') }
    finally  { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold">Assign subject</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Subject</label>
            <select name="subjectId" value={form.subjectId} required
              onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
              <option value="">— Select subject —</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>
                  {s.code} — {s.name} ({s.credits} credits)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Assign lecturer (optional)</label>
            <select name="lecturerId" value={form.lecturerId}
              onChange={e => setForm(p => ({ ...p, lecturerId: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
              <option value="">— Assign later —</option>
              {allLecturers.map(l => (
                <option key={l._id} value={l._id}>
                  {l.name} ({l.role === 'visiting_lecturer' ? 'Visiting' : 'Permanent'})
                </option>
              ))}
            </select>
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm disabled:opacity-50">
              {loading ? 'Saving...' : 'Assign subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────
export default function SubjectsPage() {
  const { subjects, loading, error, refetch } = useSubjects()
  const { batches } = useBatches()
  const [tab,          setTab]          = useState('pool')   // 'pool' | 'assigned'
  const [search,       setSearch]       = useState('')
  const [showForm,     setShowForm]     = useState(false)
  const [editSubject,  setEditSubject]  = useState(null)
  const [showAssign,   setShowAssign]   = useState(false)
  const [selBatch,     setSelBatch]     = useState('')
  const [selSemester,  setSelSemester]  = useState('')

  const selBatchObj   = batches.find(b => b._id === selBatch)
  const semesters     = selBatchObj?.semesters || []
  const currentYear   = new Date().getFullYear()

  const { assignments, refetch: refetchAssignments } =
    useAssignments(selBatch, selSemester ? Number(selSemester) : null)

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  )

  async function handleRemoveAssignment(id) {
    if (!confirm('Remove this subject from the semester?')) return
    await fetch(`/api/subject-assignments/${id}`, { method: 'DELETE' })
    refetchAssignments()
  }

  return (
    <div>
      <TopHeader
        title="Subjects"
        subtitle="Manage subject pool and semester assignments"
        action={
          <button onClick={() => { setEditSubject(null); setShowForm(true) }}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
            + New subject
          </button>
        }
      />

      <div className="px-8 py-6">

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-100 mb-6">
          {[
            { key: 'pool',     label: 'Subject pool' },
            { key: 'assigned', label: 'Semester assignments' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 text-sm border-b-2 -mb-px transition-colors
                ${tab === t.key
                  ? 'border-gray-900 text-gray-900 font-medium'
                  : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Subject pool ── */}
        {tab === 'pool' && (
          <>
            <div className="mb-4">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or code..."
                className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
            </div>

            {loading ? <p className="text-sm text-gray-400">Loading...</p> :
             error   ? <p className="text-sm text-red-500">{error}</p> : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Code</th>
                      <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Name</th>
                      <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Credits</th>
                      <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Type</th>
                      <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Programme</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                        No subjects found
                      </td></tr>
                    ) : filtered.map(s => (
                      <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 font-mono font-medium text-gray-800">{s.code}</td>
                        <td className="px-5 py-3 text-gray-700">{s.name}</td>
                        <td className="px-5 py-3 text-gray-500">{s.credits}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[s.type]}`}>
                            {s.type}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROG_COLORS[s.programme]}`}>
                            {s.programme}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-3 justify-end">
                            <button onClick={() => { setEditSubject(s); setShowForm(true) }}
                              className="text-xs text-blue-600 hover:underline">Edit</button>
                            <button onClick={async () => {
                              if (!confirm('Deactivate this subject?')) return
                              await fetch(`/api/subjects/${s._id}`, { method: 'DELETE' })
                              refetch()
                            }} className="text-xs text-red-400 hover:underline">Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── TAB: Semester assignments ── */}
        {tab === 'assigned' && (
          <>
            {/* Filters */}
            <div className="flex gap-3 mb-5 flex-wrap">
              <select value={selBatch} onChange={e => { setSelBatch(e.target.value); setSelSemester('') }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">— Select batch —</option>
                {batches.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
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
                <button onClick={() => setShowAssign(true)}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
                  + Assign subject
                </button>
              )}
            </div>

            {/* Assignment table */}
            {selBatch && selSemester ? (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Code</th>
                      <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Subject</th>
                      <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Credits</th>
                      <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Type</th>
                      <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Lecturer</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                        No subjects assigned to this semester yet
                      </td></tr>
                    ) : assignments.map(a => (
                      <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 font-mono font-medium text-gray-800">
                          {a.subjectId?.code}
                        </td>
                        <td className="px-5 py-3 text-gray-700">{a.subjectId?.name}</td>
                        <td className="px-5 py-3 text-gray-500">{a.subjectId?.credits}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${TYPE_COLORS[a.subjectId?.type]}`}>
                            {a.subjectId?.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                          {a.lecturerId?.name || (
                            <span className="text-amber-500 text-xs">⚠ Not assigned</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <button onClick={() => handleRemoveAssignment(a._id)}
                            className="text-xs text-red-400 hover:underline">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
                <p className="text-2xl mb-2">📚</p>
                <p className="text-sm text-gray-400">Select a batch and semester to view assignments</p>
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <SubjectFormModal
          subject={editSubject}
          onClose={() => setShowForm(false)}
          onSaved={refetch}
        />
      )}

      {showAssign && (
        <AssignModal
          batchId={selBatch}
          semesterNumber={Number(selSemester)}
          year={currentYear}
          onClose={() => setShowAssign(false)}
          onSaved={refetchAssignments}
        />
      )}
    </div>
  )
}