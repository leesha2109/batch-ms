'use client'

import { useState, useEffect } from 'react'
import { useBatches } from '@/hooks/useBatches'

// staff roles only — student is handled by mode="student"
const STAFF_ROLES = [
  { value: 'coordinator',       label: 'Batch Coordinator' },
  { value: 'lecturer',          label: 'Lecturer' },
  { value: 'visiting_lecturer', label: 'Visiting Lecturer' },
]

export default function UserModal({ user, onClose, onSaved, mode }) {
  const isEditing = !!(user && user._id)

  // mode comes from the caller, or is inferred from the user being edited
  const resolvedMode = mode || (user?.role === 'student' ? 'student' : 'staff')
  const isStudentMode = resolvedMode === 'student'

  const { batches } = useBatches()

  const [form, setForm] = useState({
    name:        '',
    email:       '',
    password:    '',
    role:        'lecturer',
    batchId:     '',
    isActive:    true,
    // student-only fields
    studentId:   '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        name:        user.name        || '',
        email:       user.email       || '',
        password:    '',
        role:        user.role        || (isStudentMode ? 'student' : 'lecturer'),
        batchId:     user.batchId?._id || user.batchId || '',
        isActive:    user.isActive ?? true,
        studentId:   user.studentId   || ''
       
      })
    } else {
      setForm(prev => ({
        ...prev,
        role: isStudentMode ? 'student' : 'lecturer',
      }))
    }
  }, [user, isStudentMode])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // student mode requires a batch
    if (isStudentMode && !form.batchId) {
      setError('Please select a batch for the student')
      return
    }
    // coordinator requires a batch too
    if (!isStudentMode && form.role === 'coordinator' && !form.batchId) {
      setError('Please select a batch for the coordinator')
      return
    }

    setLoading(true)

    try {
      const url = isEditing
        ? (isStudentMode ? `/api/students/${user._id}` : `/api/users/${user._id}`)
        : (isStudentMode ? '/api/students'              : '/api/users')

      const method = isEditing ? 'PATCH' : 'POST'

      const body = { ...form }
      if (isEditing && !body.password) delete body.password

      if (isStudentMode) {
        // /api/students doesn't take a role field — it's implied
        delete body.role
      } else {
        // staff payload doesn't need student-only fields
        delete body.studentId
    
        // only coordinators carry a batch in the staff form
        if (body.role !== 'coordinator') delete body.batchId
      }

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })
      const data = await res.json()

      if (!data.success) { setError(data.message); return }

      onSaved()
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-gray-800">
            {isEditing
              ? (isStudentMode ? 'Edit student' : 'Edit user')
              : (isStudentMode ? 'Enroll new student' : 'Add new lecturer')}
          </h2>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* ── STAFF MODE ── */}
          {!isStudentMode && (
            <>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Full name</label>
                <input name="name" value={form.name} onChange={handleChange} required
                  placeholder="e.g. Kasun Perera"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Email address</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required
                  placeholder="kasun@university.lk"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  {isEditing ? 'New password (leave blank to keep current)' : 'Password'}
                </label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  required={!isEditing} placeholder="Minimum 6 characters"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Role</label>
                <select name="role" value={form.role} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                  {STAFF_ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* batch only matters for coordinators */}
              {form.role === 'coordinator' && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Assign to batch (required)
                  </label>
                  <select name="batchId" value={form.batchId} onChange={handleChange} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                    <option value="">— Select batch —</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>{b.name} ({b.programme})</option>
                    ))}
                  </select>
                </div>
              )}

              {isEditing && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="isActive" id="isActive"
                    checked={form.isActive} onChange={handleChange} className="w-4 h-4"/>
                  <label htmlFor="isActive" className="text-sm text-gray-600">
                    Account is active
                  </label>
                </div>
              )}
            </>
          )}

          {/* ── STUDENT MODE ── */}
          {isStudentMode && (
            <>
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
                <label className="text-xs text-gray-500 block mb-1">
                  {isEditing ? 'New password (leave blank to keep current)' : 'Password'}
                </label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  required={!isEditing} placeholder="Minimum 6 characters"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Batch (required)</label>
                <select name="batchId" value={form.batchId} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                  <option value="">— Select batch —</option>
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>{b.name} ({b.programme})</option>
                  ))}
                </select>
              </div>

              

            
              {isEditing && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="isActive" id="isActiveStudent"
                    checked={form.isActive} onChange={handleChange} className="w-4 h-4"/>
                  <label htmlFor="isActiveStudent" className="text-sm text-gray-600">
                    Account is active
                  </label>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-gray-900 text-white py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50">
              {loading
                ? 'Saving...'
                : isEditing
                  ? 'Save changes'
                  : (isStudentMode ? 'Enroll student' : 'Create user')}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}