'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import TopHeader from '@/components/TopHeader'
import { useBatches } from '@/hooks/useBatches'
import { useUsers }   from '@/hooks/useUsers'

const STATUS_COLORS = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  submitted:   'bg-yellow-100 text-yellow-700',
  evaluated:   'bg-green-100 text-green-700',
}
const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  submitted:   'Submitted',
  evaluated:   'Evaluated',
}

// The 4 expected student submission documents
const EXPECTED_DOCS = [
  { key: 'research_proposal', label: 'Research Proposal' },
  { key: 'interim_report',    label: 'Interim Report'    },
  { key: 'manuscript',        label: 'Manuscript'        },
  { key: 'final_thesis',      label: 'Final Thesis'      },
]

// Timeline stages mapped to status
const TIMELINE_STAGES = [
  { key: 'not_started', label: 'Not Started',  icon: '○' },
  { key: 'in_progress', label: 'In Progress',  icon: '◑' },
  { key: 'submitted',   label: 'Submitted',    icon: '◕' },
  { key: 'evaluated',   label: 'Evaluated',    icon: '●' },
]

async function readJsonSafely(response) {
  const text = await response.text()
  if (!text) return null
  try { return JSON.parse(text) } catch { return null }
}

// ── Project form modal ────────────────────────────────────────
function ProjectFormModal({ project, courseId, batchId, onClose, onSaved }) {
  const isEditing = !!project?._id
  const { users: students }  = useUsers('student')
  const { users: lecturers } = useUsers('lecturer')

  const [form, setForm] = useState({
    title:        project?.title        || '',
    description:  project?.description  || '',
    type:         project?.type         || 'individual',
    supervisorId: project?.supervisorId?._id || project?.supervisorId || '',
    students:     project?.students?.map(s => s._id || s) || [],
    status:       project?.status       || 'not_started',
    startDate:    project?.startDate    ? project.startDate.slice(0, 10) : '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function toggleStudent(id) {
    setForm(prev => ({
      ...prev,
      students: prev.students.includes(id)
        ? prev.students.filter(s => s !== id)
        : [...prev.students, id]
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url    = isEditing ? `/api/projects/${project._id}` : '/api/projects'
      const method = isEditing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, subjectId: courseId, batchId })
      })
      const data = await res.json()
      if (!data.success) { setError(data.message); return }
      if (onSaved) onSaved(data.project)
      onClose()
    } catch { setError('Something went wrong') }
    finally  { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-base font-semibold">
            {isEditing ? 'Edit project' : 'Add new project'}
          </h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          <div>
            <label className="text-xs text-gray-500 block mb-1">Project title</label>
            <input value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required placeholder="e.g. Student Management System"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Description</label>
            <textarea value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2} placeholder="Brief project description..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Type</label>
              <select value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value, students: [] }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="individual">Individual</option>
                <option value="group">Group</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Start date</label>
              <input type="date" value={form.startDate}
                onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Status</label>
              <select value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="evaluated">Evaluated</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Supervisor</label>
              <select value={form.supervisorId}
                onChange={e => setForm(p => ({ ...p, supervisorId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">— Select —</option>
                {lecturers.map(l => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">
              {form.type === 'group' ? 'Assign students (select multiple)' : 'Assign student (select one)'}
            </label>
            <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-50">
              {students.length === 0 ? (
                <p className="text-xs text-gray-400 p-3">No students found</p>
              ) : students.map(s => (
                <label key={s._id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type={form.type === 'individual' ? 'radio' : 'checkbox'}
                    checked={form.students.includes(s._id)}
                    onChange={() => {
                      if (form.type === 'individual') {
                        setForm(p => ({ ...p, students: [s._id] }))
                      } else {
                        toggleStudent(s._id)
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{s.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{s.studentId}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50">
              {loading ? 'Saving...' : isEditing ? 'Save changes' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Project detail view (shown when a row is clicked) ─────────
function ProjectDetailView({ project, onBack, onEdit, onDelete }) {
  const currentStageIdx = TIMELINE_STAGES.findIndex(s => s.key === project.status)

  // Match uploaded docs against the 4 expected ones
  const uploadedDocs = project.documents || []

  return (
    <div className="space-y-5">

      {/* Back button + actions */}
      <div className="flex items-center justify-between">
        <button onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          ← Back to list
        </button>
        <div className="flex gap-2">
          <button onClick={onEdit}
            className="text-sm border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50">
            Edit
          </button>
          <button onClick={onDelete}
            className="text-sm border border-red-100 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50">
            Delete
          </button>
        </div>
      </div>

      {/* Project header card */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                ${project.type === 'group' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {project.type === 'group' ? 'Group' : 'Individual'}
              </span>
            </div>
            <h2 className="text-base font-semibold text-gray-800">{project.title}</h2>
            {project.description && (
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-50">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Supervisor</p>
            <p className="text-sm text-gray-700 font-medium">
              {project.supervisorId?.name || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Start date</p>
            <p className="text-sm text-gray-700 font-medium">
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">
              {project.type === 'group' ? 'Students' : 'Student'}
            </p>
            <div className="flex flex-wrap gap-1">
              {project.students?.length === 0 ? (
                <span className="text-sm text-gray-400">—</span>
              ) : project.students?.map(s => (
                <span key={s._id}
                  className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {s.name}{s.studentId ? ` (${s.studentId})` : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress timeline */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Progress</h3>

        {/* Status badge */}
        <div className="flex items-center gap-2 mb-5">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[project.status]}`}>
            {STATUS_LABELS[project.status]}
          </span>
        </div>

        {/* Timeline bar */}
        <div className="relative">
          {/* connecting line */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 z-0" />
          <div
            className="absolute top-4 left-4 h-0.5 bg-blue-500 z-0 transition-all"
            style={{
              width: currentStageIdx <= 0
                ? '0%'
                : `${(currentStageIdx / (TIMELINE_STAGES.length - 1)) * 100}%`
            }}
          />

          {/* Stage dots */}
          <div className="relative z-10 flex justify-between">
            {TIMELINE_STAGES.map((stage, idx) => {
              const done    = idx < currentStageIdx
              const current = idx === currentStageIdx
              return (
                <div key={stage.key} className="flex flex-col items-center gap-2 w-24">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                    ${done    ? 'bg-blue-500 border-blue-500 text-white'
                    : current ? 'bg-white border-blue-500 text-blue-600'
                    :           'bg-white border-gray-200 text-gray-400'}`}>
                    {done ? '✓' : idx + 1}
                  </div>
                  <p className={`text-xs text-center leading-tight
                    ${current ? 'text-blue-700 font-semibold'
                    : done    ? 'text-blue-500'
                    :           'text-gray-400'}`}>
                    {stage.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Student submitted documents — view/download only for HOD */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Submitted documents
          <span className="ml-2 text-xs font-normal text-gray-400">
            {uploadedDocs.length} / {EXPECTED_DOCS.length} uploaded
          </span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {EXPECTED_DOCS.map((expected, i) => {
            // Try to match by doc name/label containing the key words
            const uploaded = uploadedDocs[i] || null

            return (
              <div key={expected.key}
                className={`rounded-lg border p-3 flex items-center justify-between
                  ${uploaded ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{uploaded ? '📄' : '📭'}</span>
                  <div>
                    <p className="text-xs font-medium text-gray-700">{expected.label}</p>
                    {uploaded ? (
                      <p className="text-xs text-gray-400 truncate max-w-[140px]">{uploaded.name}</p>
                    ) : (
                      <p className="text-xs text-gray-400">Not submitted</p>
                    )}
                  </div>
                </div>
                {uploaded && (
                  <a href={uploaded.url} target="_blank" rel="noreferrer" download
                    className="text-xs text-blue-600 hover:underline ml-2 flex-shrink-0">
                    ⬇ Download
                  </a>
                )}
              </div>
            )
          })}
        </div>

        {uploadedDocs.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            No documents submitted yet by the student.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function CourseProjectsPage() {
  const params = useParams()
  const rawCourseId = params?.courseId || params?.courseID
  const courseId = typeof rawCourseId === 'string'
    ? rawCourseId
    : Array.isArray(rawCourseId) ? rawCourseId[0] : ''

  const router = useRouter()
  const { batches } = useBatches()

  const [subject,      setSubject]      = useState(null)
  const [projects,     setProjects]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [selBatch,     setSelBatch]     = useState('')
  const [showModal,    setShowModal]    = useState(false)
  const [editProject,  setEditProject]  = useState(null)
  const [detailProject, setDetailProject] = useState(null) // ← selected row

  // fetch subject
  useEffect(() => {
    if (!courseId) return
    fetch(`/api/subjects/${courseId}`, { credentials: 'include' })
      .then(readJsonSafely)
      .then(d => { if (d?.success) setSubject(d.subject) })
      .catch(() => setSubject(null))
  }, [courseId])

  // fetch projects
  async function fetchProjects() {
    if (!courseId) { setProjects([]); setLoading(false); return }
    setLoading(true)
    try {
      const url = selBatch
        ? `/api/projects?subjectId=${courseId}&batchId=${selBatch}`
        : `/api/projects?subjectId=${courseId}`
      const res  = await fetch(url, { credentials: 'include' })
      const data = await readJsonSafely(res)
      if (data?.success) setProjects(data.projects || [])
      else setProjects([])
    } catch { setProjects([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (courseId) fetchProjects() }, [courseId, selBatch])

  // auto-select first matching batch
  const matchingBatches = batches.filter(b =>
    subject ? b.programme === subject.programme : true
  )
  useEffect(() => {
    if (!subject || selBatch || matchingBatches.length === 0) return
    setSelBatch(matchingBatches[0]._id)
  }, [subject, matchingBatches])

  async function handleDelete(id) {
    if (!confirm('Delete this project?')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE', credentials: 'include' })
    setDetailProject(null)
    fetchProjects()
  }

  return (
    <div>
      <TopHeader
        title={subject ? subject.name : 'Projects'}
        subtitle={subject
          ? `${subject.code} · Level ${subject.level} · Semester ${subject.semester} · ${subject.programme}`
          : ''}
        action={
          <button onClick={() => router.back()}
            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            ← Back
          </button>
        }
      />

      <div className="px-8 py-6">

        {/* Show detail view OR table view */}
        {detailProject ? (
          <ProjectDetailView
            project={detailProject}
            onBack={() => setDetailProject(null)}
            onEdit={() => { setEditProject(detailProject); setShowModal(true) }}
            onDelete={() => handleDelete(detailProject._id)}
          />
        ) : (
          <>
            {/* Controls */}
            <div className="flex gap-3 mb-6 items-center">
              <select value={selBatch} onChange={e => setSelBatch(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">— All batches —</option>
                {matchingBatches.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>

              <button
                onClick={() => { setEditProject(null); setShowModal(true) }}
                className="ml-auto bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
                + Add project
              </button>
            </div>

            {/* Table */}
            {loading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : projects.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
                <p className="text-3xl mb-3">📁</p>
                <p className="text-sm text-gray-400">No projects yet for this course.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Supervisor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Student(s)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Start date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Docs</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p, idx) => (
                      <tr
                        key={p._id}
                        onClick={() => setDetailProject(p)}
                        className={`cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-50
                          ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3 text-gray-800 font-medium">{p.title}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${p.type === 'group' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {p.type === 'group' ? 'Group' : 'Individual'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.supervisorId?.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                          {p.students?.length === 0
                            ? '—'
                            : p.students?.map(s => s.name).join(', ')}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {p.startDate ? new Date(p.startDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${p.documents?.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {p.documents?.length || 0} / {EXPECTED_DOCS.length}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => { setEditProject(p); setShowModal(true) }}
                              className="text-xs text-blue-600 hover:underline">Edit</button>
                            <button
                              onClick={() => handleDelete(p._id)}
                              className="text-xs text-red-400 hover:underline">Delete</button>
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
      </div>

      {showModal && (
        <ProjectFormModal
          project={editProject}
          courseId={courseId}
          batchId={selBatch || matchingBatches[0]?._id || ''}
          onClose={() => { setShowModal(false); setEditProject(null) }}
          onSaved={() => {
            fetchProjects()
            setDetailProject(null)
          }}
        />
      )}
    </div>
  )
}