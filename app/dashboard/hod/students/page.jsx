'use client'

import { useState } from 'react'
import { useBatches } from '@/hooks/useBatches'
import TopHeader from '@/components/TopHeader'

function EnrollModal({ batches, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    batchId: '', studentId: ''
    
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
      const res  = await fetch('/api/students', {
        method: 'POST',
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
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-base font-semibold">Enroll new student</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Full name</label>
              <input name="name" value={form.name} onChange={handleChange} required
                placeholder="Kasun Perera"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Student ID</label>
              <input name="studentId" value={form.studentId} onChange={handleChange}
                placeholder="BSc/2022/001"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required
              placeholder="kasun@university.lk"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required
              placeholder="Minimum 6 characters"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Batch</label>
            <select name="batchId" value={form.batchId} onChange={handleChange} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
              <option value="">— Select batch —</option>
              {batches.map(b => (
                <option key={b._id} value={b._id}>{b.name} ({b.programme})</option>
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
              {loading ? 'Enrolling...' : 'Enroll student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StudentProfile({ student, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [form,    setForm]    = useState({
    name:        student.name,
    phone:       student.phone       || '',
    isActive:    student.isActive,
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res  = await fetch(`/api/students/${student._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (data.success) { onUpdate(); setEditing(false) }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold">Student profile</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>

        <div className="px-6 py-5">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl font-semibold">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{student.name}</p>
              <p className="text-sm text-gray-400">{student.studentId || 'No student ID'}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                ${student.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                {student.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Info grid */}
          <div className="space-y-3 mb-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-700 truncate">{student.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Batch</p>
                <p className="text-sm font-medium text-gray-700">
                  {student.batchId?.name || '—'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Programme</p>
                <p className="text-sm font-medium text-gray-700">
                  {student.batchId?.programme || '—'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Enrolled</p>
                <p className="text-sm font-medium text-gray-700">
                  {student.enrolledAt
                    ? new Date(student.enrolledAt).toLocaleDateString()
                    : '—'}
                </p>
              </div>
            </div>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Full name</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
                </div>
                
                
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="activeCheck" checked={form.isActive}
                    onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                    className="w-4 h-4"/>
                  <label htmlFor="activeCheck" className="text-sm text-gray-600">Account active</label>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {student.phone && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Phone</p>
                    <p className="text-sm font-medium text-gray-700">{student.phone}</p>
                  </div>
                )}
                {student.address && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Address</p>
                    <p className="text-sm font-medium text-gray-700">{student.address}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </>
            ) : (
              <>
                <button onClick={onClose}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">
                  Close
                </button>
                <button onClick={() => setEditing(true)}
                  className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm">
                  Edit profile
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StudentsPage() {
  const { batches }                   = useBatches()
  const [selBatch,    setSelBatch]    = useState('')
  const [search,      setSearch]      = useState('')
  const [students,    setStudents]    = useState([])
  const [loading,     setLoading]     = useState(false)
  const [showEnroll,  setShowEnroll]  = useState(false)
  const [viewStudent, setViewStudent] = useState(null)

  async function fetchStudents(batchId = '', q = '') {
    setLoading(true)
    let url = '/api/students?'
    if (batchId) url += `batchId=${batchId}&`
    if (q)       url += `search=${q}`
    const res  = await fetch(url)
    const data = await res.json()
    if (data.success) setStudents(data.students)
    setLoading(false)
  }

  // fetch when batch or search changes
  useState(() => { fetchStudents(selBatch, search) }, [])

  function handleBatchChange(e) {
    setSelBatch(e.target.value)
    fetchStudents(e.target.value, search)
  }

  function handleSearch(e) {
    setSearch(e.target.value)
    fetchStudents(selBatch, e.target.value)
  }

  return (
    <div>
      <TopHeader
        title="Students"
        subtitle="Manage student enrollment and profiles"
        action={
          <button onClick={() => setShowEnroll(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
            + Enroll student
          </button>
        }
      />

      <div className="px-8 py-6">

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <select value={selBatch} onChange={handleBatchChange}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="">All batches</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
          <input value={search} onChange={handleSearch}
            placeholder="Search by name, email or student ID..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-72"/>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Total students</p>
            <p className="text-2xl font-semibold text-gray-800">{students.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Active</p>
            <p className="text-2xl font-semibold text-gray-800">
              {students.filter(s => s.isActive).length}
            </p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Inactive</p>
            <p className="text-2xl font-semibold text-gray-800">
              {students.filter(s => !s.isActive).length}
            </p>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-sm text-gray-400">Loading students...</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Student</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Student ID</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Batch</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Programme</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Enrolled</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                    No students found
                  </td></tr>
                ) : students.map(s => (
                  <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">
                      {s.studentId || '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {s.batchId?.name || '—'}
                    </td>
                    <td className="px-5 py-3">
                      {s.batchId?.programme && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${s.batchId.programme === 'BSc'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-orange-700'}`}>
                          {s.batchId.programme}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${s.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-500'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {s.enrolledAt
                        ? new Date(s.enrolledAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => setViewStudent(s)}
                        className="text-xs text-blue-600 hover:underline">
                        View profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEnroll && (
        <EnrollModal
          batches={batches}
          onClose={() => setShowEnroll(false)}
          onSaved={() => fetchStudents(selBatch, search)}
        />
      )}

      {viewStudent && (
        <StudentProfile
          student={viewStudent}
          onClose={() => setViewStudent(null)}
          onUpdate={() => {
            fetchStudents(selBatch, search)
            setViewStudent(null)
          }}
        />
      )}
    </div>
  )
}