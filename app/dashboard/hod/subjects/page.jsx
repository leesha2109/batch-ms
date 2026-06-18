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
}

// ── inline modal ──────────────────────────────────────────────
function SubjectFormModal({ subject, onClose, onSaved }) {
  const isEditing = !!subject

  const [form, setForm] = useState({
    programme:   subject?.programme   || 'Both',
    name:        subject?.name        || '',
    credits:     subject?.credits     || 3,
    type:        subject?.type        || 'theory',
    code:        subject?.code        || '',
    level:       subject?.level       || 1,
    semester:    subject?.semester    || 1,
    bscCode:     '',
    bscLevel:    1,
    bscSemester: 1,
    bcsCode:     '',
    bcsSemester: 1,
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    setLoading(true)
    try {
      const url    = isEditing ? `/api/subjects/${subject._id}` : '/api/subjects'
      const method = isEditing ? 'PATCH' : 'POST'

      let payload
      if (isEditing) {
        payload = {
          name: form.name, credits: Number(form.credits), type: form.type,
          programme: form.programme, code: form.code,
          level: Number(form.level), semester: Number(form.semester),
          description: form.description
        }
      } else if (form.programme === 'Both') {
        payload = {
          programme: 'Both',
          name: form.name, credits: Number(form.credits), type: form.type,
          description: form.description,
          bscCode: form.bscCode, bscLevel: Number(form.bscLevel), bscSemester: Number(form.bscSemester),
          bcsCode: form.bcsCode, bcsSemester: Number(form.bcsSemester),
        }
      } else {
        payload = {
          programme: form.programme,
          name: form.name, credits: Number(form.credits), type: form.type,
          description: form.description,
          code: form.code, level: Number(form.level), semester: Number(form.semester),
        }
      }

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!data.success) { setError(data.message); return }
      onSaved(); onClose()
    } catch { setError('Something went wrong') }
    finally  { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100">
          <h2 className="text-base font-semibold">
            {isEditing ? 'Edit subject' : 'Add new subject'}
          </h2>
          <button onClick={onClose} className="text-blue-400 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          <div>
            <label className="text-s text-blue-500 block mb-1">Programme</label>
            <select name="programme" value={form.programme} onChange={handleChange}
              disabled={isEditing}
              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-blue-50">
              <option value="Both">Both (BSc + BCS)</option>
              <option value="BSc">BSc only</option>
              <option value="BCS">BCS only</option>
            </select>
            {isEditing && (
              <p className="text-xs text-blue-400 mt-1">Programme Can't be changed after creation.</p>
            )}
          </div>

          <div>
            <label className="text-s text-blue-500 block mb-1">Subject name</label>
            <input name="name" value={form.name} onChange={handleChange} required
              placeholder="e.g. Data Structures and Algorithms"
              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-s text-blue-500 block mb-1">Credits</label>
              <input name="credits" type="number" value={form.credits} onChange={handleChange}
                required min="1" max="6"
                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"/>
            </div>
            <div>
              <label className="text-s text-blue-500 block mb-1">Type</label>
              <select name="type" value={form.type} onChange={handleChange}
                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                <option value="theory">Theory</option>
                <option value="practical">Practical</option>
                <option value="project">Project</option>
              </select>
            </div>
          </div>

          {(isEditing || form.programme === 'BSc' || form.programme === 'BCS') && (
            <div className="bg-blue-50 rounded-lg p-3 space-y-3">
              <p className="text-xs font-medium text-blue-600">
                {form.programme} details
              </p>
              <div>
                <label className="text-s text-blue-500 block mb-1">Course code</label>
                <input name="code" value={form.code} onChange={handleChange} required
                  placeholder={form.programme === 'BSc' ? 'e.g. CSS101' : 'e.g. CSC101'}
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-s text-blue-500 block mb-1">Level</label>
                  <select name="level" value={form.level} onChange={handleChange}
                    disabled={form.programme === 'BCS'}
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 disabled:bg-blue-100">
                    {(form.programme === 'BCS' ? [1] : [1, 2]).map(lvl => (
                      <option key={lvl} value={lvl}>Level {lvl}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-s text-blue-500 block mb-1">Semester</label>
                  <select name="semester" value={form.semester} onChange={handleChange}
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {!isEditing && form.programme === 'Both' && (
            <>
              <div className="bg-purple-50 rounded-lg p-3 space-y-3">
                <p className="text-xs font-medium text-purple-700">BSc details</p>
                <div>
                  <label className="text-s text-blue-500 block mb-1">Course code</label>
                  <input name="bscCode" value={form.bscCode} onChange={handleChange} required
                    placeholder="e.g. CSS101"
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-s text-blue-500 block mb-1">Level</label>
                    <select name="bscLevel" value={form.bscLevel} onChange={handleChange}
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                      <option value={1}>Level 1</option>
                      <option value={2}>Level 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-s text-blue-500 block mb-1">Semester</label>
                    <select name="bscSemester" value={form.bscSemester} onChange={handleChange}
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                      <option value={1}>Semester 1</option>
                      <option value={2}>Semester 2</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-3 space-y-3">
                <p className="text-xs font-medium text-orange-700">BCS details (Level 1 only)</p>
                <div>
                  <label className="text-s text-blue-500 block mb-1">Course code</label>
                  <input name="bcsCode" value={form.bcsCode} onChange={handleChange} required
                    placeholder="e.g. CSC101"
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"/>
                </div>
                <div>
                  <label className="text-s text-blue-500 block mb-1">Semester</label>
                  <select name="bcsSemester" value={form.bcsSemester} onChange={handleChange}
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* <div>
            <label className="text-s text-blue-500 block mb-1">Description (optional)</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={2} placeholder="Brief description..."
              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 resize-none"/>
          </div> */}

          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-blue-200 text-blue-600 py-2 rounded-lg text-sm hover:bg-blue-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-900 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100">
          <h2 className="text-base font-semibold">Assign subject</h2>
          <button onClick={onClose} className="text-blue-400 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-s text-blue-500 block mb-1">Subject</label>
            <select name="subjectId" value={form.subjectId} required
              onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))}
              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
              <option value="">— Select subject —</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>
                  {s.code} — {s.name} ({s.credits} credits)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-s text-blue-500 block mb-1">Assign lecturer (optional)</label>
            <select name="lecturerId" value={form.lecturerId}
              onChange={e => setForm(p => ({ ...p, lecturerId: e.target.value }))}
              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
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
              className="flex-1 border border-blue-200 text-blue-600 py-2 rounded-lg text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-900 text-white py-2 rounded-lg text-sm disabled:opacity-50">
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
  const [tab,          setTab]          = useState('pool')
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
            className="bg-white text-blue-900 border border-blue-200 px-4 py-2 rounded-lg text-sm hover:bg-blue-50">
            + New subject
          </button>
        }
      />

      <div className="px-8 py-6">

        <div className="flex gap-0 border-b border-blue-100 mb-6">
          {[
            { key: 'pool',     label: 'Subject pool' },
            { key: 'assigned', label: 'Semester assignments' },
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

        {tab === 'pool' && (
          <>
            <div className="mb-4">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or code..."
                className="w-full max-w-sm border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"/>
            </div>

            {loading ? <p className="text-sm text-blue-400">Loading...</p> :
             error   ? <p className="text-sm text-red-500">{error}</p> : (
              <div className="grid grid-cols-2 gap-4">
                {['BSc', 'BCS'].map(programme => {
                  const progSubjects = filtered.filter(s => s.programme === programme)
                  const grouped = {}
                  progSubjects.forEach(s => {
                    const key = `${s.level}-${s.semester}`
                    if (!grouped[key]) grouped[key] = []
                    grouped[key].push(s)
                  })
                  const sortedKeys = Object.keys(grouped).sort((a, b) => {
                    const [la, sa] = a.split('-').map(Number)
                    const [lb, sb] = b.split('-').map(Number)
                    return la - lb || sa - sb
                  })

                  return (
                    <div key={programme} className="space-y-3">
                      <div className="bg-blue-900 rounded-xl px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                        <h3 className="text-md font-bold text-white">{programme}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/15 text-white">
                          {progSubjects.length} subjects
                        </span>
                      </div>

                      {sortedKeys.length === 0 ? (
                        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
                          <p className="text-sm text-blue-400">No subjects yet.</p>
                        </div>
                      ) : sortedKeys.map(key => {
                        const [level, semester] = key.split('-')
                        const subs = grouped[key]
                        const totalCredits = subs.reduce((sum, s) => sum + (s.credits || 0), 0)

                        return (
                          <div key={key} className="bg-blue-50 rounded-xl border border-blue-100 p-4">
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-100">
                              <p className="text-sm font-medium text-blue-700">
                                Level {level} · Semester {semester}
                              </p>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">
                                {totalCredits} credits
                              </span>
                            </div>
                            <div className="space-y-1">
                              {subs.map(s => (
                                <div key={s._id} className="flex items-center justify-between py-2 border-b border-blue-100 last:border-0">
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <p className="text-s font-mono text-blue-400">{s.code}</p>
                                      <p className="text-sm text-blue-800">{s.name}</p>
                                    </div>
                                    {s.groupId && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-500">
                                        BSc & BCS
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-blue-500 bg-white px-2 py-0.5 rounded-full">
                                      {s.credits} credits
                                    </span>
                                    <div className="flex gap-2">
                                      <button onClick={() => { setEditSubject(s); setShowForm(true) }}
                                        className="text-xs text-blue-600 hover:underline">Edit</button>
                                      <button onClick={async () => {
                                        if (!confirm('Deactivate this subject?')) return
                                        await fetch(`/api/subjects/${s._id}`, { method: 'DELETE' })
                                        refetch()
                                      }} className="text-xs text-red-400 hover:underline">Remove</button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'assigned' && (
          <>
            <div className="flex gap-3 mb-5 flex-wrap">
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
                {semesters.map(s => (
                  <option key={s._id} value={s.semesterNumber}>
                    Semester {s.semesterNumber}
                  </option>
                ))}
              </select>

              {selBatch && selSemester && (
                <button onClick={() => setShowAssign(true)}
                  className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                  + Assign subject
                </button>
              )}
            </div>

            {selBatch && selSemester ? (
              <div className="bg-white rounded-xl border border-blue-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-blue-100 bg-blue-50">
                      <th className="text-left px-5 py-3 text-s text-blue-400 font-medium">Code</th>
                      <th className="text-left px-5 py-3 text-s text-blue-400 font-medium">Subject</th>
                      <th className="text-left px-5 py-3 text-s text-blue-400 font-medium">Credits</th>
                      <th className="text-left px-5 py-3 text-s text-blue-400 font-medium">Type</th>
                      <th className="text-left px-5 py-3 text-s text-blue-400 font-medium">Lecturer</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-8 text-center text-blue-400">
                        No subjects assigned to this semester yet
                      </td></tr>
                    ) : assignments.map(a => (
                      <tr key={a._id} className="border-b border-blue-50 hover:bg-blue-50">
                        <td className="px-5 py-3 font-mono font-medium text-blue-800">
                          {a.subjectId?.code}
                        </td>
                        <td className="px-5 py-3 text-blue-700">{a.subjectId?.name}</td>
                        <td className="px-5 py-3 text-blue-500">{a.subjectId?.credits}</td>
                        <td className="px-5 py-3">
                          <span className={`text-s px-2 py-0.5 rounded-full font-medium
                            ${TYPE_COLORS[a.subjectId?.type]}`}>
                            {a.subjectId?.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-blue-500">
                          {a.lecturerId?.name || (
                            <span className="text-amber-500 text-s">⚠ Not assigned</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <button onClick={() => handleRemoveAssignment(a._id)}
                            className="text-s text-red-400 hover:underline">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white border border-dashed border-blue-200 rounded-xl p-10 text-center">
                <p className="text-2xl mb-2">📚</p>
                <p className="text-sm text-blue-400">Select a batch and semester to view assignments</p>
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