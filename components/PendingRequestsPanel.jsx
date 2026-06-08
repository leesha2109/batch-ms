'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PendingRequestsPanel({ requests: initial }) {
  const [requests, setRequests] = useState(initial)
  const [loading, setLoading] = useState(null)
  const router = useRouter()

  const handleReject = async (id) => {
    setLoading(id + 'rejected')
    await fetch(`/api/request-access/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' })
    })
    setRequests(prev => prev.filter(r => r._id !== id))
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        Pending Access Requests
        {requests.length > 0 && (
          <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
            {requests.length}
          </span>
        )}
      </h2>

      {requests.length === 0 ? (
        <p className="text-sm text-gray-400">No pending requests right now.</p>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div
              key={req._id}
              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{req.name}</p>
                <p className="text-xs text-gray-400">
                  {req.email} · {req.role}
                  {req.studentNumber ? ` · ${req.studentNumber}` : ''}
                </p>
                <p className="text-xs text-gray-300 mt-0.5">
                  {new Date(req.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    localStorage.setItem('pendingRequest', JSON.stringify({
                      name: req.name,
                      email: req.email,
                      role: req.role,
                      studentNumber: req.studentNumber || '',
                      requestId: req._id
                    }))
                    router.push('/dashboard/hod/users')
                  }}
                  disabled={!!loading}
                  className="text-xs px-3 py-1.5 bg-gray-900 text-white border border-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-50 cursor-pointer"
                >
                  + Add User
                </button>
                <button
                  onClick={() => handleReject(req._id)}
                  disabled={!!loading}
                  className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                >
                  {loading === req._id + 'rejected' ? '...' : '✕ Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}