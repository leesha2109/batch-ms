'use client'

import { useState, useEffect } from 'react'
import UserModal from '@/components/UserModal'
import TopHeader from '@/components/TopHeader'
import { useUsers } from '@/hooks/useUsers'

const TYPE_TABS = [
  { label: 'All',                value: '' },
  { label: 'Permanent',          value: 'lecturer' },
  { label: 'Visiting',           value: 'visiting_lecturer' },
]

function LecturerProfile({ lecturer, onClose, onUpdate }) {
  const { users: lecturers } = useUsers('lecturer')
  const [editing, setEditing] = useState(false)
  const [form,    setForm]    = useState({
    name:     lecturer.name,
    isActive: lecturer.isActive,
    coordinatorId: lecturer.coordinatorId?._id || lecturer.coordinatorId || '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res  = await fetch(`/api/users/${lecturer._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...form,
        coordinatorId: form.coordinatorId || null,
      })
    })
    const data = await res.json()
    if (data.success) { onUpdate(); setEditing(false) }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold">Lecturer profile</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>

        <div className="px-6 py-5">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl font-semibold">
              {lecturer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{lecturer.name}</p>
              <p className="text-sm text-gray-400">
                {lecturer.role === 'visiting_lecturer' ? 'Visiting Lecturer' : 'Permanent Lecturer'}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                ${lecturer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                {lecturer.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Info grid */}
          <div className="space-y-3 mb-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-700 truncate">{lecturer.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Type</p>
                <p className="text-sm font-medium text-gray-700">
                  {lecturer.role === 'visiting_lecturer' ? 'Visiting' : 'Permanent'}
                </p>
              </div>
              {lecturer.role === 'visiting_lecturer' && (
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-400 mb-1">University coordinator</p>
                  <p className="text-sm font-medium text-gray-700">
                    {lecturer.coordinatorId?.name
                      ? `${lecturer.coordinatorId.name}${lecturer.coordinatorId.email ? ` (${lecturer.coordinatorId.email})` : ''}`
                      : '— Not assigned'}
                  </p>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-gray-400 mb-1">Joined</p>
                <p className="text-sm font-medium text-gray-700">
                  {lecturer.createdAt
                    ? new Date(lecturer.createdAt).toLocaleDateString()
                    : '—'}
                </p>
              </div>
            </div>

            {editing && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Full name</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
                </div>
                {lecturer.role === 'visiting_lecturer' && (
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">University coordinator</label>
                    <select
                      value={form.coordinatorId}
                      onChange={e => setForm(p => ({ ...p, coordinatorId: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="">— Select coordinator —</option>
                      {lecturers.map((option) => (
                        <option key={option._id} value={option._id}>
                          {option.name} ({option.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="activeCheck" checked={form.isActive}
                    onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                    className="w-4 h-4"/>
                  <label htmlFor="activeCheck" className="text-sm text-gray-600">Account active</label>
                </div>
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

export default function LecturersPage() {
  const [activeTab,   setActiveTab]   = useState('')
  const [search,       setSearch]      = useState('')
  const [lecturers,    setLecturers]   = useState([])
  const [loading,      setLoading]     = useState(false)
  const [showModal,    setShowModal]   = useState(false)
  const [editingUser,  setEditingUser] = useState(null)
  const [viewLecturer, setViewLecturer]= useState(null)
  const [deletingId,   setDeletingId]  = useState(null)

  async function fetchLecturers(typeFilter = '', q = '') {
    setLoading(true)
    try {
      // pull both lecturer and visiting_lecturer, then filter client-side by tab
      const res  = await fetch('/api/users?role=lecturer')
      const res2 = await fetch('/api/users?role=visiting_lecturer')
      const data  = await res.json()
      const data2 = await res2.json()

      let all = [
        ...(data.success  ? data.users  : []),
        ...(data2.success ? data2.users : []),
      ]

      if (typeFilter) all = all.filter(u => u.role === typeFilter)
      if (q) {
        const term = q.toLowerCase()
        all = all.filter(u =>
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
        )
      }

      setLecturers(all)
    } catch {
      setLecturers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true;
    fetchLecturers(activeTab, search).finally(() => {
      if (active) {
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [activeTab, search])

  function handleSearch(e) {
    setSearch(e.target.value)
    fetchLecturers(activeTab, e.target.value)
  }

  function handleAddLecturer() {
    setEditingUser(null)
    setShowModal(true)
  }

  function handleEdit(lecturer) {
    setEditingUser(lecturer)
    setShowModal(true)
  }

  async function handleDeactivate(id) {
    if (!confirm('Deactivate this lecturer?')) return
    setDeletingId(id)
    try {
      const res  = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (!data.success) {
        alert(data.message || 'Failed to deactivate lecturer')
      } else {
        fetchLecturers(activeTab, search)
      }
    } catch {
      alert('Failed to contact server')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <TopHeader
        title="Lecturers"
        subtitle="Manage permanent and visiting lecturers"
        action={
          <button onClick={handleAddLecturer}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors">
            + Add new lecturer
          </button>
        }
      />

      <div className="px-8 py-6">

        {/* Type tabs */}
        <div className="flex gap-2 mb-6 bg-blue-50/60 border border-blue-100 rounded-xl p-1.5 w-fit">
          {TYPE_TABS.map(tab => {
            const isActive = activeTab === tab.value

            return (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'text-blue-700 hover:bg-blue-100'}`}>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="mb-5">
          <input value={search} onChange={handleSearch}
            placeholder="Search by name or email..."
            className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"/>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs text-blue-500 mb-1">Total lecturers</p>
            <p className="text-2xl font-semibold text-blue-900">{lecturers.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-xs text-green-600 mb-1">Permanent</p>
            <p className="text-2xl font-semibold text-green-900">
              {lecturers.filter(l => l.role === 'lecturer').length}
            </p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <p className="text-xs text-orange-600 mb-1">Visiting</p>
            <p className="text-2xl font-semibold text-orange-900">
              {lecturers.filter(l => l.role === 'visiting_lecturer').length}
            </p>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-sm text-gray-400">Loading lecturers...</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Lecturer</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Type</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">Joined</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {lecturers.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                    No lecturers found
                  </td></tr>
                ) : lecturers.map(l => (
                  <tr key={l._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                          {l.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{l.name}</p>
                          <p className="text-xs text-gray-400">{l.email}</p>
                          {l.role === 'visiting_lecturer' && (
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Coordinator: {l.coordinatorId?.name || '—'}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${l.role === 'visiting_lecturer'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'}`}>
                        {l.role === 'visiting_lecturer' ? 'Visiting' : 'Permanent'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${l.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-500'}`}>
                        {l.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {l.createdAt
                        ? new Date(l.createdAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        <button onClick={() => setViewLecturer(l)}
                          className="text-xs text-blue-600 hover:underline">
                          View profile
                        </button>
                        <button onClick={() => handleEdit(l)}
                          className="text-xs text-blue-600 hover:underline">
                          Edit
                        </button>
                        {l.isActive && (
                          <button onClick={() => handleDeactivate(l._id)}
                            disabled={deletingId === l._id}
                            className="text-xs text-red-400 hover:underline disabled:opacity-50">
                            {deletingId === l._id ? '...' : 'Deactivate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / edit lecturer — same UserModal used in Users page, staff mode */}
      {showModal && (
        <UserModal
          user={editingUser}
          mode="staff"
          onClose={() => { setShowModal(false); setEditingUser(null) }}
          onSaved={() => { fetchLecturers(activeTab, search); setShowModal(false); setEditingUser(null) }}
        />
      )}

      {viewLecturer && (
        <LecturerProfile
          lecturer={viewLecturer}
          onClose={() => setViewLecturer(null)}
          onUpdate={() => {
            fetchLecturers(activeTab, search)
            setViewLecturer(null)
          }}
        />
      )}
    </div>
  )
}