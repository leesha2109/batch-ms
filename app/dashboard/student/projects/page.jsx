'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import TopHeader from '@/components/TopHeader'

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

const MILESTONES = [
  { key: 'titleConfirmed',    label: 'Confirm project title',   desc: 'Your project title has been finalised and approved' },
  { key: 'proposalSubmitted', label: 'Submit project proposal', desc: 'Research proposal submitted to supervisor'           },
  { key: 'interimSubmitted',  label: 'Submit interim report',   desc: 'Interim progress report submitted'                  },
  { key: 'finalSubmitted',    label: 'Final report submission', desc: 'Final thesis/report submitted for evaluation'       },
]

const REQUIRED_DOCS = [
  { key: 'research_proposal', label: 'Research Proposal', file: 'Annex_01_Research_proposal_format.docx' },
  { key: 'interim_report',    label: 'Interim Report',    file: 'Annex_02_Interim_Report_Format.docx'   },
  { key: 'manuscript',        label: 'Manuscript',        file: 'Annex_03_Manuscrip_format.docx'        },
  { key: 'final_thesis',      label: 'Final Thesis',      file: 'Annex_04_Final_THESIS_Format.docx'     },
]

// ── Document upload slot ──────────────────────────────────────
function DocSlot({ doc, uploadedDoc, projectId, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('docKey',   doc.key)
      formData.append('docLabel', doc.label)
      const res  = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const data = await res.json()
      if (!data.success) { setError(data.message); return }
      onUploaded()
    } catch { setError('Upload failed') }
    finally  { setUploading(false) }
  }

  async function handleRemove() {
    if (!confirm('Remove this document?')) return
    await fetch(`/api/projects/${projectId}/documents`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docUrl: uploadedDoc.url }),
      credentials: 'include',
    })
    onUploaded()
  }

  return (
    <div className={`rounded-xl border p-4 transition-all
      ${uploadedDoc ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{uploadedDoc ? '📄' : '📭'}</span>
          <div>
            <p className="text-sm font-medium text-gray-800">{doc.label}</p>
            {uploadedDoc
              ? <p className="text-xs text-green-600 font-medium">✓ Uploaded</p>
              : <p className="text-xs text-gray-400">Not submitted yet</p>}
          </div>
        </div>
        {uploadedDoc && (
          <a href={uploadedDoc.url} target="_blank" rel="noreferrer" download
            className="text-xs text-blue-600 hover:underline">
            ⬇ View
          </a>
        )}
      </div>
      {uploadedDoc && (
        <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-100 mb-3">
          <p className="text-xs text-gray-600 truncate max-w-[200px]">{uploadedDoc.name}</p>
          <button onClick={handleRemove}
            className="text-xs text-red-400 hover:underline ml-2 flex-shrink-0">
            Remove
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <label className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-2.5 cursor-pointer transition-colors
        ${uploading
          ? 'border-gray-200 opacity-50 cursor-not-allowed'
          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
        <span className="text-xs text-gray-500">
          {uploading ? 'Uploading...' : uploadedDoc ? '↺ Replace file' : '+ Upload file'}
        </span>
        <input type="file" accept=".pdf,.doc,.docx,.zip"
          onChange={handleUpload} className="hidden" disabled={uploading}/>
      </label>
    </div>
  )
}

// ── Project detail view ───────────────────────────────────────
function ProjectDetail({ project, onBack, onUploaded }) {
  const docs = project.documents || []
  const milestones = project.milestones || {}
  const completedCount = MILESTONES.filter(m => milestones[m.key]).length

  async function toggleMilestone(key, currentValue) {
    try {
      const res = await fetch(`/api/projects/${project._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [`milestones.${key}`]: !currentValue }),
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) onUploaded()
    } catch {}
  }

  return (
    <div className="space-y-5">

      <button onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        ← Back to my projects
      </button>

      {/* Project header */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${project.type === 'group' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            {project.type === 'group' ? 'Group' : 'Individual'}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status]}`}>
            {STATUS_LABELS[project.status]}
          </span>
          {project.subjectId?.code && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono">
              {project.subjectId.code}
            </span>
          )}
        </div>

        <h2 className="text-base font-semibold text-gray-800 mb-1">{project.title}</h2>
        {project.description && (
          <p className="text-sm text-gray-500 mb-3">{project.description}</p>
        )}

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-50">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Supervisor</p>
            <p className="text-sm font-medium text-gray-700">
              {project.supervisorId?.name || '—'}
            </p>
            {project.supervisorId?.email && (
              <p className="text-xs text-gray-400">{project.supervisorId.email}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Start date</p>
            <p className="text-sm font-medium text-gray-700">
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">
              {project.type === 'group' ? 'Team members' : 'Student'}
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

      {/* Milestone tracker — student editable */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-gray-700">Project Progress</h3>
          <span className="text-xs text-gray-400">{completedCount} / 4 completed</span>
        </div>

        <div className="space-y-3">
          {MILESTONES.map((milestone, idx) => {
            const isChecked = !!milestones[milestone.key]
            const prevKey   = MILESTONES[idx - 1]?.key
            const prevDone  = idx === 0 || !!milestones[prevKey]

            return (
              <div key={milestone.key}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all
                  ${isChecked
                    ? 'bg-green-50 border-green-200'
                    : prevDone
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-100 opacity-60'}`}>

                {/* Toggle button */}
                <button
                  disabled={!prevDone}
                  onClick={() => toggleMilestone(milestone.key, isChecked)}
                  className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all
                    ${isChecked
                      ? 'bg-green-500 border-green-500 text-white'
                      : prevDone
                      ? 'bg-white border-blue-400 hover:bg-blue-50'
                      : 'bg-white border-gray-200 cursor-not-allowed'}`}>
                  {isChecked
                    ? <span className="text-xs font-bold">✓</span>
                    : prevDone
                    ? <span className="w-2 h-2 rounded-full bg-blue-400 block" />
                    : null}
                </button>

                {/* Label + desc */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 w-5">{idx + 1}.</span>
                    <p className={`text-sm font-medium
                      ${isChecked ? 'text-green-700 line-through' : prevDone ? 'text-blue-800' : 'text-gray-400'}`}>
                      {milestone.label}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 ml-7">{milestone.desc}</p>
                </div>

                {/* Status pill */}
                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium
                  ${isChecked
                    ? 'bg-green-100 text-green-700'
                    : prevDone
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-400'}`}>
                  {isChecked ? 'Done' : prevDone ? 'Pending' : 'Locked'}
                </span>
              </div>
            )
          })}
        </div>

        {/* Overall progress bar */}
        <div className="mt-5 pt-4 border-t border-gray-50">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Overall completion</span>
            <span>{Math.round((completedCount / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${(completedCount / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Document upload slots */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Submit your documents</h3>
          <span className="text-xs text-gray-400">
            {docs.length} / {REQUIRED_DOCS.length} uploaded
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {REQUIRED_DOCS.map((doc, idx) => (
            <DocSlot
              key={doc.key}
              doc={doc}
              uploadedDoc={docs[idx] || null}
              projectId={project._id}
              onUploaded={onUploaded}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function StudentProjectsPage() {
  const { data: session, status } = useSession()
  const [projects,        setProjects]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)

  const studentId = session?.user?.id
  const batchId   = session?.user?.batchId

  async function fetchProjects() {
    if (!studentId) return
    setLoading(true)
    try {
      const res  = await fetch(
        `/api/projects?studentId=${studentId}${batchId ? `&batchId=${batchId}` : ''}`,
        { credentials: 'include' }
      )
      const data = await res.json()
      if (data.success) {
        const filtered = (data.projects || []).filter(p =>
          !p.subjectId || p.subjectId.type === 'project'
        )
        setProjects(filtered)
      } else {
        setProjects([])
      }
    } catch { setProjects([]) }
    finally  { setLoading(false) }
  }

  useEffect(() => {
    if (status === 'authenticated' && studentId) fetchProjects()
  }, [status, studentId])

  async function handleUploaded() {
    await fetchProjects()
    if (selectedProject) {
      try {
        const res  = await fetch(`/api/projects/${selectedProject._id}`, { credentials: 'include' })
        const data = await res.json()
        if (data.success) setSelectedProject(data.project)
      } catch {}
    }
  }

  if (status === 'loading') {
    return (
      <div>
        <TopHeader title="My Projects" subtitle="Loading..." />
        <div className="px-8 py-6">
          <p className="text-sm text-gray-400">Loading session...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <TopHeader
        title="My Projects"
        subtitle="View your assigned project and submit required documents"
      />

      <div className="px-8 py-6 space-y-6">
        {selectedProject ? (
          <ProjectDetail
            project={selectedProject}
            onBack={() => setSelectedProject(null)}
            onUploaded={handleUploaded}
          />
        ) : (
          <>
            {/* Project cards */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">My Project</h3>

              {loading ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : projects.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
                  <p className="text-3xl mb-3">📁</p>
                  <p className="text-sm text-gray-500 font-medium mb-1">No project assigned yet</p>
                  <p className="text-xs text-gray-400">
                    Your supervisor will assign your project. Check back later.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {projects.map(p => {
                    const docsCount      = p.documents?.length || 0
                    const allUploaded    = docsCount >= REQUIRED_DOCS.length
                    const milestones     = p.milestones || {}
                    const completedCount = MILESTONES.filter(m => milestones[m.key]).length

                    return (
                      <div
                        key={p._id}
                        onClick={() => setSelectedProject(p)}
                        className="bg-white border border-gray-100 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${p.type === 'group' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {p.type === 'group' ? 'Group' : 'Individual'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>
                            {STATUS_LABELS[p.status]}
                          </span>
                          {p.subjectId?.code && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono">
                              {p.subjectId.code}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-semibold text-gray-800 mb-1 group-hover:text-blue-700 transition-colors">
                          {p.title}
                        </h3>
                        {p.description && (
                          <p className="text-xs text-gray-400 mb-3 line-clamp-2">{p.description}</p>
                        )}

                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {p.supervisorId?.name?.charAt(0) || '?'}
                          </div>
                          <p className="text-xs text-gray-500">
                            {p.supervisorId?.name || 'No supervisor assigned'}
                          </p>
                        </div>

                        {/* Milestone progress bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Milestones</span>
                            <span>{completedCount} / 4</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${(completedCount / 4) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${allUploaded ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {allUploaded
                              ? '✓ All docs submitted'
                              : `${docsCount}/${REQUIRED_DOCS.length} docs submitted`}
                          </span>
                          <span className="text-xs text-gray-400 group-hover:text-blue-600">
                            Open →
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Download submission templates */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                Submission templates
              </h4>
              <p className="text-xs text-gray-400 mb-4">
                Download the required format templates before submitting your documents.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {REQUIRED_DOCS.map(doc => (
                    <a
                    key={doc.key}
                    href={`/Research/${doc.file}`}
                    download
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📝</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{doc.label}</p>
                        <p className="text-xs text-gray-400">{doc.file}</p>
                      </div>
                    </div>
                    <span className="text-xs text-blue-600 flex-shrink-0 ml-2 group-hover:underline">
                      ⬇ Download
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}